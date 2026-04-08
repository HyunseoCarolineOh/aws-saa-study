"use client";

import { useState, useEffect } from "react";
import { getTodayReviewQuestionIds, getWrongAttemptsSummary } from "@/lib/store";
import type { Question } from "@/lib/types";
import Link from "next/link";

export default function ReviewPage() {
  const [reviewIds, setReviewIds] = useState<string[]>([]);
  const [wrongSummary, setWrongSummary] = useState<{ questionId: string; lastAttemptAt: string; attemptCount: number }[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = getTodayReviewQuestionIds();
    setReviewIds(ids);
    const summary = getWrongAttemptsSummary();
    setWrongSummary(summary);

    // 문제 데이터 로드 (텍스트 미리보기용)
    fetch("/api/questions")
      .then((res) => res.json())
      .then((data) => setQuestions(data.questions))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const wrongCount = wrongSummary.length;

  // 오답 문제의 텍스트 매핑
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <h1 className="text-xl font-bold mb-4">오답 복습</h1>

      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-red-500">{wrongCount}</p>
            <p className="text-xs text-muted">틀린 문제 수</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{reviewIds.length}</p>
            <p className="text-xs text-muted">오늘 복습할 문제</p>
          </div>
        </div>
      </div>

      {reviewIds.length > 0 ? (
        <Link
          href="/questions?mode=review"
          className="block w-full bg-primary text-white text-center py-3 rounded-xl font-medium mb-6"
        >
          복습 시작 ({reviewIds.length}문제)
        </Link>
      ) : (
        <div className="text-center py-8 text-muted mb-6">
          <p className="text-lg mb-2">오늘 복습할 문제가 없습니다</p>
          <p className="text-sm">문제를 풀고 틀린 문제가 생기면 여기서 복습할 수 있습니다</p>
          <Link href="/questions" className="inline-block mt-4 text-primary font-medium text-sm">
            문제 풀러 가기 &rarr;
          </Link>
        </div>
      )}

      {/* 오답 문제 목록 */}
      {!loading && wrongSummary.length > 0 && (
        <div>
          <h2 className="text-sm font-bold mb-3 text-muted">틀린 문제 목록</h2>
          <div className="space-y-2">
            {wrongSummary
              .sort((a, b) => b.lastAttemptAt.localeCompare(a.lastAttemptAt))
              .map((item) => {
                const q = questionMap.get(item.questionId);
                const isReviewDue = reviewIds.includes(item.questionId);
                return (
                  <div
                    key={item.questionId}
                    className={`bg-card rounded-xl border p-3 ${
                      isReviewDue ? "border-orange-300 bg-orange-50" : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-gray-700 leading-relaxed line-clamp-2 flex-1">
                        {q ? q.question_text.slice(0, 100) + (q.question_text.length > 100 ? "..." : "") : item.questionId}
                      </p>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="text-[10px] text-red-500 font-medium">{item.attemptCount}회 오답</span>
                        {isReviewDue && (
                          <span className="text-[10px] text-orange-600 font-medium mt-0.5">복습 예정</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
