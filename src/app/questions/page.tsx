"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Question } from "@/lib/types";
import QuestionCard from "@/components/QuestionCard";
import {
  getQuizProgress,
  saveQuizProgress,
  clearQuizProgress,
  getServiceQuizProgress,
  saveServiceQuizProgress,
  clearServiceQuizProgress,
  getTodayReviewQuestionIds,
  getAttemptedQuestionIds,
} from "@/lib/store";
import { getDataServiceNames } from "@/lib/serviceMap";
import CorrectionReportSheet from "@/components/CorrectionReportSheet";
import { isCorrectionsEnabled } from "@/lib/corrections";
import Link from "next/link";

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

function QuestionsContent() {
  const searchParams = useSearchParams();
  const service = searchParams.get("service");
  const mode = service ? "service" : searchParams.get("mode") === "review" ? "review" : "normal";

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportToast, setReportToast] = useState<string | null>(null);

  function showReportToast(msg: string) {
    setReportToast(msg);
    window.setTimeout(() => setReportToast(null), 2500);
  }

  function handleOpenReport() {
    if (!isCorrectionsEnabled()) {
      showReportToast("Supabase 설정이 필요합니다");
      return;
    }
    setReportOpen(true);
  }

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, service]);

  async function loadQuestions() {
    try {
      const res = await fetch("/api/questions");
      const data = await res.json();

      if (mode === "service" && service) {
        // 서비스 모드: 특정 서비스 관련 문제만 필터링
        const dataNames = getDataServiceNames(service);
        const serviceQuestions = (data.questions as Question[]).filter((q) =>
          q.related_services.some((s) => dataNames.includes(s))
        );

        // 저장된 진행 상태 복원 시도
        const saved = getServiceQuizProgress();
        if (saved && saved.mode === "service" && saved.serviceName === service && saved.questionIds.length > 0) {
          const questionMap = new Map(serviceQuestions.map((q) => [q.id, q]));
          const restored = saved.questionIds
            .map((id) => questionMap.get(id))
            .filter((q): q is Question => !!q);

          if (restored.length > 0) {
            setQuestions(restored);
            setCurrentIndex(Math.min(saved.currentIndex, restored.length - 1));
          } else {
            startServiceFresh(serviceQuestions, service);
          }
        } else {
          startServiceFresh(serviceQuestions, service);
        }
      } else if (mode === "review") {
        // 복습 모드: 오늘 복습할 문제만 필터링
        const reviewIds = getTodayReviewQuestionIds();
        const reviewQuestions = (data.questions as Question[]).filter((q) =>
          reviewIds.includes(q.id)
        );
        const shuffled = [...reviewQuestions].sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
        setCurrentIndex(0);
      } else {
        // 일반 모드: 저장된 진행 상태 복원 or 새로 셔플
        const saved = getQuizProgress();
        const allQuestions = data.questions as Question[];

        if (saved && saved.mode === "normal" && saved.questionIds.length > 0) {
          // 저장된 순서로 문제 복원
          const questionMap = new Map(allQuestions.map((q) => [q.id, q]));
          const restored = saved.questionIds
            .map((id) => questionMap.get(id))
            .filter((q): q is Question => !!q);

          if (restored.length > 0) {
            setQuestions(restored);
            setCurrentIndex(Math.min(saved.currentIndex, restored.length - 1));
          } else {
            // 저장된 ID가 현재 데이터와 안 맞으면 새로 셔플
            startFresh(allQuestions);
          }
        } else {
          startFresh(allQuestions);
        }
      }
    } catch {
      setQuestions(getSampleQuestions());
    }
    setLoading(false);
  }

  function startFresh(allQuestions: Question[]) {
    const ordered = buildPrioritizedOrder(allQuestions);
    setQuestions(ordered);
    setCurrentIndex(0);
    saveQuizProgress({
      questionIds: ordered.map((q) => q.id),
      currentIndex: 0,
      mode: "normal",
    });
  }

  function startServiceFresh(serviceQuestions: Question[], serviceName: string) {
    const ordered = buildPrioritizedOrder(serviceQuestions);
    setQuestions(ordered);
    setCurrentIndex(0);
    saveServiceQuizProgress({
      questionIds: ordered.map((q) => q.id),
      currentIndex: 0,
      mode: "service",
      serviceName,
    });
  }

  function handleRestart() {
    if (mode === "service") {
      clearServiceQuizProgress();
    } else {
      clearQuizProgress();
    }
    loadQuestions();
  }

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      if (mode === "normal") {
        saveQuizProgress({
          questionIds: questions.map((q) => q.id),
          currentIndex: nextIndex,
          mode: "normal",
        });
      } else if (mode === "service" && service) {
        saveServiceQuizProgress({
          questionIds: questions.map((q) => q.id),
          currentIndex: nextIndex,
          mode: "service",
          serviceName: service,
        });
      }
    }
  }, [currentIndex, questions, mode, service]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 text-center">
        <p className="text-muted font-display tracking-widest animate-flicker">&gt; LOADING...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 text-center">
        {mode === "service" && service ? (
          <>
            <p className="text-4xl mb-4 animate-flicker">📭</p>
            <p className="text-sm font-display tracking-widest text-neon-pink mb-2 neon-glow-pink">&gt; {service} EMPTY</p>
            <p className="text-xs text-muted mb-4 font-retro">이 서비스 퀘스트가 없음</p>
            <Link href="/concepts" className="text-neon-cyan font-display text-xs tracking-widest neon-glow-cyan">
              &gt; BACK TO CODEX →
            </Link>
          </>
        ) : mode === "review" ? (
          <>
            <p className="text-4xl mb-4 animate-flicker">✨</p>
            <p className="text-sm font-display tracking-widest text-neon-lime neon-glow-lime mb-2">&gt; ALL CLEAR!</p>
            <p className="text-xs text-muted mb-4 font-retro">재도전 퀘스트 없음</p>
            <Link href="/review" className="text-neon-pink font-display text-xs tracking-widest neon-glow-pink">
              &gt; BACK TO REMATCH →
            </Link>
          </>
        ) : (
          <p className="text-muted font-display tracking-widest">&gt; NO DATA</p>
        )}
      </div>
    );
  }

  return (
    <div>
      {mode === "service" && service && (
        <div className="max-w-lg mx-auto px-4 pt-3">
          <div
            className="px-3 py-2 text-xs font-display tracking-widest flex justify-between items-center"
            style={{
              background: "rgba(0, 240, 255, 0.1)",
              border: "1px solid rgba(0, 240, 255, 0.45)",
              color: "var(--info-fg)",
            }}
          >
            <Link href="/concepts" className="hover:underline">← {service}</Link>
            <span>{currentIndex + 1} / {questions.length}</span>
          </div>
        </div>
      )}

      {mode === "review" && (
        <div className="max-w-lg mx-auto px-4 pt-3">
          <div
            className="px-3 py-2 text-xs font-display tracking-widest flex justify-between items-center"
            style={{
              background: "rgba(168, 85, 255, 0.12)",
              border: "1px solid rgba(168, 85, 255, 0.5)",
              color: "var(--accent-fg)",
            }}
          >
            <span>&gt; REMATCH MODE</span>
            <span>{questions.length}Q</span>
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 pt-2 flex justify-end items-center gap-2">
        {(mode === "normal" || mode === "service") && currentIndex > 0 && (
          <button
            onClick={handleRestart}
            className="text-[10px] font-display tracking-widest text-muted hover:text-neon-pink transition-colors px-2 py-1"
          >
            [RESET]
          </button>
        )}
        <button
          type="button"
          onClick={handleOpenReport}
          className="text-[10px] font-display tracking-widest transition-colors px-2 py-1 flex items-center gap-1"
          style={{ color: "var(--danger-fg)" }}
        >
          <span aria-hidden>⚠</span>
          <span>REPORT</span>
        </button>
      </div>

      <QuestionCard
        question={questions[currentIndex]}
        questionIndex={currentIndex}
        totalQuestions={questions.length}
        onNext={handleNext}
      />

      {reportOpen && questions[currentIndex] && (
        <CorrectionReportSheet
          isOpen
          question={questions[currentIndex]}
          onClose={() => setReportOpen(false)}
          onSubmitted={(msg) => {
            setReportOpen(false);
            showReportToast(msg);
          }}
        />
      )}

      {reportToast && (
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 text-xs px-4 py-2 z-50 animate-fade-in whitespace-nowrap font-display tracking-widest"
          style={{
            background: "rgba(10, 5, 20, 0.95)",
            color: "var(--neon-cyan)",
            border: "1px solid rgba(0, 240, 255, 0.5)",
            boxShadow: "0 0 16px rgba(0, 240, 255, 0.3)",
            textShadow: "0 0 6px rgba(0, 240, 255, 0.6)",
          }}
        >
          {reportToast}
        </div>
      )}
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto px-4 pt-20 text-center">
          <p className="text-muted font-display tracking-widest animate-flicker">&gt; LOADING...</p>
        </div>
      }
    >
      <QuestionsContent />
    </Suspense>
  );
}

