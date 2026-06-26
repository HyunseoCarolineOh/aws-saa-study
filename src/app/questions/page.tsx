"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Question } from "@/lib/types";
import QuestionCard from "@/components/QuestionCard";
import MarkdownContent from "@/components/MarkdownContent";
import {
  getQuizProgress,
  saveQuizProgress,
  clearQuizProgress,
  getServiceQuizProgress,
  saveServiceQuizProgress,
  clearServiceQuizProgress,
  getTodayReviewQuestionIds,
  getAttemptedQuestionIds,
  addAttempt,
  saveMockExamResult,
} from "@/lib/store";
import { getDataServiceNames } from "@/lib/serviceMap";
import CorrectionReportSheet from "@/components/CorrectionReportSheet";
import { isCorrectionsEnabled } from "@/lib/corrections";
import { useExam } from "@/contexts/ExamContext";
import Link from "next/link";

type PageMode = "select" | "quiz" | "mock" | "mock-result";

function buildPrioritizedOrder(questions: Question[]): Question[] {
  const attempted = getAttemptedQuestionIds();
  const unsolved: Question[] = [];
  const solved: Question[] = [];
  for (const q of questions) {
    (attempted.has(q.id) ? solved : unsolved).push(q);
  }
  const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);
  return [...shuffle(unsolved), ...shuffle(solved)];
}

function buildDomainQuota(
  weights: Record<string, number>,
  total: number
): Record<string, number> {
  const weightSum = Object.values(weights).reduce((a, b) => a + b, 0);
  const quota: Record<string, number> = {};
  let assigned = 0;
  const entries = Object.entries(weights);
  entries.forEach(([domain, w], i) => {
    const count = i === entries.length - 1
      ? total - assigned
      : Math.round((w / weightSum) * total);
    quota[domain] = count;
    assigned += count;
  });
  return quota;
}

function detectMultiSelectCount(text: string): number {
  if (/3개를?\s*선택|세\s*가지를?\s*선택|choose\s*3|select\s*3/i.test(text)) return 3;
  if (/2개를?\s*선택|두\s*(?:개를?|가지를?)\s*선택|choose\s*2|select\s*2/i.test(text)) return 2;
  return 1;
}

function guessDomainSAA(q: Question): string {
  const combined = (
    q.question_text + " " + q.options.map((o) => o.text).join(" ") + " " +
    (q.related_services || []).join(" ")
  ).toLowerCase();
  if (/iam|cognito|kms|waf|shield|guard|encrypt|보안|인증|암호|acm|secret/.test(combined))
    return "보안 아키텍처";
  if (/auto scaling|multi.?az|failover|disaster|복원|가용성|백업|replica|aurora.*read/.test(combined))
    return "복원력 아키텍처";
  if (/cost|비용|절감|예산|saving|budget|reserved|spot|glacier/.test(combined))
    return "비용 최적화";
  return "고성능 아키텍처";
}

function guessDomainCLF(q: Question): string {
  const combined = (
    q.question_text + " " + q.options.map((o) => o.text).join(" ") + " " +
    (q.related_services || []).join(" ")
  ).toLowerCase();
  if (q.domain) return q.domain;
  if (/iam|cognito|kms|waf|shield|guard|encrypt|보안|인증|암호/.test(combined)) return "Security";
  if (/ec2|lambda|s3|rds|vpc|network|storage|database|컴퓨|스토리|네트워/.test(combined)) return "Technology";
  if (/cost|비용|billing|pricing|budget|절감|요금/.test(combined)) return "Billing & Pricing";
  return "Cloud Concepts";
}

