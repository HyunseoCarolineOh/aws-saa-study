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

  // --- 로딩 ---
  if (phase === "loading") {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 text-center">
        <p className="text-muted font-display font-semibold animate-bounce-soft">
          ⚔️ 보스 소환 중... (도메인별 10문제 선별)
        </p>
      </div>
    );
  }

  // --- 결과 ---
  if (phase === "result" && results) {
    const score = Math.round((results.correct / results.total) * 1000);
    const passed = score >= 720;
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
        <div className="mb-4">
          <p className="text-xs text-muted font-semibold tracking-wider">BATTLE RESULT</p>
          <h1 className="text-2xl font-display font-black text-rose">보스전 결과 🏁</h1>
        </div>

        <div
          className="rounded-3xl p-6 mb-4 text-center animate-pop-in"
          style={
            passed
              ? {
                  background: "linear-gradient(135deg, rgba(180,242,225,0.2), rgba(200,180,255,0.2))",
                  border: "2px solid rgba(180,242,225,0.5)",
                  boxShadow: "0 12px 36px rgba(180,242,225,0.3)",
                }
              : {
                  background: "linear-gradient(135deg, rgba(255,159,181,0.2), rgba(255,203,168,0.2))",
                  border: "2px solid rgba(255,159,181,0.5)",
                  boxShadow: "0 12px 36px rgba(255,159,181,0.25)",
                }
          }
        >
          <p className="text-4xl mb-2">{passed ? "🏆" : "💥"}</p>
          <p className="text-sm font-display font-bold opacity-80 mb-1" style={{ color: passed ? "var(--success-fg)" : "var(--danger-fg)" }}>
            {passed ? "VICTORY!" : "DEFEAT"}
          </p>
          <p className="text-4xl font-display font-black mb-1" style={{ color: passed ? "var(--success-fg)" : "var(--danger-fg)" }}>
            {score}<span className="text-xl opacity-70"> / 1000</span>
          </p>
          <p className="text-xs text-muted">
            {results.correct} / {results.total}문제 명중 · 합격 720점
          </p>
        </div>

        <div
          className="rounded-3xl p-5 mb-4 bubble-shadow"
          style={{
            background: "linear-gradient(135deg, rgba(46,40,73,0.9), rgba(37,32,58,0.9))",
            border: "1px solid rgba(200,180,255,0.22)",
          }}
        >
          <h2 className="font-display font-bold text-lavender mb-3">🎯 도메인별 명중률</h2>
          <div className="space-y-3">
            {Object.entries(results.domainScores).map(([domain, s]) => {
              const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
              const good = pct >= 70;
              return (
                <div key={domain}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold">{domain}</span>
                    <span className={good ? "text-mint font-bold" : "text-rose font-bold"}>
                      {s.correct}/{s.total} · {pct}%
                    </span>
                  </div>
                  <div className="bg-muted-bg rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{
                        width: `${pct}%`,
                        background: good
                          ? "linear-gradient(90deg, #b4f2e1, #a8dcff)"
                          : "linear-gradient(90deg, #ff9fb5, #ffcba8)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {results.wrongQuestions.length > 0 && (
          <div
            className="rounded-3xl p-5 mb-4"
            style={{
              background: "linear-gradient(135deg, rgba(46,40,73,0.9), rgba(37,32,58,0.9))",
              border: "1px solid rgba(255,159,181,0.22)",
            }}
          >
            <h2 className="font-display font-bold text-rose mb-3">
              💥 놓친 퀘스트 ({results.wrongQuestions.length})
            </h2>
            <div className="space-y-4">
              {results.wrongQuestions.map(({ index, question, selected }) => (
                <div key={question.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <p className="text-xs text-muted font-semibold mb-1">Q{index + 1}</p>
                  <p className="text-sm leading-relaxed mb-2 whitespace-pre-line">{question.question_text}</p>

                  <div className="space-y-1 mb-2">
                    {question.options.map((opt) => {
                      const isSelected = selected.includes(opt.label);
                      const isCorrect = question.correct_answers.includes(opt.label);
                      let cls = "text-muted";
                      if (isCorrect) cls = "text-mint font-bold";
                      if (isSelected && !isCorrect) cls = "text-rose line-through";
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
                        background: "rgba(168,220,255,0.1)",
                        color: "var(--info-fg)",
                        border: "1px solid rgba(168,220,255,0.3)",
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
            className="flex-1 block text-center py-3 rounded-3xl font-display font-bold text-sm active:scale-[0.97] transition-all"
            style={{
              background: "rgba(200,180,255,0.14)",
              border: "1px solid rgba(200,180,255,0.4)",
              color: "var(--pastel-lavender)",
            }}
          >
            📜 배틀 로그
          </Link>
          <Link
            href="/"
            className="flex-1 block text-center py-3 rounded-3xl font-display font-bold text-sm text-on-primary active:scale-[0.97] transition-all"
            style={{
              background: "linear-gradient(135deg, #ffb4c6, #c8b4ff)",
              boxShadow: "0 8px 24px rgba(255,180,198,0.3)",
            }}
          >
            🏠 홈으로
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
  const isTimeWarning = timeLeft < 180;

  return (
    <div className="max-w-lg mx-auto px-4 pt-2 pb-24">
      {/* HUD */}
      <div
        className="sticky top-0 z-10 pb-2 pt-2"
        style={{
          background: "linear-gradient(180deg, var(--background) 70%, transparent)",
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-display font-bold text-rose bg-rose/10 px-2.5 py-1 rounded-full border border-rose/30">
            BOSS Q {currentIndex + 1} / {questions.length}
          </span>
          <span
            className={`text-sm font-mono font-black px-3 py-1 rounded-full ${
              isTimeWarning ? "animate-shake" : ""
            }`}
            style={
              isTimeWarning
                ? {
                    background: "rgba(255,159,181,0.2)",
                    color: "var(--danger-fg)",
                    border: "1px solid rgba(255,159,181,0.5)",
                    boxShadow: "0 0 16px rgba(255,159,181,0.4)",
                  }
                : {
                    background: "rgba(200,180,255,0.12)",
                    color: "var(--pastel-lavender)",
                    border: "1px solid rgba(200,180,255,0.3)",
                  }
            }
          >
            ⏱ {formatTime(timeLeft)}
          </span>
        </div>
        <div className="bg-muted-bg rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
              background: "linear-gradient(90deg, #ffb4c6, #c8b4ff, #a8dcff)",
            }}
          />
        </div>
      </div>

      <div
        className="rounded-3xl p-5 mb-3 mt-2 bubble-shadow"
        style={{
          background: "linear-gradient(135deg, rgba(37,32,58,0.9), rgba(46,40,73,0.9))",
          border: "1px solid rgba(200,180,255,0.22)",
        }}
      >
        {isMulti && (
          <span
            className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-display font-bold mb-3"
            style={{
              background: "rgba(255,226,122,0.18)",
              color: "var(--warning-fg)",
              border: "1px solid rgba(255,226,122,0.45)",
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
              className="w-full text-left rounded-3xl p-3.5 transition-all active:scale-[0.98]"
              style={
                isSelected
                  ? {
                      background: "linear-gradient(135deg, rgba(255,180,198,0.18), rgba(200,180,255,0.12))",
                      border: "1.5px solid rgba(255,180,198,0.55)",
                      boxShadow: "0 0 18px rgba(255,180,198,0.22)",
                    }
                  : {
                      background: "rgba(37,32,58,0.7)",
                      border: "1.5px solid var(--border)",
                    }
              }
            >
              <div className="flex gap-3">
                <span
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-display font-black"
                  style={
                    isSelected
                      ? { background: "var(--pastel-rose)", color: "#2b1a20" }
                      : { background: "var(--muted-bg)", color: "var(--muted)" }
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
          className="flex-1 py-3 rounded-3xl text-sm font-display font-bold disabled:opacity-30 active:scale-[0.97] transition-all"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--border)",
            color: "var(--muted)",
          }}
        >
          ← 이전
        </button>
        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex((p) => p + 1)}
            className="flex-1 py-3 rounded-3xl text-sm font-display font-bold text-on-primary active:scale-[0.97] transition-all"
            style={{
              background: "linear-gradient(135deg, #c8b4ff, #a8dcff)",
              boxShadow: "0 6px 18px rgba(200,180,255,0.3)",
            }}
          >
            다음 ▶
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="flex-1 py-3 rounded-3xl text-sm font-display font-bold text-on-primary active:scale-[0.97] transition-all"
            style={{
              background: "linear-gradient(135deg, #ff9fb5, #ffb4c6)",
              boxShadow: "0 6px 18px rgba(255,159,181,0.35)",
            }}
          >
            🏁 제출!
          </button>
        )}
      </div>

      <div className="mt-5">
        <p className="text-[10px] text-muted font-semibold mb-2 tracking-wider">퀘스트 보드</p>
        <div className="flex gap-1.5 flex-wrap">
          {questions.map((_, i) => {
            const isCurrent = i === currentIndex;
            const isAnswered = !!answers[i];
            return (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className="w-9 h-9 rounded-xl text-xs font-display font-black active:scale-[0.92] transition-all"
                style={
                  isCurrent
                    ? {
                        background: "linear-gradient(135deg, #ffb4c6, #c8b4ff)",
                        color: "#2b1a20",
                        boxShadow: "0 4px 12px rgba(255,180,198,0.4)",
                      }
                    : isAnswered
                    ? {
                        background: "rgba(180,242,225,0.15)",
                        color: "var(--pastel-mint)",
                        border: "1px solid rgba(180,242,225,0.35)",
                      }
                    : {
                        background: "rgba(255,255,255,0.04)",
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