function getSampleQuestions(): Question[] {
  return [
    {
      id: "sample-1",
      source: "nxtcloud",
      question_text:
        "한 회사가 AWS에서 결제 애플리케이션을 실행하려고 합니다. 애플리케이션은 모바일 장치로부터 결제 알림을 받습니다. 결제 알림은 추가 처리를 위해 전송되기 전에 기본적인 확인이 필요합니다. 백엔드 처리 애플리케이션은 장기간 실행되며 컴퓨팅 및 메모리를 조정해야 합니다. 회사는 인프라 관리를 원하지 않습니다.\n\n최소한의 운영 오버헤드로 이러한 요구 사항을 충족하는 솔루션은 무엇입니까?",
      options: [
        { label: "A", text: "Amazon SQS 대기열을 생성합니다. 대기열을 Amazon EventBridge 규칙과 통합하여 모바일 장치에서 결제 알림을 받습니다. Amazon EKS에 백엔드 애플리케이션을 배포합니다." },
        { label: "B", text: "Amazon API Gateway API를 생성합니다. API를 AWS Step Functions 상태 머신과 통합합니다. Amazon EKS에 자체 관리형 노드로 백엔드를 배포합니다." },
        { label: "C", text: "Amazon SQS 대기열을 생성합니다. Amazon EC2 스팟 인스턴스에 백엔드 애플리케이션을 배포합니다." },
        { label: "D", text: "Amazon API Gateway API를 생성합니다. API를 AWS Lambda와 통합하여 결제 알림을 검증합니다. Amazon ECS에 AWS Fargate로 백엔드를 배포합니다." },
      ],
      correct_answers: ["D"],
      explanation:
        "모바일 장치와 같은 외부 클라이언트로부터 데이터를 수신할 때는 Amazon API Gateway가 가장 표준적인 진입점입니다. 간단한 유효성 검사는 AWS Lambda로 처리하고, 인프라 관리 없이 장시간 실행되는 컨테이너는 AWS Fargate(Amazon ECS)를 사용하는 것이 정답입니다.",
      related_services: ["API Gateway", "Lambda", "ECS", "Fargate"],
    },
  ];
}