function QuestionsContent() {
  const searchParams = useSearchParams();
  const service = searchParams.get("service");
  const urlMode = service ? "quiz" : searchParams.get("mode") === "review" ? "quiz" : null;

  const { currentExam, examConfig } = useExam();
  const [pageMode, setPageMode] = useState<PageMode>(urlMode ?? "select");
  const [quizSubMode, setQuizSubMode] = useState<"normal" | "review" | "service">(
    service ? "service" : searchParams.get("mode") === "review" ? "review" : "normal"
  );

  // Quiz state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizLoading, setQuizLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportToast, setReportToast] = useState<string | null>(null);

  // Mock exam state
  const [mockQuestions, setMockQuestions] = useState<Question[]>([]);
  const [mockAnswers, setMockAnswers] = useState<Record<number, string[]>>({});
  const [mockIndex, setMockIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(examConfig.examTimeMinutes * 60);
  const [mockLoading, setMockLoading] = useState(false);
  const [mockResults, setMockResults] = useState<{
    correct: number; total: number;
    domainScores: Record<string, { correct: number; total: number }>;
    wrongQuestions: { index: number; question: Question; selected: string[] }[];
  } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startedAtRef = useRef<string>(new Date().toISOString());

  function showReportToast(msg: string) {
    setReportToast(msg);
    window.setTimeout(() => setReportToast(null), 2500);
  }

  // Quiz logic
  async function startQuiz(subMode: "normal" | "service") {
    setQuizLoading(true);
    setQuizSubMode(subMode);
    try {
      const res = await fetch(`/api/questions?exam=${currentExam}`);
      const data = await res.json();
      const allQuestions = data.questions as Question[];

      if (subMode === "service" && service) {
        const dataNames = getDataServiceNames(service);
        const svcQ = allQuestions.filter((q) =>
          q.related_services.some((s) => dataNames.includes(s))
        );
        const saved = getServiceQuizProgress();
        if (saved && saved.mode === "service" && saved.serviceName === service && saved.questionIds.length > 0) {
          const qMap = new Map(svcQ.map((q) => [q.id, q]));
          const restored = saved.questionIds.map((id) => qMap.get(id)).filter((q): q is Question => !!q);
          if (restored.length > 0) {
            setQuestions(restored);
            setCurrentIndex(Math.min(saved.currentIndex, restored.length - 1));
          } else {
            startServiceFresh(svcQ, service);
          }
        } else {
          startServiceFresh(svcQ, service);
        }
      } else {
        const saved = getQuizProgress();
        if (saved && saved.mode === "normal" && saved.questionIds.length > 0) {
          const qMap = new Map(allQuestions.map((q) => [q.id, q]));
          const restored = saved.questionIds.map((id) => qMap.get(id)).filter((q): q is Question => !!q);
          if (restored.length > 0) {
            setQuestions(restored);
            setCurrentIndex(Math.min(saved.currentIndex, restored.length - 1));
          } else {
            startFresh(allQuestions);
          }
        } else {
          startFresh(allQuestions);
        }
      }
    } catch {
      setQuestions([]);
    }
    setQuizLoading(false);
    setPageMode("quiz");
  }

  async function startReviewQuiz() {
    setQuizLoading(true);
    setQuizSubMode("review");
    try {
      const res = await fetch(`/api/questions?exam=${currentExam}`);
      const data = await res.json();
      const reviewIds = getTodayReviewQuestionIds();
      const reviewQ = (data.questions as Question[]).filter((q) => reviewIds.includes(q.id));
      setQuestions([...reviewQ].sort(() => Math.random() - 0.5));
      setCurrentIndex(0);
    } catch { setQuestions([]); }
    setQuizLoading(false);
    setPageMode("quiz");
  }

  function startFresh(allQ: Question[]) {
    const ordered = buildPrioritizedOrder(allQ);
    setQuestions(ordered);
    setCurrentIndex(0);
    saveQuizProgress({ questionIds: ordered.map((q) => q.id), currentIndex: 0, mode: "normal" });
  }

  function startServiceFresh(svcQ: Question[], svcName: string) {
    const ordered = buildPrioritizedOrder(svcQ);
    setQuestions(ordered);
    setCurrentIndex(0);
    saveServiceQuizProgress({ questionIds: ordered.map((q) => q.id), currentIndex: 0, mode: "service", serviceName: svcName });
  }

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      if (quizSubMode === "normal") {
        saveQuizProgress({ questionIds: questions.map((q) => q.id), currentIndex: next, mode: "normal" });
      } else if (quizSubMode === "service" && service) {
        saveServiceQuizProgress({ questionIds: questions.map((q) => q.id), currentIndex: next, mode: "service", serviceName: service });
      }
    }
  }, [currentIndex, questions, quizSubMode, service]);

  // Mock exam logic
  async function startMock() {
    setMockLoading(true);
    setMockAnswers({});
    setMockIndex(0);
    const newTime = examConfig.examTimeMinutes * 60;
    setTimeLeft(newTime);

    try {
      const res = await fetch(`/api/questions?exam=${currentExam}`);
      const data = await res.json();
      const allQ = data.questions as Question[];
      const domainQuota = buildDomainQuota(examConfig.domainWeights, examConfig.totalQuestions);
      const guessDomain = currentExam === "CLF-C02" ? guessDomainCLF : guessDomainSAA;

      const buckets: Record<string, Question[]> = {};
      for (const domain of Object.keys(domainQuota)) buckets[domain] = [];
      for (const q of allQ) {
        const d = guessDomain(q);
        if (buckets[d]) buckets[d].push(q);
      }
      for (const d of Object.keys(buckets)) buckets[d].sort(() => Math.random() - 0.5);

      const selected: Question[] = [];
      const remaining: Question[] = [];
      for (const [domain, quota] of Object.entries(domainQuota)) {
        const bucket = buckets[domain] || [];
        selected.push(...bucket.slice(0, quota));
        remaining.push(...bucket.slice(quota));
      }
      if (selected.length < examConfig.totalQuestions) {
        remaining.sort(() => Math.random() - 0.5);
        selected.push(...remaining.slice(0, examConfig.totalQuestions - selected.length));
      }
      selected.sort(() => Math.random() - 0.5);
      setMockQuestions(selected.slice(0, examConfig.totalQuestions));
      startedAtRef.current = new Date().toISOString();
    } catch { setMockQuestions([]); }

    setMockLoading(false);
    setPageMode("mock");
  }

  useEffect(() => {
    if (pageMode !== "mock") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { handleMockFinish(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageMode]);

  const handleMockFinish = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const guessDomain = currentExam === "CLF-C02" ? guessDomainCLF : guessDomainSAA;
    let correct = 0;
    const domainScores: Record<string, { correct: number; total: number }> = {};
    const wrongQuestions: { index: number; question: Question; selected: string[] }[] = [];

    mockQuestions.forEach((q, i) => {
      const selected = mockAnswers[i] || [];
      const isCorrect = selected.length === q.correct_answers.length &&
        selected.every((a) => q.correct_answers.includes(a));
      if (isCorrect) correct++;
      const domain = guessDomain(q);
      if (!domainScores[domain]) domainScores[domain] = { correct: 0, total: 0 };
      domainScores[domain].total++;
      if (isCorrect) domainScores[domain].correct++;
      if (!isCorrect) wrongQuestions.push({ index: i, question: q, selected });
      addAttempt({ question_id: q.id, selected_answers: selected, is_correct: isCorrect, time_spent_seconds: 0 });
    });

    const score = mockQuestions.length > 0 ? Math.round((correct / mockQuestions.length) * 1000) : 0;
    saveMockExamResult({
      id: crypto.randomUUID(), started_at: startedAtRef.current,
      finished_at: new Date().toISOString(), question_ids: mockQuestions.map((q) => q.id),
      answers: mockAnswers, total_questions: mockQuestions.length, correct_count: correct,
      score, passed: score >= examConfig.passingScore, domain_scores: domainScores,
    });
    setMockResults({ correct, total: mockQuestions.length, domainScores, wrongQuestions });
    setPageMode("mock-result");
  }, [mockQuestions, mockAnswers, examConfig, currentExam]);

  // Auto-start for url-driven modes
  useEffect(() => {
    if (urlMode === "quiz") {
      if (service) startQuiz("service");
      else if (searchParams.get("mode") === "review") startReviewQuiz();
      else startQuiz("normal");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, "0")}`;
  }

  // ── SELECT SCREEN ──
  if (pageMode === "select") {
    return (
      <div className="max-w-lg mx-auto px-4 pt-8 pb-24">
        <h1 className="text-xl font-bold text-white mb-1">문제</h1>
        <p className="text-sm text-gray-400 mb-6">{examConfig.label}</p>
        <div className="flex gap-4">
          <button
            onClick={() => startQuiz("normal")}
            className="flex-1 bg-gray-800 border-2 border-gray-700 hover:border-blue-500 rounded-2xl p-5 text-left transition-all"
          >
            <div className="text-base font-semibold text-white">랜덤 풀기</div>
          </button>
          <button
            onClick={startMock}
            className="flex-1 bg-gray-800 border-2 border-gray-700 hover:border-blue-500 rounded-2xl p-5 text-left transition-all"
          >
            <div className="text-base font-semibold text-white">모의고사</div>
          </button>
        </div>
      </div>
    );
  }

  // ── QUIZ MODE ──
  if (pageMode === "quiz") {
    if (quizLoading) {
      return <div className="max-w-lg mx-auto px-4 pt-20 text-center"><p className="text-muted">로딩 중...</p></div>;
    }
    if (questions.length === 0) {
      return (
        <div className="max-w-lg mx-auto px-4 pt-20 text-center">
          {quizSubMode === "service" && service ? (
            <>
              <p className="text-lg mb-2">{service} 관련 문제가 없습니다</p>
              <Link href="/concepts" className="text-primary font-medium text-sm">서비스 사전으로 돌아가기 →</Link>
            </>
          ) : quizSubMode === "review" ? (
            <>
              <p className="text-lg mb-2">복습할 문제가 없습니다</p>
              <Link href="/review" className="text-primary font-medium text-sm">오답노트로 돌아가기 →</Link>
            </>
          ) : (
            <p className="text-muted">문제가 없습니다.</p>
          )}
        </div>
      );
    }
    return (
      <div>
        {quizSubMode === "service" && service && (
          <div className="max-w-lg mx-auto px-4 pt-2">
            <div className="bg-info-bg border border-info-border rounded-xl px-4 py-2 text-sm text-info-fg flex justify-between items-center">
              <Link href="/concepts" className="hover:underline">← {service}</Link>
              <span>{currentIndex + 1} / {questions.length}문제</span>
            </div>
          </div>
        )}
        {quizSubMode === "review" && (
          <div className="max-w-lg mx-auto px-4 pt-2">
            <div className="bg-accent-bg border border-accent-border rounded-xl px-4 py-2 text-sm text-accent-fg flex justify-between items-center">
              <span>복습 모드</span>
              <span>{questions.length}문제</span>
            </div>
          </div>
        )}
        <div className="max-w-lg mx-auto px-4 pt-2 flex justify-between items-center gap-3">
          <button onClick={() => setPageMode("select")} className="text-xs text-muted hover:text-primary px-2 py-1">
            ← 문제 선택
          </button>
          <div className="flex items-center gap-3">
            {(quizSubMode === "normal" || quizSubMode === "service") && currentIndex > 0 && (
              <button
                onClick={() => { if (quizSubMode === "service") clearServiceQuizProgress(); else clearQuizProgress(); startQuiz(quizSubMode); }}
                className="text-xs text-muted hover:text-primary px-2 py-1"
              >
                처음부터
              </button>
            )}
            <button
              onClick={() => { if (!isCorrectionsEnabled()) { showReportToast("Supabase 설정 필요"); return; } setReportOpen(true); }}
              className="text-xs text-danger-fg hover:text-danger px-2 py-1 flex items-center gap-1"
            >
              <span aria-hidden>⚠</span> 수정 요청
            </button>
          </div>
        </div>
        <QuestionCard
          question={questions[currentIndex]}
          questionIndex={currentIndex}
          totalQuestions={questions.length}
          onNext={handleNext}
        />
        {reportOpen && questions[currentIndex] && (
          <CorrectionReportSheet
            isOpen question={questions[currentIndex]}
            onClose={() => setReportOpen(false)}
            onSubmitted={(msg) => { setReportOpen(false); showReportToast(msg); }}
          />
        )}
        {reportToast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-card-elevated border border-border text-foreground text-sm px-4 py-2 rounded-xl shadow-lg z-50 whitespace-nowrap">
            {reportToast}
          </div>
        )}
      </div>
    );
  }

  // ── MOCK EXAM ──
  if (pageMode === "mock") {
    if (mockLoading || mockQuestions.length === 0) {
      return <div className="max-w-lg mx-auto px-4 pt-20 text-center"><p className="text-muted">모의고사 준비 중...</p></div>;
    }
    const q = mockQuestions[mockIndex];
    const selected = mockAnswers[mockIndex] || [];
    const expectedCount = detectMultiSelectCount(q.question_text);
    const isMulti = expectedCount > 1 || q.correct_answers.length > 1;
    const selectCount = Math.max(expectedCount, q.correct_answers.length);
    const isTimeWarning = timeLeft < 180;

    function handleMockSelect(label: string) {
      setMockAnswers((prev) => {
        const cur = prev[mockIndex] || [];
        if (isMulti) {
          if (cur.includes(label)) return { ...prev, [mockIndex]: cur.filter((a) => a !== label) };
          if (cur.length >= selectCount) return { ...prev, [mockIndex]: [...cur.slice(1), label] };
          return { ...prev, [mockIndex]: [...cur, label] };
        }
        return { ...prev, [mockIndex]: [label] };
      });
    }

    return (
      <div className="max-w-lg mx-auto px-4 pt-2 pb-24">
        <div className="sticky top-0 bg-background z-10 pb-2 pt-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">{mockIndex + 1} / {mockQuestions.length}</span>
            <span className={`text-sm font-mono font-bold ${isTimeWarning ? "text-danger" : "text-muted"}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className="bg-border rounded-full h-1.5">
            <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${((mockIndex + 1) / mockQuestions.length) * 100}%` }} />
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 mb-3 mt-2">
          {isMulti && <span className="inline-block text-xs bg-warning-bg text-warning-fg border border-warning-border px-2 py-0.5 rounded mb-2">{selectCount}개 선택</span>}
          <p className="text-sm leading-relaxed whitespace-pre-line">{q.question_text}</p>
        </div>
        <div className="space-y-2 mb-3">
          {q.options.map((opt) => {
            const isSel = selected.includes(opt.label);
            return (
              <button key={opt.label} onClick={() => handleMockSelect(opt.label)}
                className={`w-full text-left rounded-xl border-2 p-3 transition-all active:scale-[0.99] ${isSel ? "border-primary bg-info-bg" : "border-border bg-card"}`}>
                <div className="flex gap-3">
                  <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${isSel ? "bg-primary text-on-primary" : "bg-muted-bg text-muted"}`}>{opt.label}</span>
                  <span className="text-sm leading-relaxed">{opt.text}</span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMockIndex((p) => Math.max(0, p - 1))} disabled={mockIndex === 0}
            className="flex-1 py-3 rounded-xl border border-border text-sm font-medium disabled:opacity-30">이전</button>
          {mockIndex < mockQuestions.length - 1 ? (
            <button onClick={() => setMockIndex((p) => p + 1)} className="flex-1 py-3 rounded-xl bg-primary text-on-primary text-sm font-medium">다음</button>
          ) : (
            <button onClick={handleMockFinish} className="flex-1 py-3 rounded-xl bg-danger text-on-primary text-sm font-medium">시험 종료</button>
          )}
        </div>
        <div className="mt-4">
          <p className="text-xs text-muted mb-2">문제 번호</p>
          <div className="flex gap-1 flex-wrap">
            {mockQuestions.map((_, i) => (
              <button key={i} onClick={() => setMockIndex(i)}
                className={`w-8 h-8 rounded text-xs font-medium ${i === mockIndex ? "bg-primary text-on-primary" : mockAnswers[i] ? "bg-info-bg text-info-fg" : "bg-muted-bg text-muted"}`}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── MOCK RESULT ──
  if (pageMode === "mock-result" && mockResults) {
    const score = mockResults.total > 0 ? Math.round((mockResults.correct / mockResults.total) * 1000) : 0;
    const passed = score >= examConfig.passingScore;
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
        <h1 className="text-xl font-bold mb-4">모의고사 결과</h1>
        <div className={`rounded-2xl p-6 mb-4 text-on-primary text-center ${passed ? "bg-success" : "bg-danger"}`}>
          <p className="text-sm opacity-80 mb-1">{passed ? "합격!" : "불합격"}</p>
          <p className="text-4xl font-bold mb-1">{score} / 1000</p>
          <p className="text-sm opacity-80">정답 {mockResults.correct} / {mockResults.total}문제 (합격 기준: {examConfig.passingScore}점)</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 mb-4">
          <h2 className="font-semibold mb-3">도메인별 정답률</h2>
          <div className="space-y-3">
            {Object.entries(mockResults.domainScores).map(([domain, s]) => {
              const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
              return (
                <div key={domain}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{domain}</span>
                    <span className="text-muted">{s.correct}/{s.total} ({pct}%)</span>
                  </div>
                  <div className="bg-border rounded-full h-2">
                    <div className={`rounded-full h-2 ${pct >= 70 ? "bg-success" : "bg-danger"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {mockResults.wrongQuestions.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4 mb-4">
            <h2 className="font-semibold mb-3">오답 해설 ({mockResults.wrongQuestions.length}문제)</h2>
            <div className="space-y-4">
              {mockResults.wrongQuestions.map(({ index, question, selected }) => (
                <div key={question.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <p className="text-xs text-muted mb-1">문제 {index + 1}</p>
                  <p className="text-sm leading-relaxed mb-2 whitespace-pre-line">{question.question_text}</p>
                  <div className="space-y-1 mb-2">
                    {question.options.map((opt) => {
                      const isSel = selected.includes(opt.label);
                      const isCorr = question.correct_answers.includes(opt.label);
                      return (
                        <p key={opt.label} className={`text-xs ${isCorr ? "text-success-fg font-medium" : isSel ? "text-danger-fg line-through" : "text-muted"}`}>
                          {opt.label}. {opt.text}{isCorr && " ✓"}{isSel && !isCorr && " (내 답)"}
                        </p>
                      );
                    })}
                  </div>
                  {question.explanation && (
                    <div className="bg-info-bg border border-info-border rounded-lg p-3 mt-2">
                      <MarkdownContent className="text-info-fg">{question.explanation}</MarkdownContent>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <button onClick={() => setPageMode("select")} className="w-full py-3 rounded-xl bg-primary text-on-primary text-sm font-medium">
          문제 선택으로 돌아가기
        </button>
      </div>
    );
  }

  return null;
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto px-4 pt-20 text-center"><p className="text-muted">로딩 중...</p></div>}>
      <QuestionsContent />
    </Suspense>
  );
}
