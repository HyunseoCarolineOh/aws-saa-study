"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import type { Question } from "@/lib/types";
import { addAttempt, saveMockExamResult } from "@/lib/store";

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

  if (phase === "loading") {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 text-center">
        <p className="text-muted font-bold animate-jelly-bounce">🎀 보스 준비 중...</p>
      </div>
    );
  }

  if (phase === "result" && results) {
    const score = Math.round((results.correct / results.total) * 1000);
    const passed = score >= 720;
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
        <div className="mb-4">
          <p className="text-xs text-muted font-bold tracking-wide">BATTLE RESULT</p>
          <h1 className="text-2xl font-black text-jelly-pink">보스전 결과 🏁</h1>
        </div>

        <div
          className="rounded-[28px] p-6 mb-4 text-center animate-pop-in text-on-primary"
          style={
            passed
              ? {
                  background: "linear-gradient(135deg, #7bff9a 0%, #4adede 100%)",
                  boxShadow: "0 16px 44px -6px rgba(123, 255, 154, 0.5), inset 0 3px 0 rgba(255, 255, 255, 0.3)",
                  color: "#0d0823",
                }
              : {
                  background: "linear-gradient(135deg, #ff4d8f 0%, #c86fff 100%)",
                  boxShadow: "0 16px 44px -6px rgba(255, 77, 143, 0.5), inset 0 3px 0 rgba(255, 255, 255, 0.3)",
                }
          }
        >
          <p className="text-4xl mb-2">{passed ? "🏆" : "💥"}</p>
          <p className="text-sm font-black opacity-90 mb-1">{passed ? "승리!!" : "패배"}</p>
          <p className="text-4xl font-black mb-1">
            {score}<span className="text-xl opacity-70"> / 1000</span>
          </p>
          <p className="text-xs opacity-90 font-bold">
            {results.correct} / {results.total}문제 명중 · 합격 720점
          </p>
        </div>

        <div className="jelly-card p-5 mb-4">
          <h2 className="font-black text-base text-jelly-purple mb-3">🎯 도메인별 명중률</h2>
          <div className="space-y-3">
            {Object.entries(results.domainScores).map(([domain, s]) => {
              const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
              const good = pct >= 70;
              return (
                <div key={domain}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-bold">{domain}</span>
                    <span className={good ? "text-jelly-lime font-black" : "text-jelly-pink font-black"}>
                      {s.correct}/{s.total} · {pct}%
                    </span>
                  </div>
                  <div className="rounded-full h-2 overflow-hidden" style={{ background: "rgba(15, 8, 35, 0.8)" }}>
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{
                        width: `${pct}%`,
                        background: good
                          ? "linear-gradient(90deg, #7bff9a, #4adede)"
                          : "linear-gradient(90deg, #ff4d8f, #c86fff)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {results.wrongQuestions.length > 0 && (
          <div className="jelly-card p-5 mb-4" style={{ borderColor: "rgba(255, 77, 143, 0.3)" }}>
            <h2 className="font-black text-base text-jelly-pink mb-3">
              💥 놓친 문제 ({results.wrongQuestions.length})
            </h2>
            <div className="space-y-4">
              {results.wrongQuestions.map(({ index, question, selected }) => (
                <div key={question.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <p className="text-xs text-muted font-bold mb-1">Q{index + 1}</p>
                  <p className="text-sm leading-relaxed mb-2 whitespace-pre-line">{question.question_text}</p>

                  <div className="space-y-1 mb-2">
                    {question.options.map((opt) => {
                      const isSelected = selected.includes(opt.label);
                      const isCorrect = question.correct_answers.includes(opt.label);
                      let cls = "text-muted";
                      if (isCorrect) cls = "text-jelly-lime font-black";
                      if (isSelected && !isCorrect) cls = "text-jelly-pink line-through";
                      return (
                        <p key={opt.label} className={`text-xs ${cls}`}>
                          {opt.label}. {opt.text}
                          {isCorrect && " ✓"}
                          {isSelected && !isCorrect && " (내 답)"}
                        </p>
                      );
                    })}
                  </div>

                  {question.explanation && (
                    <div
                      className="rounded-2xl p-3 mt-2 text-xs leading-relaxed"
                      style={{
                        background: "rgba(74, 222, 222, 0.1)",
                        color: "var(--info-fg)",
                        border: "1px solid rgba(74, 222, 222, 0.3)",
                      }}
                    >
                      {question.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Link
            href="/mock-exam"
            className="flex-1 block text-center py-3.5 rounded-[18px] font-black text-sm active:scale-[0.97] active:translate-y-1 transition-all"
            style={{
              background: "rgba(200, 111, 255, 0.14)",
              border: "1.5px solid rgba(200, 111, 255, 0.45)",
              color: "var(--jelly-purple)",
            }}
          >
            📜 배틀 로그
          </Link>
          <Link
            href="/"
            className="flex-1 block text-center py-3.5 rounded-[18px] font-black text-sm text-on-primary active:scale-[0.97] active:translate-y-1 transition-all"
            style={{
              background: "linear-gradient(135deg, #ff6b9d, #c86fff)",
              boxShadow: "0 10px 24px -4px rgba(255, 107, 157, 0.45), inset 0 2px 0 rgba(255, 255, 255, 0.3)",
            }}
          >
            🏠 홈으로
          </Link>
        </div>
      </div>
    );
  }

  if (questions.length === 0) return null;

  const q = questions[currentIndex];
  const selected = answers[currentIndex] || [];
  const expectedCount = detectMultiSelectCount(q.question_text);
  const isMulti = expectedCount > 1 || q.correct_answers.length > 1;
  const selectCount = Math.max(expectedCount, q.correct_answers.length);
  const isTimeWarning = timeLeft < 180;

  return (
    <div className="max-w-lg mx-auto px-4 pt-2 pb-24">
      <div
        className="sticky top-0 z-10 pb-2 pt-2"
        style={{ background: "linear-gradient(180deg, var(--background) 80%, transparent)" }}
      >
        <div className="flex justify-between items-center mb-2">
          <span
            className="text-xs font-black px-3 py-1.5 rounded-full text-on-primary"
            style={{
              background: "linear-gradient(135deg, #ff6b9d, #c86fff)",
              boxShadow: "0 4px 12px rgba(255, 107, 157, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
            }}
          >
            BOSS Q {currentIndex + 1} / {questions.length}
          </span>
          <span
            className={`text-sm font-black px-3 py-1.5 rounded-full text-on-primary ${isTimeWarning ? "animate-shake" : ""}`}
            style={
              isTimeWarning
                ? {
                    background: "linear-gradient(135deg, #ff4d8f, #c86fff)",
                    boxShadow:
                      "0 6px 18px rgba(255, 77, 143, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
                  }
                : {
                    background: "linear-gradient(135deg, #4adede, #7b61ff)",
                    boxShadow:
                      "0 4px 12px rgba(74, 222, 222, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
                  }
            }
          >
            ⏱ {formatTime(timeLeft)}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(15, 8, 35, 0.8)" }}>
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
              background: "linear-gradient(90deg, #ff6b9d, #c86fff, #4adede)",
            }}
          />
        </div>
      </div>

      <div className="jelly-card p-5 mb-3 mt-2">
        {isMulti && (
          <span
            className="inline-block text-xs px-3 py-1 rounded-full font-black mb-3 text-on-primary"
            style={{
              background: "linear-gradient(135deg, #ffe156, #ffa040)",
              boxShadow: "0 3px 10px rgba(255, 160, 64, 0.35)",
            }}
          >
            ⚡ {selectCount}개 선택
          </span>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-line">{q.question_text}</p>
      </div>

      <div className="space-y-2.5 mb-4">
        {q.options.map((opt) => {
          const isSelected = selected.includes(opt.label);
          return (
            <button
              key={opt.label}
              onClick={() => handleSelect(opt.label)}
              className="w-full text-left rounded-[20px] p-3.5 transition-all active:scale-[0.98]"
              style={
                isSelected
                  ? {
                      background: "linear-gradient(135deg, rgba(255, 107, 157, 0.16), rgba(200, 111, 255, 0.12))",
                      border: "1.5px solid rgba(255, 107, 157, 0.55)",
                      boxShadow: "0 6px 20px rgba(255, 107, 157, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
                    }
                  : {
                      background: "linear-gradient(145deg, rgba(26, 18, 56, 0.9), rgba(35, 24, 80, 0.9))",
                      border: "1.5px solid rgba(255, 255, 255, 0.06)",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                    }
              }
            >
              <div className="flex gap-3">
                <span
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
                  style={
                    isSelected
                      ? {
                          background: "linear-gradient(135deg, #ff6b9d, #c86fff)",
                          color: "#ffffff",
                          boxShadow: "0 3px 8px rgba(255, 107, 157, 0.4)",
                        }
                      : { background: "rgba(255, 255, 255, 0.05)", color: "var(--muted)" }
                  }
                >
                  {opt.label}
                </span>
                <span className="text-sm leading-relaxed pt-1">{opt.text}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
          disabled={currentIndex === 0}
          className="flex-1 py-3.5 rounded-[18px] text-sm font-black disabled:opacity-30 active:scale-[0.97] active:translate-y-1 transition-all"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1.5px solid rgba(255, 255, 255, 0.1)",
            color: "var(--muted)",
          }}
        >
          ← 이전
        </button>
        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex((p) => p + 1)}
            className="flex-1 py-3.5 rounded-[18px] text-sm font-black text-on-primary active:scale-[0.97] active:translate-y-1 transition-all"
            style={{
              background: "linear-gradient(135deg, #4adede, #7b61ff)",
              boxShadow: "0 10px 24px -4px rgba(74, 222, 222, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.25)",
            }}
          >
            다음 ▶
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="flex-1 py-3.5 rounded-[18px] text-sm font-black text-on-primary active:scale-[0.97] active:translate-y-1 transition-all"
            style={{
              background: "linear-gradient(135deg, #ff4d8f, #ffa040)",
              boxShadow: "0 10px 24px -4px rgba(255, 77, 143, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.25)",
            }}
          >
            🏁 제출!
          </button>
        )}
      </div>

      <div className="mt-5">
        <p className="text-[10px] text-muted font-black mb-2 tracking-wider">미션 보드</p>
        <div className="flex gap-1.5 flex-wrap">
          {questions.map((_, i) => {
            const isCurrent = i === currentIndex;
            const isAnswered = !!answers[i];
            return (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className="w-9 h-9 rounded-xl text-xs font-black active:scale-[0.92] transition-all text-on-primary"
                style={
                  isCurrent
                    ? {
                        background: "linear-gradient(135deg, #ff6b9d, #c86fff)",
                        boxShadow: "0 4px 14px rgba(255, 107, 157, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
                      }
                    : isAnswered
                    ? {
                        background: "rgba(74, 222, 222, 0.15)",
                        color: "var(--jelly-teal)",
                        border: "1px solid rgba(74, 222, 222, 0.35)",
                      }
                    : {
                        background: "rgba(255, 255, 255, 0.04)",
                        color: "var(--muted)",
                        border: "1px solid var(--border)",
                      }
                }
              >
                {i + 1}
              </button>
            );
          })}
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
