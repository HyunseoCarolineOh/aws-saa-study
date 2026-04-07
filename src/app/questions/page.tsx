"use client";

import { useState, useEffect, useCallback } from "react";
import type { Question } from "@/lib/types";
import QuestionCard from "@/components/QuestionCard";

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, []);

  async function loadQuestions() {
    try {
      const res = await fetch("/api/questions");
      const data = await res.json();
      // 랜덤 셔플
      const shuffled = [...data.questions].sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
    } catch {
      // fallback: 샘플 데이터
      setQuestions(getSampleQuestions());
    }
    setLoading(false);
  }

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, questions.length]);

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
        <p className="text-muted">문제가 없습니다.</p>
      </div>
    );
  }

  return (
    <QuestionCard
      question={questions[currentIndex]}
      questionIndex={currentIndex}
      totalQuestions={questions.length}
      onNext={handleNext}
    />
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
