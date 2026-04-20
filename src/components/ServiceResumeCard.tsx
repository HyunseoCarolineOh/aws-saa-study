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
      className="block rounded-[24px] p-4 mb-4 transition-all active:scale-[0.97] animate-glow-pulse text-on-primary"
      style={{
        background: "linear-gradient(135deg, #4adede 0%, #7b61ff 100%)",
        boxShadow:
          "0 10px 30px -6px rgba(74, 222, 222, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.25), inset 0 -2px 0 rgba(0, 0, 0, 0.12)",
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl animate-jelly-bounce">🎮</span>
          <div>
            <p className="text-sm font-black">이어서 도전!</p>
            <p className="text-[11px] opacity-90 font-semibold">
              {progress.serviceName} · {progress.currentIndex + 1} / {progress.total}
            </p>
          </div>
        </div>
        <span className="text-xl font-black">▶</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(0, 0, 0, 0.25)" }}>
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #ffffff, rgba(255, 255, 255, 0.6))",
          }}
        />
      </div>
    </Link>
  );
}
