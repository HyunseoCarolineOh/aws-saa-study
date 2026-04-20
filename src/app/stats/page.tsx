"use client";

import { useState, useEffect } from "react";
import { getDailyStats, getAttempts, getStreak } from "@/lib/store";
import type { Attempt, DailyStats } from "@/lib/types";

export default function StatsPage() {
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [streak, setStreakCount] = useState(0);

  useEffect(() => {
    setStats(getDailyStats());
    setAttempts(getAttempts());
    setStreakCount(getStreak());
  }, []);

  const totalQuestions = attempts.length;
  const correctCount = attempts.filter((a) => a.is_correct).length;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const avgTimePerQuestion =
    totalQuestions > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.time_spent_seconds, 0) / totalQuestions)
      : 0;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="mb-5">
        <p className="text-[10px] font-display text-neon-cyan tracking-[0.3em] neon-glow-cyan">HI-SCORE BOARD</p>
        <h1 className="text-xl font-display font-black text-neon-pink neon-glow-pink animate-flicker">&gt; SCORE LOG</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard label="SOLVED" value={`${totalQuestions}`} suffix="Q" color="#ff2e88" />
        <StatCard label="ACCURACY" value={`${accuracy}`} suffix="%" color={accuracy >= 70 ? "#b4ff39" : "#ff2e88"} />
        <StatCard label="STREAK" value={`${streak}`} suffix="D" color="#ffee00" />
        <StatCard label="SPEED" value={`${avgTimePerQuestion}`} suffix="S" color="#a855ff" />
      </div>

      <div
        className="p-5"
        style={{
          background: "rgba(18, 7, 38, 0.9)",
          border: "1.5px solid rgba(168, 85, 255, 0.35)",
          boxShadow: "0 0 18px rgba(168, 85, 255, 0.12)",
        }}
      >
        <h2 className="font-display text-sm text-accent-fg tracking-widest mb-3" style={{ textShadow: "0 0 8px rgba(168,85,255,0.6)" }}>
          &gt; BATTLE LOG
        </h2>
        {stats.length === 0 ? (
          <p className="text-xs font-display tracking-widest text-muted text-center py-6">
            &gt; NO DATA FOUND<br />
            <span className="text-[10px]">INSERT COIN TO START</span>
          </p>
        ) : (
          <div className="space-y-1">
            {[...stats].reverse().map((s) => {
              const acc = s.questions_solved > 0 ? Math.round((s.correct_count / s.questions_solved) * 100) : 0;
              return (
                <div
                  key={s.study_date}
                  className="flex justify-between items-center py-2.5 px-3"
                  style={{
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(58, 29, 95, 0.5)",
                  }}
                >
                  <span className="text-xs font-retro text-muted">{s.study_date}</span>
                  <div className="flex gap-3 text-xs font-display">
                    <span className="text-neon-cyan">{s.questions_solved}Q</span>
                    <span style={{ color: acc >= 70 ? "#b4ff39" : "#ff2e88", textShadow: `0 0 6px ${acc >= 70 ? "#b4ff3999" : "#ff2e8899"}` }}>
                      {acc}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  color,
}: {
  label: string;
  value: string;
  suffix: string;
  color: string;
}) {
  return (
    <div
      className="p-4 text-center"
      style={{
        background: "rgba(18, 7, 38, 0.9)",
        border: `1.5px solid ${color}55`,
        boxShadow: `0 0 12px ${color}33, inset 0 0 16px rgba(0,0,0,0.5)`,
      }}
    >
      <p className="text-2xl font-display font-black leading-none" style={{ color, textShadow: `0 0 10px ${color}99` }}>
        {value}
        <span className="text-sm opacity-80 ml-0.5">{suffix}</span>
      </p>
      <p className="text-[9px] font-display tracking-widest text-muted mt-1">{label}</p>
    </div>
  );
}
