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
    <div className="max-w-lg mx-auto px-4 pt-6 pb-6">
      <header className="mb-6">
        <p className="eyebrow">Status Screen</p>
        <h1 className="page-title">학습 스탯</h1>
        <p className="page-sub">지금까지 쌓은 경험치</p>
      </header>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="SOLVED" value={totalQuestions} suffix="Q" color="#9bbc0f" />
        <StatCard
          label="ACC"
          value={accuracy}
          suffix="%"
          color={accuracy >= 70 ? "#9bbc0f" : "#b83232"}
        />
        <StatCard label="STREAK" value={streak} suffix="D" color="#e8b923" />
        <StatCard label="SPEED" value={avgTimePerQuestion} suffix="S" color="#5b9cd8" />
      </div>

      <section className="pixel-panel p-4">
        <div
          className="flex items-center justify-between mb-3 pb-2.5"
          style={{ borderBottom: "2px dashed var(--border)" }}
        >
          <h2 className="section-title text-gold">★ 일별 기록</h2>
          <span className="section-tag">LOG</span>
        </div>
        {stats.length === 0 ? (
          <div className="text-center py-8">
            <p className="pixel-label text-muted mb-2">&gt; NO DATA</p>
            <p className="body-sub">첫 문제를 풀면 기록이 쌓여요</p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {[...stats].reverse().map((s) => {
              const acc = s.questions_solved > 0 ? Math.round((s.correct_count / s.questions_solved) * 100) : 0;
              return (
                <li
                  key={s.study_date}
                  className="flex justify-between items-center py-2 px-3"
                  style={{
                    background: "rgba(15, 56, 15, 0.35)",
                    border: "1.5px solid var(--border)",
                  }}
                >
                  <span className="body-text text-parchment">{s.study_date}</span>
                  <div className="flex gap-3 items-center">
                    <span className="stat-value-md text-mana">{s.questions_solved}<span className="pixel-label opacity-70 ml-0.5">Q</span></span>
                    <span
                      className="stat-value-md"
                      style={{ color: acc >= 70 ? "var(--gb-green)" : "var(--blood)" }}
                    >
                      {acc}<span className="pixel-label opacity-70 ml-0.5">%</span>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
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
  value: number | string;
  suffix: string;
  color: string;
}) {
  return (
    <div className="pixel-panel p-4 text-center" style={{ borderColor: color, boxShadow: `2px 2px 0 ${color}44` }}>
      <p className="stat-value-lg" style={{ color, fontSize: 26 }}>
        {value}
        <span className="pixel-label ml-1 opacity-75">{suffix}</span>
      </p>
      <p className="pixel-label text-muted mt-2">{label}</p>
    </div>
  );
}
