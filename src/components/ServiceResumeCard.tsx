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
      className="block pixel-panel p-4 mb-6 transition-transform active:translate-x-[2px] active:translate-y-[2px]"
      style={{ borderColor: "var(--mana)" }}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl leading-none animate-pixel-bounce" aria-hidden>
          ▶
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="pixel-label text-mana">CONTINUE</span>
            <span className="caption">{progress.currentIndex + 1} / {progress.total}</span>
          </div>
          <p className="section-title text-parchment mt-1 truncate">{progress.serviceName}</p>
        </div>
        <span className="pixel-label text-gold animate-blink flex-shrink-0" aria-hidden>
          ►
        </span>
      </div>
      <div
        className="h-2"
        style={{ background: "var(--gb-dark)", border: "1.5px solid var(--border)" }}
      >
        <div
          className="h-full transition-[width] duration-300"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #5b9cd8, #8fc0e8)",
          }}
        />
      </div>
    </Link>
  );
}
