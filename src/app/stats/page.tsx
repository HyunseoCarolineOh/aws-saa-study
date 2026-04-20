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
        <p className="text-xs text-muted font-semibold tracking-wider">STATUS WINDOW</p>
        <h1 className="text-2xl font-display font-black text-rose">나의 스탯 창 ✨</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard label="클리어 수" value={`${totalQuestions}`} suffix="문제" emoji="⚔️" tint="#ffb4c6" />
        <StatCard
          label="명중률"
          value={`${accuracy}`}
          suffix="%"
          emoji={accuracy >= 70 ? "🎯" : "💥"}
          tint={accuracy >= 70 ? "#b4f2e1" : "#ff9fb5"}
        />
        <StatCard label="연속 스트릭" value={`${streak}`} suffix="일" emoji="🔥" tint="#ffcba8" />
        <StatCard label="평균 속도" value={`${avgTimePerQuestion}`} suffix="초" emoji="⚡" tint="#c8b4ff" />
      </div>

      <div
        className="rounded-3xl p-5 bubble-shadow"
        style={{
          background: "linear-gradient(135deg, rgba(46,40,73,0.9), rgba(37,32,58,0.9))",
          border: "1px solid rgba(200,180,255,0.22)",
        }}
      >
        <h2 className="font-display font-bold text-lavender mb-3">📜 전투 일지</h2>
        {stats.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">
            <span className="block text-3xl mb-2">🌱</span>
            아직 기록이 없어요. 오늘부터 시작해요!
          </p>
        ) : (
          <div className="space-y-1">
            {[...stats].reverse().map((s) => {
              const acc = s.questions_solved > 0 ? Math.round((s.correct_count / s.questions_solved) * 100) : 0;
              return (
                <div
                  key={s.study_date}
                  className="flex justify-between items-center py-2.5 px-3 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  <span className="text-sm font-display font-semibold">{s.study_date}</span>
                  <div className="flex gap-3 text-xs">
                    <span className="text-mint font-bold">{s.questions_solved}문제</span>
                    <span className={acc >= 70 ? "text-mint" : "text-rose"} style={{ fontWeight: 700 }}>
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
  emoji,
  tint,
}: {
  label: string;
  value: string;
  suffix: string;
  emoji: string;
  tint: string;
}) {
  return (
    <div
      className="rounded-3xl p-4 text-center bubble-shadow"
      style={{
        background: `linear-gradient(135deg, ${tint}15, transparent)`,
        border: `1px solid ${tint}40`,
      }}
    >
      <div className="text-2xl mb-1">{emoji}</div>
      <p className="text-2xl font-display font-black leading-none" style={{ color: tint }}>
        {value}
        <span className="text-sm font-semibold opacity-70 ml-0.5">{suffix}</span>
      </p>
      <p className="text-[11px] text-muted font-semibold mt-1">{label}</p>
    </div>
  );
}
