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
      className="block bg-info-bg border border-info-border rounded-xl p-4 mb-4 hover:border-info transition-colors active:scale-[0.98]"
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-info-fg">이어서 풀기</p>
          <p className="text-xs text-info">{progress.serviceName} — {progress.currentIndex + 1} / {progress.total}문제</p>
        </div>
        <span className="text-info text-lg">&rarr;</span>
      </div>
    </Link>
  );
}
