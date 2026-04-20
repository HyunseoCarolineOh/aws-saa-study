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
      className="block p-3 mb-4 pixel-panel transition-transform active:translate-x-[2px] active:translate-y-[2px]"
      style={{ borderColor: "#8fc0e8" }}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl animate-pixel-bounce" style={{ imageRendering: "pixelated" }}>▶</span>
          <div>
            <p className="text-[10px] font-display text-mana">&gt; CONTINUE</p>
            <p className="text-xs text-parchment font-retro mt-0.5">
              {progress.serviceName} · {progress.currentIndex + 1}/{progress.total}
            </p>
          </div>
        </div>
        <span className="text-gold font-display text-xs animate-blink">▶▶</span>
      </div>
      <div className="h-2" style={{ background: "#0f380f", border: "1px solid #5a4530" }}>
        <div
          className="h-full transition-[width] duration-300"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #8fc0e8, #5b9cd8)",
          }}
        />
      </div>
    </Link>
  );
}
