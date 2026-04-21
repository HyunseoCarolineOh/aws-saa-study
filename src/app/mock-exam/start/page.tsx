"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import type { Question } from "@/lib/types";
import { addAttempt, saveMockExamResult } from "@/lib/store";
import MarkdownContent from "@/components/MarkdownContent";

// SAA-C03 도메인별 출제 비중 (10문제 기준)
const DOMAIN_QUOTA: Record<string, number> = {
  "보안 아키텍처": 3,
  "복원력 아키텍처": 3,
  "고성능 아키텍처": 2,
  "비용 최적화": 2,
};

const EXAM_TIME = 15 * 60; // 15분 = 900초
const TOTAL_QUESTIONS = 10;

export default function MockExamStartPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [timeLeft, setTimeLeft] = useState(EXAM_TIME);
  const [phase, setPhase] = useState<"loading" | "exam" | "result">("loading");
  const [results, setResults] = useState<{
    correct: number;
    total: number;
    domainScores: Record<string, { correct: number; total: number }>;
    wrongQuestions: { index: number; question: Question; selected: string[] }[];
  } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startedAtRef = useRef<string>(new Date().toISOString());

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    if (phase !== "exam") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  async function loadQuestions() {
    try {
      const res = await fetch("/api/questions");
      const data = await res.json();
      const allQuestions = data.questions as Question[];

      // 도메인별로 분류
      const domainBuckets: Record<string, Question[]> = {};
      for (const domain of Object.keys(DOMAIN_QUOTA)) {
        domainBuckets[domain] = [];
      }
      for (const q of allQuestions) {
        const domain = guessDomain(q);
        if (domainBuckets[domain]) {
          domainBuckets[domain].push(q);
        }
      }

      // 각 도메인 셔플
      for (const domain of Object.keys(domainBuckets)) {
        domainBuckets[domain].sort(() => Math.random() - 0.5);
      }

      // 도메인별 할당량에 따라 선별
      const selected: Question[] = [];
      const remaining: Question[] = [];

      for (const [domain, quota] of Object.entries(DOMAIN_QUOTA)) {
        const bucket = domainBuckets[domain];
        selected.push(...bucket.slice(0, quota));
        remaining.push(...bucket.slice(quota));
      }

      // 할당량 미달 시 나머지에서 보충
      if (selected.length < TOTAL_QUESTIONS) {
        remaining.sort(() => Math.random() - 0.5);
        selected.push(...remaining.slice(0, TOTAL_QUESTIONS - selected.length));
      }

      // 최종 셔플
      selected.sort(() => Math.random() - 0.5);
      setQuestions(selected.slice(0, TOTAL_QUESTIONS));
      startedAtRef.current = new Date().toISOString();
      setPhase("exam");
    } catch {
      setPhase("exam");
    }
  }

  function handleSelect(label: string) {
    const q = questions[currentIndex];
    const expectedCount = detectMultiSelectCount(q.question_text);
    const isMulti = expectedCount > 1 || q.correct_answers.length > 1;
    const selectCount = Math.max(expectedCount, q.correct_answers.length);
    setAnswers((prev) => {
      const current = prev[currentIndex] || [];
      if (isMulti) {
        if (current.includes(label)) {
          return { ...prev, [currentIndex]: current.filter((a) => a !== label) };
        }
        if (current.length >= selectCount) {
          return { ...prev, [currentIndex]: [...current.slice(1), label] };
        }
        return { ...prev, [currentIndex]: [...current, label] };
      }
      return { ...prev, [currentIndex]: [label] };
    });
  }

  const handleFinish = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    let correct = 0;
    const domainScores: Record<string, { correct: number; total: number }> = {};
    const wrongQuestions: { index: number; question: Question; selected: string[] }[] = [];

    questions.forEach((q, i) => {
      const selected = answers[i] || [];
      const isCorrect =
        selected.length === q.correct_answers.length &&
        selected.every((a) => q.correct_answers.includes(a));

      if (isCorrect) correct++;

      const domain = guessDomain(q);
      if (!domainScores[domain]) domainScores[domain] = { correct: 0, total: 0 };
      domainScores[domain].total++;
      if (isCorrect) domainScores[domain].correct++;

      if (!isCorrect) {
        wrongQuestions.push({ index: i, question: q, selected });
      }

      addAttempt({
        question_id: q.id,
        selected_answers: selected,
        is_correct: isCorrect,
        time_spent_seconds: 0,
      });
    });

    const score = Math.round((correct / questions.length) * 1000);

    saveMockExamResult({
      id: crypto.randomUUID(),
      started_at: startedAtRef.current,
      finished_at: new Date().toISOString(),
      question_ids: questions.map((q) => q.id),
      answers,
      total_questions: questions.length,
      correct_count: correct,
      score,
      passed: score >= 720,
      domain_scores: domainScores,
    });

    setResults({ correct, total: questions.length, domainScores, wrongQuestions });
    setPhase("result");
  }, [questions, answers]);

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  // --- 로딩 ---
  if (phase === "loading") {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 text-center">
        <p className="text-muted">모의고사 준비 중... (도메인별 10문제 선별)</p>
      </div>
    );
  }

  // --- 결과 ---
  if (phase === "result" && results) {
    const score = Math.round((results.correct / results.total) * 1000);
    const passed = score >= 720;
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
        <h1 className="text-xl font-bold mb-4">모의고사 결과</h1>

        <div className={`rounded-2xl p-6 mb-4 text-on-primary text-center ${passed ? "bg-success" : "bg-danger"}`}>
          <p className="text-sm opacity-80 mb-1">{passed ? "합격!" : "불합격"}</p>
          <p className="text-4xl font-bold mb-1">{score} / 1000</p>
          <p className="text-sm opacity-80">정답 {results.correct} / {results.total}문제 (합격 기준: 720점)</p>
        </div>

        {/* 도메인별 정답률 */}
        <div className="bg-card rounded-xl border border-border p-4 mb-4">
          <h2 className="font-semibold mb-3">도메인별 정답률</h2>
          <div className="space-y-3">
            {Object.entries(results.domainScores).map(([domain, s]) => {
              const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
              return (
                <div key={domain}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{domain}</span>
                    <span className="text-muted">{s.correct}/{s.total} ({pct}%)</span>
                  </div>
                  <div className="bg-border rounded-full h-2">
                    <div
                      className={`rounded-full h-2 ${pct >= 70 ? "bg-success" : "bg-danger"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 오답 해설 */}
        {results.wrongQuestions.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4 mb-4">
            <h2 className="font-semibold mb-3">오답 해설 ({results.wrongQuestions.length}문제)</h2>
            <div className="space-y-4">
              {results.wrongQuestions.map(({ index, question, selected }) => (
                <div key={question.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <p className="text-xs text-muted mb-1">문제 {index + 1}</p>
                  <p className="text-sm leading-relaxed mb-2 whitespace-pre-line">{question.question_text}</p>

                  <div className="space-y-1 mb-2">
                    {question.options.map((opt) => {
                      const isSelected = selected.includes(opt.label);
                      const isCorrect = question.correct_answers.includes(opt.label);
                      let style = "text-muted";
                      if (isCorrect) style = "text-success-fg font-medium";
                      if (isSelected && !isCorrect) style = "text-danger-fg line-through";
                      return (
                        <p key={opt.label} className={`text-xs ${style}`}>
                          {opt.label}. {opt.text}
                          {isCorrect && " ✓"}
                          {isSelected && !isCorrect && " (내 답)"}
                        </p>
                      );
                    })}
                  </div>

                  {question.explanation && (
                    <div className="bg-info-bg border border-info-border rounded-lg p-3 mt-2">
                      <MarkdownContent className="text-info-fg">
                        {question.explanation}
                      </MarkdownContent>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Link href="/mock-exam" className="flex-1 block bg-card border border-border text-center py-3 rounded-xl font-medium text-sm">
            시험 기록 보기
          </Link>
          <Link href="/" className="flex-1 block bg-primary text-on-primary text-center py-3 rounded-xl font-medium text-sm">
            홈으로
          </Link>
        </div>
      </div>
    );
  }

  // --- 시험 진행 ---
  if (questions.length === 0) return null;

  const q = questions[currentIndex];
  const selected = answers[currentIndex] || [];
  const expectedCount = detectMultiSelectCount(q.question_text);
  const isMulti = expectedCount > 1 || q.correct_answers.length > 1;
  const selectCount = Math.max(expectedCount, q.correct_answers.length);
  const isTimeWarning = timeLeft < 180; // 3분 미만

  return (
    <div className="max-w-lg mx-auto px-4 pt-2 pb-24">
      {/* 상단 바: 타이머 + 진행률 */}
      <div className="sticky top-0 bg-background z-10 pb-2 pt-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">{currentIndex + 1} / {questions.length}</span>
          <span className={`text-sm font-mono font-bold ${isTimeWarning ? "text-danger" : "text-muted"}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
        <div className="bg-border rounded-full h-1.5">
          <div
            className="bg-primary rounded-full h-1.5 transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 문제 */}
      <div className="bg-card rounded-xl border border-border p-4 mb-3 mt-2">
        {isMulti && (
          <span className="inline-block text-xs bg-warning-bg text-warning-fg border border-warning-border px-2 py-0.5 rounded mb-2">{selectCount}개 선택</span>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-line">{q.question_text}</p>
      </div>

      {/* 선택지 */}
      <div className="space-y-2 mb-3">
        {q.options.map((opt) => {
          const isSelected = selected.includes(opt.label);
          return (
            <button
              key={opt.label}
              onClick={() => handleSelect(opt.label)}
              className={`w-full text-left rounded-xl border-2 p-3 transition-all active:scale-[0.99] ${
                isSelected ? "border-primary bg-info-bg" : "border-border bg-card"
              }`}
            >
              <div className="flex gap-3">
                <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  isSelected ? "bg-primary text-on-primary" : "bg-muted-bg text-muted"
                }`}>
                  {opt.label}
                </span>
                <span className="text-sm leading-relaxed">{opt.text}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 네비게이션 */}
      <div className="flex gap-2">
        <button
          onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
          disabled={currentIndex === 0}
          className="flex-1 py-3 rounded-xl border border-border text-sm font-medium disabled:opacity-30"
        >
          이전
        </button>
        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex((p) => p + 1)}
            className="flex-1 py-3 rounded-xl bg-primary text-on-primary text-sm font-medium"
          >
            다음
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="flex-1 py-3 rounded-xl bg-danger text-on-primary text-sm font-medium"
          >
            시험 종료
          </button>
        )}
      </div>

      {/* 문제 번호 그리드 */}
      <div className="mt-4">
        <p className="text-xs text-muted mb-2">문제 번호 (클릭하여 이동)</p>
        <div className="flex gap-1 flex-wrap">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-8 h-8 rounded text-xs font-medium ${
                i === currentIndex
                  ? "bg-primary text-on-primary"
                  : answers[i]
                  ? "bg-info-bg text-info-fg"
                  : "bg-muted-bg text-muted"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function detectMultiSelectCount(text: string): number {
  if (/3개를?\s*선택|세\s*가지를?\s*선택|choose\s*3|select\s*3/i.test(text)) return 3;
  if (/2개를?\s*선택|두\s*(?:개를?|가지를?)\s*선택|choose\s*2|select\s*2/i.test(text)) return 2;
  return 1;
}

function guessDomain(q: Question): string {
  const text = (q.question_text + " " + q.options.map((o) => o.text).join(" ")).toLowerCase();
  const svcs = (q.related_services || []).join(" ").toLowerCase();
  const combined = text + " " + svcs;

  if (/iam|cognito|kms|waf|shield|guard|encrypt|보안|인증|암호|acm|secret/.test(combined))
    return "보안 아키텍처";
  if (/auto scaling|multi.?az|failover|disaster|복원|가용성|백업|replica|aurora.*read/.test(combined))
    return "복원력 아키텍처";
  if (/cost|비용|절감|예산|saving|budget|reserved|spot|glacier/.test(combined))
    return "비용 최적화";
  return "고성능 아키텍처";
}
