"use client";

import { useState, useEffect } from "react";
import { getTodayReviewQuestionIds, getAttempts } from "@/lib/store";
import Link from "next/link";

export default function ReviewPage() {
  const [reviewIds, setReviewIds] = useState<string[]>([]);
  const [wrongCount, setWrongCount] = useState(0);

  useEffect(() => {
    const ids = getTodayReviewQuestionIds();
    setReviewIds(ids);
    const attempts = getAttempts();
    const wrong = attempts.filter((a) => !a.is_correct);
    setWrongCount(wrong.length);
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="text-xl font-bold mb-4">오답 복습</h1>

      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-red-500">{wrongCount}</p>
            <p className="text-xs text-muted">총 오답 수</p>
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
          className="block w-full bg-primary text-white text-center py-3 rounded-xl font-medium"
        >
          복습 시작 ({reviewIds.length}문제)
        </Link>
      ) : (
        <div className="text-center py-12 text-muted">
          <p className="text-lg mb-2">오늘 복습할 문제가 없습니다</p>
          <p className="text-sm">문제를 풀고 틀린 문제가 생기면 여기서 복습할 수 있습니다</p>
          <Link href="/questions" className="inline-block mt-4 text-primary font-medium text-sm">
            문제 풀러 가기 &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
