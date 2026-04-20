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
      className="block p-4 mb-4 transition-all active:scale-[0.98]"
      style={{
        background: "rgba(18, 7, 38, 0.9)",
        border: "1.5px solid rgba(0, 240, 255, 0.5)",
        boxShadow: "0 0 18px rgba(0, 240, 255, 0.25)",
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl animate-flicker" style={{ filter: "drop-shadow(0 0 4px #00f0ff)" }}>🎮</span>
          <div>
            <p className="text-xs font-display text-neon-cyan tracking-widest neon-glow-cyan">&gt; CONTINUE?</p>
            <p className="text-[11px] text-muted font-retro mt-0.5">
              {progress.serviceName} · {progress.currentIndex + 1} / {progress.total}
            </p>
          </div>
        </div>
        <span className="text-neon-pink text-lg animate-flicker">▶</span>
      </div>
      <div className="h-1 overflow-hidden" style={{ background: "rgba(0, 0, 0, 0.6)" }}>
        <div
          className="h-full transition-[width] duration-500"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #00f0ff, #a855ff)",
            boxShadow: "0 0 8px rgba(0, 240, 255, 0.6)",
          }}
        />
      </div>
    </Link>
  );
}
