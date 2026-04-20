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

  const pct = Math.round(((progress.currentIndex + 1) / progress.total) * 100);

  return (
    <Link
      href={`/questions?service=${encodeURIComponent(progress.serviceName)}`}
      className="block rounded-3xl p-4 mb-4 transition-all active:scale-[0.98] wobble-hover animate-pulse-glow"
      style={{
        background: "linear-gradient(135deg, rgba(200,180,255,0.14), rgba(168,220,255,0.14))",
        border: "1px solid rgba(200,180,255,0.4)",
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl animate-bounce-soft">🎮</span>
          <div>
            <p className="text-xs text-lavender font-display font-bold">이어서 도전!</p>
            <p className="text-[11px] text-muted">
              {progress.serviceName} · {progress.currentIndex + 1} / {progress.total}
            </p>
          </div>
        </div>
        <span className="text-lavender text-xl">▶</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted-bg overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #c8b4ff, #a8dcff)",
          }}
        />
      </div>
    </Link>
  );
}
