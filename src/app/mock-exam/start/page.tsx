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
        <p className="text-muted font-display tracking-widest animate-flicker">&gt; SUMMONING BOSS...</p>
      </div>
    );
  }

  if (phase === "result" && results) {
    const score = Math.round((results.correct / results.total) * 1000);
    const passed = score >= 720;
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
        <div className="mb-4">
          <p className="text-[10px] font-display text-neon-cyan tracking-[0.3em] neon-glow-cyan">BATTLE RESULT</p>
          <h1 className="text-xl font-display font-black text-neon-pink neon-glow-pink animate-flicker">&gt; VERDICT</h1>
        </div>

        <div
          className="p-6 mb-4 text-center animate-pop-in"
          style={
            passed
              ? {
                  background: "rgba(180, 255, 57, 0.1)",
                  border: "2px solid rgba(180, 255, 57, 0.6)",
                  boxShadow: "0 0 36px rgba(180, 255, 57, 0.4)",
                }
              : {
                  background: "rgba(255, 46, 136, 0.1)",
                  border: "2px solid rgba(255, 46, 136, 0.6)",
                  boxShadow: "0 0 36px rgba(255, 46, 136, 0.35)",
                }
          }
        >
          <p className="text-4xl mb-2 animate-flicker">{passed ? "★" : "×"}</p>
          <p className="text-sm font-display tracking-widest mb-2" style={{ color: passed ? "#d4ff7a" : "#ff7ab0", textShadow: `0 0 10px ${passed ? "#b4ff39aa" : "#ff2e88aa"}` }}>
            {passed ? "VICTORY!!" : "GAME OVER"}
          </p>
          <p className="text-4xl font-display font-black leading-none mb-1" style={{ color: passed ? "#d4ff7a" : "#ff7ab0", textShadow: `0 0 14px ${passed ? "#b4ff39cc" : "#ff2e88cc"}` }}>
            {score}
            <span className="text-lg opacity-70 font-retro"> / 1000</span>
          </p>
          <p className="text-[10px] text-muted mt-2 font-retro tracking-wider">
            HIT {results.correct} / {results.total} · PASS 720
          </p>
        </div>

        <div
          className="p-5 mb-4"
          style={{
            background: "rgba(18, 7, 38, 0.9)",
            border: "1.5px solid rgba(0, 240, 255, 0.35)",
          }}
        >
          <h2 className="font-display text-sm text-neon-cyan tracking-widest neon-glow-cyan mb-3">&gt; DOMAIN ACCURACY</h2>
          <div className="space-y-3">
            {Object.entries(results.domainScores).map(([domain, s]) => {
              const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
              const good = pct >= 70;
              return (
                <div key={domain}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-display tracking-wider">{domain}</span>
                    <span style={{ color: good ? "#b4ff39" : "#ff2e88", textShadow: `0 0 6px ${good ? "#b4ff3999" : "#ff2e8899"}` }} className="font-display">
                      {s.correct}/{s.total} · {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden" style={{ background: "rgba(0, 0, 0, 0.6)" }}>
                    <div
                      className="h-full transition-[width] duration-700"
                      style={{
                        width: `${pct}%`,
                        background: good
                          ? "linear-gradient(90deg, #b4ff39, #00f0ff)"
                          : "linear-gradient(90deg, #ff2e88, #a855ff)",
                        boxShadow: `0 0 6px ${good ? "#b4ff39" : "#ff2e88"}aa`,
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
            className="p-5 mb-4"
            style={{
              background: "rgba(18, 7, 38, 0.9)",
              border: "1.5px solid rgba(255, 46, 136, 0.35)",
            }}
          >
            <h2 className="font-display text-sm text-neon-pink tracking-widest neon-glow-pink mb-3">
              &gt; MISSES ({results.wrongQuestions.length})
            </h2>
            <div className="space-y-4">
              {results.wrongQuestions.map(({ index, question, selected }) => (
                <div key={question.id} className="pb-4 last:pb-0" style={{ borderBottom: "1px solid var(--border)" }}>
                  <p className="text-[10px] font-display tracking-widest text-muted mb-1">Q{index + 1}</p>
                  <p className="text-sm leading-relaxed mb-2 whitespace-pre-line">{question.question_text}</p>

                  <div className="space-y-1 mb-2">
                    {question.options.map((opt) => {
                      const isSelected = selected.includes(opt.label);
                      const isCorrect = question.correct_answers.includes(opt.label);
                      let cls = "text-muted";
                      if (isCorrect) cls = "text-neon-lime font-bold";
                      if (isSelected && !isCorrect) cls = "text-neon-pink line-through";
                      return (
                        <p key={opt.label} className={`text-xs ${cls}`}>
                          {opt.label}. {opt.text}
                          {isCorrect && " ✓"}
                          {isSelected && !isCorrect && " [MINE]"}
                        </p>
                      );
                    })}
                  </div>

                  {question.explanation && (
                    <div
                      className="p-3 mt-2 text-xs leading-relaxed"
                      style={{
                        background: "rgba(0, 240, 255, 0.08)",
                        color: "var(--info-fg)",
                        border: "1px solid rgba(0, 240, 255, 0.3)",
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
            className="flex-1 block text-center py-3 font-display font-bold text-sm tracking-widest active:scale-[0.97] transition-all"
            style={{
              background: "rgba(168, 85, 255, 0.14)",
              border: "1px solid rgba(168, 85, 255, 0.5)",
              color: "var(--accent-fg)",
            }}
          >
            &gt; BATTLE LOG
          </Link>
          <Link
            href="/"
            className="flex-1 block text-center py-3 font-display font-bold text-sm tracking-widest active:scale-[0.97] transition-all"
            style={{
              background: "linear-gradient(135deg, #ff2e88, #a855ff)",
              color: "#0a0514",
              boxShadow: "0 0 20px rgba(255, 46, 136, 0.5)",
            }}
          >
            &gt; HOME
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
        style={{
          background: "linear-gradient(180deg, var(--background) 70%, transparent)",
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <span
            className="text-[10px] font-display tracking-widest px-2.5 py-1"
            style={{
              background: "rgba(255, 46, 136, 0.14)",
              color: "var(--neon-pink)",
              border: "1px solid rgba(255, 46, 136, 0.45)",
              textShadow: "0 0 6px rgba(255, 46, 136, 0.5)",
            }}
          >
            BOSS Q {currentIndex + 1}/{questions.length}
          </span>
          <span
            className={`text-sm font-display tracking-widest px-3 py-1 ${isTimeWarning ? "animate-shake" : ""}`}
            style={
              isTimeWarning
                ? {
                    background: "rgba(255, 46, 136, 0.2)",
                    color: "#ff7ab0",
                    border: "1.5px solid rgba(255, 46, 136, 0.6)",
                    textShadow: "0 0 8px rgba(255, 46, 136, 0.8)",
                    boxShadow: "0 0 18px rgba(255, 46, 136, 0.4)",
                  }
                : {
                    background: "rgba(0, 240, 255, 0.12)",
                    color: "var(--neon-cyan)",
                    border: "1px solid rgba(0, 240, 255, 0.4)",
                    textShadow: "0 0 6px rgba(0, 240, 255, 0.6)",
                  }
            }
          >
            ⏱ {formatTime(timeLeft)}
          </span>
        </div>
        <div className="h-2 overflow-hidden" style={{ background: "rgba(0, 0, 0, 0.6)", border: "1px solid rgba(0, 240, 255, 0.3)" }}>
          <div
            className="h-full transition-[width] duration-500"
            style={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
              background: "linear-gradient(90deg, #ff2e88, #a855ff, #00f0ff)",
              boxShadow: "0 0 10px rgba(255, 46, 136, 0.5)",
            }}
          />
        </div>
      </div>

      <div
        className="p-5 mb-3 mt-2"
        style={{
          background: "rgba(18, 7, 38, 0.9)",
          border: "1.5px solid rgba(0, 240, 255, 0.3)",
        }}
      >
        {isMulti && (
          <span
            className="inline-block text-[10px] px-2.5 py-1 font-display mb-3 tracking-widest"
            style={{
              background: "rgba(255, 238, 0, 0.14)",
              color: "var(--warning-fg)",
              border: "1px solid rgba(255, 238, 0, 0.45)",
            }}
          >
            ⚡ ×{selectCount} SELECT
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
              className="w-full text-left p-3.5 transition-all active:scale-[0.98]"
              style={
                isSelected
                  ? {
                      background: "rgba(0, 240, 255, 0.1)",
                      border: "1.5px solid rgba(0, 240, 255, 0.6)",
                      boxShadow: "0 0 16px rgba(0, 240, 255, 0.3)",
                    }
                  : {
                      background: "rgba(18, 7, 38, 0.8)",
                      border: "1.5px solid var(--border)",
                    }
              }
            >
              <div className="flex gap-3">
                <span
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-sm font-display font-bold"
                  style={
                    isSelected
                      ? { background: "#00f0ff", color: "#0a0514", border: "1.5px solid #00f0ff" }
                      : { background: "transparent", color: "#8a6fb8", border: "1.5px solid var(--border)" }
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
          className="flex-1 py-3 text-xs font-display tracking-widest disabled:opacity-30 active:scale-[0.97] transition-all"
          style={{
            background: "rgba(18, 7, 38, 0.8)",
            border: "1px solid var(--border)",
            color: "var(--muted)",
          }}
        >
          ← PREV
        </button>
        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex((p) => p + 1)}
            className="flex-1 py-3 text-xs font-display font-bold tracking-widest active:scale-[0.97] transition-all"
            style={{
              background: "linear-gradient(135deg, #00f0ff, #a855ff)",
              color: "#0a0514",
              boxShadow: "0 0 16px rgba(0, 240, 255, 0.4)",
            }}
          >
            NEXT ▶
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="flex-1 py-3 text-xs font-display font-bold tracking-widest active:scale-[0.97] transition-all"
            style={{
              background: "linear-gradient(135deg, #ff2e88, #ffee00)",
              color: "#0a0514",
              boxShadow: "0 0 16px rgba(255, 46, 136, 0.5)",
            }}
          >
            &gt; SUBMIT!
          </button>
        )}
      </div>

      <div className="mt-5">
        <p className="text-[10px] font-display text-muted mb-2 tracking-widest">&gt; MAP</p>
        <div className="flex gap-1.5 flex-wrap">
          {questions.map((_, i) => {
            const isCurrent = i === currentIndex;
            const isAnswered = !!answers[i];
            return (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className="w-9 h-9 text-xs font-display font-bold active:scale-[0.92] transition-all"
                style={
                  isCurrent
                    ? {
                        background: "#ff2e88",
                        color: "#0a0514",
                        boxShadow: "0 0 12px rgba(255, 46, 136, 0.6)",
                      }
                    : isAnswered
                    ? {
                        background: "rgba(180, 255, 57, 0.12)",
                        color: "#b4ff39",
                        border: "1px solid rgba(180, 255, 57, 0.4)",
                      }
                    : {
                        background: "rgba(18, 7, 38, 0.6)",
                        color: "var(--muted)",
                        border: "1px solid var(--border)",
                      }
                }
              >
                {(i + 1).toString().padStart(2, "0")}
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
