"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Question } from "@/lib/types";
import QuestionCard from "@/components/QuestionCard";
import {
  getQuizProgress,
  saveQuizProgress,
  clearQuizProgress,
  getTodayReviewQuestionIds,
} from "@/lib/store";
import { getDataServiceNames } from "@/lib/serviceMap";
import Link from "next/link";

function QuestionsContent() {
  const searchParams = useSearchParams();
  const service = searchParams.get("service");
  const mode = service ? "service" : searchParams.get("mode") === "review" ? "review" : "normal";

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

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
        const shuffled = [...serviceQuestions].sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
        setCurrentIndex(0);
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
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setCurrentIndex(0);
    saveQuizProgress({
      questionIds: shuffled.map((q) => q.id),
      currentIndex: 0,
      mode: "normal",
    });
  }

  function handleRestart() {
    clearQuizProgress();
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
      }
    }
  }, [currentIndex, questions, mode]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 text-center">
        <p className="text-muted">문제 로딩 중...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 text-center">
        {mode === "service" && service ? (
          <>
            <p className="text-lg mb-2">{service} 관련 문제가 없습니다</p>
            <p className="text-sm text-muted mb-4">이 서비스와 연결된 문제가 아직 없습니다.</p>
            <Link href="/concepts" className="text-primary font-medium text-sm">
              서비스 사전으로 돌아가기 &rarr;
            </Link>
          </>
        ) : mode === "review" ? (
          <>
            <p className="text-lg mb-2">복습할 문제가 없습니다</p>
            <p className="text-sm text-muted mb-4">오늘 복습 예정인 문제가 없거나, 아직 틀린 문제가 없습니다.</p>
            <Link href="/review" className="text-primary font-medium text-sm">
              오답노트로 돌아가기 &rarr;
            </Link>
          </>
        ) : (
          <p className="text-muted">문제가 없습니다.</p>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* 서비스 모드 배너 */}
      {mode === "service" && service && (
        <div className="max-w-lg mx-auto px-4 pt-2">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-sm text-blue-800 flex justify-between items-center">
            <Link href="/concepts" className="hover:underline">&larr; {service}</Link>
            <span>{questions.length}문제</span>
          </div>
        </div>
      )}

      {/* 복습 모드 배너 */}
      {mode === "review" && (
        <div className="max-w-lg mx-auto px-4 pt-2">
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2 text-sm text-orange-800 flex justify-between items-center">
            <span>복습 모드</span>
            <span>{questions.length}문제</span>
          </div>
        </div>
      )}

      {/* 처음부터 버튼 (일반 모드에서만) */}
      {mode === "normal" && currentIndex > 0 && (
        <div className="max-w-lg mx-auto px-4 pt-2 flex justify-end">
          <button
            onClick={handleRestart}
            className="text-xs text-muted hover:text-primary transition-colors px-2 py-1"
          >
            처음부터 다시 풀기
          </button>
        </div>
      )}

      <QuestionCard
        question={questions[currentIndex]}
        questionIndex={currentIndex}
        totalQuestions={questions.length}
        onNext={handleNext}
      />
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto px-4 pt-20 text-center">
          <p className="text-muted">문제 로딩 중...</p>
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
