"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getServiceQuizProgress } from "@/lib/store";

export default function ServiceResumeCard() {
  const [progress, setProgress] = useState<{
    serviceName: string;
    currentIndex: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    const saved = getServiceQuizProgress();
    if (saved && saved.mode === "service" && saved.serviceName && saved.currentIndex > 0) {
      setProgress({
        serviceName: saved.serviceName,
        currentIndex: saved.currentIndex,
        total: saved.questionIds.length,
      });
    }
  }, []);

  if (!progress) return null;

  return (
    <Link
      href={`/questions?service=${encodeURIComponent(progress.serviceName)}`}
      className="block bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 hover:border-blue-400 transition-colors active:scale-[0.98]"
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-blue-900">이어서 풀기</p>
          <p className="text-xs text-blue-600">{progress.serviceName} — {progress.currentIndex + 1} / {progress.total}문제</p>
        </div>
        <span className="text-blue-400 text-lg">&rarr;</span>
      </div>
    </Link>
  );
}
