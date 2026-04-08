"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Question } from "@/lib/types";
import { addAttempt } from "@/lib/store";

export default function MockExamStartPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [timeLeft, setTimeLeft] = useState(130 * 60); // 130분 = 7800초
  const [phase, setPhase] = useState<"loading" | "exam" | "result">("loading");
  const [results, setResults] = useState<{ correct: number; total: number; domainScores: Record<string, { correct: number; total: number }> } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
      const shuffled = [...data.questions].sort(() => Math.random() - 0.5).slice(0, 65);
      setQuestions(shuffled);
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

    questions.forEach((q, i) => {
      const selected = answers[i] || [];
      const isCorrect =
        selected.length === q.correct_answers.length &&
        selected.every((a) => q.correct_answers.includes(a));

      if (isCorrect) correct++;

      // 도메인별 점수 (서비스 기반 간이 분류)
      const domain = guessDomain(q);
      if (!domainScores[domain]) domainScores[domain] = { correct: 0, total: 0 };
      domainScores[domain].total++;
      if (isCorrect) domainScores[domain].correct++;

      addAttempt({
        question_id: q.id,
        selected_answers: selected,
        is_correct: isCorrect,
        time_spent_seconds: 0,
      });
    });

    setResults({ correct, total: questions.length, domainScores });
    setPhase("result");
  }, [questions, answers]);

  function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  if (phase === "loading") {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 text-center">
        <p className="text-muted">모의시험 준비 중... (65문제 랜덤 선별)</p>
      </div>
    );
  }

  if (phase === "result" && results) {
    const score = Math.round((results.correct / results.total) * 1000);
    const passed = score >= 720;
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold mb-4">모의시험 결과</h1>

        <div className={`rounded-2xl p-6 mb-4 text-white text-center ${passed ? "bg-green-600" : "bg-red-500"}`}>
          <p className="text-sm opacity-80 mb-1">{passed ? "합격!" : "불합격"}</p>
          <p className="text-4xl font-bold mb-1">{score} / 1000</p>
          <p className="text-sm opacity-80">정답 {results.correct} / {results.total}문제 (합격 기준: 720점)</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 mb-4">
          <h2 className="font-semibold mb-3">도메인별 정답률</h2>
          <div className="space-y-3">
            {Object.entries(results.domainScores).map(([domain, s]) => {
              const pct = Math.round((s.correct / s.total) * 100);
              return (
                <div key={domain}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{domain}</span>
                    <span className="text-muted">{s.correct}/{s.total} ({pct}%)</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className={`rounded-full h-2 ${pct >= 70 ? "bg-green-500" : "bg-red-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <a href="/" className="block w-full bg-primary text-white text-center py-3 rounded-xl font-medium">
          홈으로 돌아가기
        </a>
      </div>
    );
  }

  if (questions.length === 0) return null;

  const q = questions[currentIndex];
  const selected = answers[currentIndex] || [];
  const expectedCount = detectMultiSelectCount(q.question_text);
  const isMulti = expectedCount > 1 || q.correct_answers.length > 1;
  const selectCount = Math.max(expectedCount, q.correct_answers.length);
  const isTimeWarning = timeLeft < 600; // 10분 미만

  return (
    <div className="max-w-lg mx-auto px-4 pt-2 pb-4">
      {/* 상단 바: 타이머 + 진행률 */}
      <div className="sticky top-0 bg-background z-10 pb-2 pt-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">{currentIndex + 1} / {questions.length}</span>
          <span className={`text-sm font-mono font-bold ${isTimeWarning ? "text-red-500" : "text-muted"}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
        <div className="bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-primary rounded-full h-1.5 transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 문제 */}
      <div className="bg-card rounded-xl border border-border p-4 mb-3 mt-2">
        {isMulti && (
          <span className="inline-block text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded mb-2">{selectCount}개 선택</span>
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
                isSelected ? "border-primary bg-blue-50" : "border-border bg-card"
              }`}
            >
              <div className="flex gap-3">
                <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  isSelected ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
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
            className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-medium"
          >
            다음
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-medium"
          >
            시험 종료
          </button>
        )}
      </div>

      {/* 문제 번호 그리드 */}
      <div className="mt-4">
        <p className="text-xs text-muted mb-2">문제 번호 (클릭하여 이동)</p>
        <div className="grid grid-cols-13 gap-1">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-7 h-7 rounded text-xs font-medium ${
                i === currentIndex
                  ? "bg-primary text-white"
                  : answers[i]
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-500"
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
  if (/3개|세\s*가지|THREE|three|choose\s*3/i.test(text)) return 3;
  if (/2개|두\s*개|두\s*가지|TWO|two|choose\s*2/i.test(text)) return 2;
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
