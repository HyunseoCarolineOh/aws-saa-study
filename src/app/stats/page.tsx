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
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <div className="mb-5">
        <p className="text-xs text-muted font-bold tracking-wide">STATUS</p>
        <h1 className="text-2xl font-black text-jelly-pink">나의 스탯 ✨</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard label="클리어" value={`${totalQuestions}`} suffix="문제" emoji="⚔️" grad="linear-gradient(135deg, #ff6b9d, #c86fff)" />
        <StatCard
          label="명중률"
          value={`${accuracy}`}
          suffix="%"
          emoji={accuracy >= 70 ? "🎯" : "💥"}
          grad={accuracy >= 70 ? "linear-gradient(135deg, #7bff9a, #4adede)" : "linear-gradient(135deg, #ff4d8f, #c86fff)"}
        />
        <StatCard label="스트릭" value={`${streak}`} suffix="일" emoji="🔥" grad="linear-gradient(135deg, #ffe156, #ffa040)" />
        <StatCard label="평균 속도" value={`${avgTimePerQuestion}`} suffix="초" emoji="⚡" grad="linear-gradient(135deg, #4adede, #7b61ff)" />
      </div>

      <div className="jelly-card p-5">
        <h2 className="font-black text-base text-jelly-purple mb-3">📜 기록 로그</h2>
        {stats.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">
            <span className="block text-3xl mb-2">🌱</span>
            아직 기록이 없어요!
          </p>
        ) : (
          <div className="space-y-2">
            {[...stats].reverse().map((s) => {
              const acc = s.questions_solved > 0 ? Math.round((s.correct_count / s.questions_solved) * 100) : 0;
              return (
                <div
                  key={s.study_date}
                  className="flex justify-between items-center py-2.5 px-3 rounded-2xl"
                  style={{ background: "rgba(255, 255, 255, 0.03)" }}
                >
                  <span className="text-sm font-bold">{s.study_date}</span>
                  <div className="flex gap-3 text-xs">
                    <span className="text-jelly-teal font-black">{s.questions_solved}문제</span>
                    <span className={acc >= 70 ? "text-jelly-lime" : "text-jelly-pink"} style={{ fontWeight: 900 }}>
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
  grad,
}: {
  label: string;
  value: string;
  suffix: string;
  emoji: string;
  grad: string;
}) {
  return (
    <div
      className="rounded-[24px] p-4 text-center text-on-primary"
      style={{
        background: grad,
        boxShadow:
          "0 10px 24px -6px rgba(0, 0, 0, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.25), inset 0 -2px 0 rgba(0, 0, 0, 0.12)",
      }}
    >
      <div className="text-2xl mb-1">{emoji}</div>
      <p className="text-2xl font-black leading-none">
        {value}
        <span className="text-sm opacity-90 ml-0.5">{suffix}</span>
      </p>
      <p className="text-[11px] opacity-90 font-bold mt-1">{label}</p>
    </div>
  );
}
