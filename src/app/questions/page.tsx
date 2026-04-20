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
        <p className="text-muted font-display font-semibold animate-bounce-soft">🍡 문제 모으는 중...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 text-center">
        {mode === "service" && service ? (
          <>
            <p className="text-5xl mb-4">🗺️</p>
            <p className="text-lg font-display font-bold text-rose mb-2">{service} 퀘스트 품절!</p>
            <p className="text-sm text-muted mb-4">이 서비스와 연결된 문제가 아직 없어요.</p>
            <Link href="/concepts" className="text-rose font-display font-bold text-sm">
              📖 서비스 도감으로 돌아가기 →
            </Link>
          </>
        ) : mode === "review" ? (
          <>
            <p className="text-5xl mb-4">🌟</p>
            <p className="text-lg font-display font-bold text-mint mb-2">오늘은 재도전할 문제가 없어요!</p>
            <p className="text-sm text-muted mb-4">오늘 복습 예정이거나 틀린 문제가 없네요.</p>
            <Link href="/review" className="text-rose font-display font-bold text-sm">
              🔄 수련장으로 돌아가기 →
            </Link>
          </>
        ) : (
          <p className="text-muted">문제가 없어요.</p>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* 서비스 모드 배너 */}
      {mode === "service" && service && (
        <div className="max-w-lg mx-auto px-4 pt-3">
          <div
            className="rounded-full px-4 py-2 text-xs flex justify-between items-center font-display font-bold"
            style={{
              background: "linear-gradient(135deg, rgba(168,220,255,0.15), rgba(200,180,255,0.15))",
              border: "1px solid rgba(168,220,255,0.4)",
              color: "var(--info-fg)",
            }}
          >
            <Link href="/concepts" className="hover:underline">← {service} 📖</Link>
            <span>{currentIndex + 1} / {questions.length}</span>
          </div>
        </div>
      )}

      {/* 복습 모드 배너 */}
      {mode === "review" && (
        <div className="max-w-lg mx-auto px-4 pt-3">
          <div
            className="rounded-full px-4 py-2 text-xs flex justify-between items-center font-display font-bold"
            style={{
              background: "linear-gradient(135deg, rgba(255,203,168,0.18), rgba(255,180,198,0.18))",
              border: "1px solid rgba(255,203,168,0.4)",
              color: "var(--accent-fg)",
            }}
          >
            <span>🔄 수련장 모드</span>
            <span>{questions.length}문제</span>
          </div>
        </div>
      )}

      {/* 툴바 */}
      <div className="max-w-lg mx-auto px-4 pt-2 flex justify-end items-center gap-2">
        {(mode === "normal" || mode === "service") && currentIndex > 0 && (
          <button
            onClick={handleRestart}
            className="text-[11px] text-muted hover:text-rose transition-colors px-2.5 py-1 rounded-full font-display font-bold"
          >
            🔁 처음부터
          </button>
        )}
        <button
          type="button"
          onClick={handleOpenReport}
          className="text-[11px] transition-colors px-2.5 py-1 rounded-full font-display font-bold flex items-center gap-1"
          style={{ color: "var(--danger-fg)" }}
        >
          <span aria-hidden>⚠</span>
          <span>수정 요청</span>
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
          className="fixed bottom-20 left-1/2 -translate-x-1/2 text-sm px-4 py-2 rounded-full z-50 animate-fade-in whitespace-nowrap font-display font-bold"
          style={{
            background: "linear-gradient(135deg, rgba(46,40,73,0.95), rgba(37,32,58,0.95))",
            border: "1px solid rgba(200,180,255,0.35)",
            color: "var(--foreground)",
            backdropFilter: "blur(12px)",
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
          <p className="text-muted font-display font-semibold animate-bounce-soft">🍡 문제 모으는 중...</p>
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
