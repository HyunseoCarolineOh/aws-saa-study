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
        <p className="pixel-label text-muted animate-blink">&gt; BOSS SUMMONING...</p>
      </div>
    );
  }

  if (phase === "result" && results) {
    const score = Math.round((results.correct / results.total) * 1000);
    const passed = score >= 720;
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-6">
        <header className="mb-5">
          <p className="eyebrow">Battle Result</p>
          <h1 className="page-title">보스전 결과</h1>
        </header>

        <section
          className="p-6 mb-5 text-center animate-pop-in pixel-window"
          style={{ borderColor: passed ? "var(--gb-green)" : "var(--blood)" }}
        >
          <p className="text-4xl mb-2 leading-none">{passed ? "★" : "×"}</p>
          <p
            className="pixel-label mb-3"
            style={{ color: passed ? "var(--gb-green)" : "var(--blood)" }}
          >
            {passed ? "VICTORY" : "GAME OVER"}
          </p>
          <p
            className="stat-value-lg leading-none mb-2"
            style={{ color: passed ? "var(--success-fg)" : "var(--danger-fg)", fontSize: 36 }}
          >
            {score}
            <span className="pixel-label opacity-70 ml-2">/ 1000</span>
          </p>
          <p className="body-sub">
            정답 {results.correct} / {results.total} · 합격 720점
          </p>
        </section>

        <section className="pixel-panel p-4 mb-5">
          <h2
            className="section-title text-mana mb-3 pb-2.5"
            style={{ borderBottom: "2px dashed var(--border)" }}
          >
            ▲ 도메인별 정답률
          </h2>
          <div className="space-y-3">
            {Object.entries(results.domainScores).map(([domain, s]) => {
              const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
              const good = pct >= 70;
              return (
                <div key={domain}>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="body-text">{domain}</span>
                    <span
                      className="stat-value-md"
                      style={{ color: good ? "var(--gb-green)" : "var(--blood)" }}
                    >
                      {pct}
                      <span className="pixel-label opacity-70 ml-0.5">%</span>
                      <span className="caption ml-2 text-muted">
                        ({s.correct}/{s.total})
                      </span>
                    </span>
                  </div>
                  <div
                    className="h-2"
                    style={{ background: "var(--gb-dark)", border: "1.5px solid var(--border)" }}
                  >
                    <div
                      className="h-full transition-[width] duration-300"
                      style={{
                        width: `${pct}%`,
                        background: good ? "var(--gb-green)" : "var(--blood)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {results.wrongQuestions.length > 0 && (
          <section className="pixel-panel p-4 mb-5" style={{ borderColor: "var(--blood)" }}>
            <h2
              className="section-title text-blood mb-3 pb-2.5"
              style={{ borderBottom: "2px dashed var(--border)" }}
            >
              × 놓친 문제 ({results.wrongQuestions.length})
            </h2>
            <div className="space-y-5">
              {results.wrongQuestions.map(({ index, question, selected }) => (
                <div
                  key={question.id}
                  className="pb-5 last:pb-0"
                  style={{ borderBottom: "1.5px dashed var(--border)" }}
                >
                  <p className="pixel-label text-muted mb-2">Q{index + 1}</p>
                  <p className="body-text whitespace-pre-line mb-3">{question.question_text}</p>

                  <ul className="space-y-1.5 mb-3">
                    {question.options.map((opt) => {
                      const isSelected = selected.includes(opt.label);
                      const isCorrect = question.correct_answers.includes(opt.label);
                      let style: React.CSSProperties = { color: "var(--muted)" };
                      if (isCorrect) style = { color: "var(--gb-green)", fontWeight: 700 };
                      if (isSelected && !isCorrect)
                        style = { color: "var(--blood)", textDecoration: "line-through" };
                      return (
                        <li key={opt.label} className="body-sub" style={style}>
                          <span className="pixel-label mr-1.5">{opt.label}.</span>
                          {opt.text}
                          {isCorrect && " ✓"}
                          {isSelected && !isCorrect && " (내 답)"}
                        </li>
                      );
                    })}
                  </ul>

                  {question.explanation && (
                    <div
                      className="p-3 body-sub leading-relaxed"
                      style={{
                        background: "rgba(91, 156, 216, 0.08)",
                        color: "var(--info-fg)",
                        border: "2px solid var(--info-border)",
                      }}
                    >
                      {question.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex gap-3">
          <Link href="/mock-exam" className="pixel-btn pixel-btn-ghost flex-1 py-3.5">
            📜 배틀 로그
          </Link>
          <Link href="/" className="pixel-btn pixel-btn-primary flex-1 py-3.5">
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
    <div className="max-w-lg mx-auto px-4 pt-3 pb-6">
      {/* 스티키 HUD */}
      <div
        className="sticky top-0 z-10 pb-3 pt-2"
        style={{ background: "linear-gradient(180deg, var(--background) 85%, transparent)" }}
      >
        <div className="flex justify-between items-center mb-2.5">
          <span
            className="pixel-badge"
            style={{
              background: "rgba(155, 188, 15, 0.16)",
              color: "var(--gb-green)",
              borderColor: "var(--gb-green)",
            }}
          >
            BOSS Q {currentIndex + 1} / {questions.length}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 ${isTimeWarning ? "animate-shake" : ""}`}
            style={
              isTimeWarning
                ? {
                    background: "var(--blood)",
                    color: "var(--parchment)",
                    border: "2px solid var(--gb-dark)",
                    boxShadow: "2px 2px 0 var(--gb-dark)",
                  }
                : {
                    background: "var(--gb-dark)",
                    color: "var(--gold)",
                    border: "2px solid var(--gold)",
                  }
            }
          >
            <span className="text-sm">⏱</span>
            <span
              style={{
                fontFamily: "var(--font-pixel)",
                fontSize: 14,
                letterSpacing: "0.05em",
                lineHeight: 1,
              }}
            >
              {formatTime(timeLeft)}
            </span>
          </span>
        </div>
        <div
          className="h-2.5"
          style={{ background: "var(--gb-dark)", border: "2px solid var(--border)" }}
        >
          <div
            className="h-full transition-[width] duration-300"
            style={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
              background: "linear-gradient(180deg, #e8b923, #9bbc0f, #4a7a3c)",
            }}
          />
        </div>
      </div>

      <article className="pixel-window p-5 mb-4">
        {isMulti && (
          <span
            className="pixel-badge mb-3"
            style={{
              background: "var(--gold)",
              color: "var(--gb-dark)",
              borderColor: "var(--gb-dark)",
            }}
          >
            ⚡ {selectCount}개 선택
          </span>
        )}
        <p className="body-text whitespace-pre-line">{q.question_text}</p>
      </article>

      <div className="space-y-2.5 mb-5">
        {q.options.map((opt) => {
          const isSelected = selected.includes(opt.label);
          return (
            <button
              key={opt.label}
              onClick={() => handleSelect(opt.label)}
              className="w-full text-left p-3.5 transition-transform active:translate-x-[1px] active:translate-y-[1px]"
              style={
                isSelected
                  ? {
                      background: "rgba(91, 156, 216, 0.14)",
                      border: "2px solid var(--mana)",
                      boxShadow: "2px 2px 0 var(--mana)",
                    }
                  : {
                      background: "var(--card)",
                      border: "2px solid var(--border)",
                      boxShadow: "2px 2px 0 rgba(0,0,0,0.35)",
                    }
              }
            >
              <div className="flex gap-3">
                <span
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center"
                  style={{
                    background: isSelected ? "var(--mana)" : "var(--gb-dark)",
                    color: isSelected ? "var(--gb-dark)" : "var(--muted)",
                    border: "2px solid var(--gb-dark)",
                    fontFamily: "var(--font-pixel)",
                    fontSize: 13,
                  }}
                >
                  {opt.label}
                </span>
                <span className="body-text flex-1 pt-0.5">{opt.text}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 네비게이션 */}
      <div className="flex gap-3 mb-5">
        <button
          onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
          disabled={currentIndex === 0}
          className="pixel-btn pixel-btn-ghost flex-1 py-3"
        >
          ◄ 이전
        </button>
        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex((p) => p + 1)}
            className="pixel-btn pixel-btn-mana flex-1 py-3"
          >
            다음 ►
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="pixel-btn pixel-btn-danger flex-1 py-3"
          >
            &gt; 제출!
          </button>
        )}
      </div>

      {/* 문제 맵 */}
      <div className="pixel-panel p-3">
        <p className="pixel-label text-muted mb-2.5">&gt; QUESTION MAP</p>
        <div className="flex gap-1.5 flex-wrap">
          {questions.map((_, i) => {
            const isCurrent = i === currentIndex;
            const isAnswered = !!answers[i];
            return (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className="w-9 h-9 transition-transform active:translate-x-[1px] active:translate-y-[1px]"
                style={
                  isCurrent
                    ? {
                        background: "var(--gold)",
                        color: "var(--gb-dark)",
                        border: "2px solid var(--gb-dark)",
                        boxShadow: "2px 2px 0 var(--gb-dark)",
                        fontFamily: "var(--font-pixel)",
                        fontSize: 12,
                      }
                    : isAnswered
                    ? {
                        background: "rgba(155, 188, 15, 0.14)",
                        color: "var(--gb-green)",
                        border: "2px solid var(--gb-green)",
                        fontFamily: "var(--font-pixel)",
                        fontSize: 12,
                      }
                    : {
                        background: "var(--gb-dark)",
                        color: "var(--muted)",
                        border: "2px solid var(--border)",
                        fontFamily: "var(--font-pixel)",
                        fontSize: 12,
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
