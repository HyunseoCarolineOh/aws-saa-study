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
        <p className="text-[9px] font-display text-gold mb-1">&gt; STATUS SCREEN</p>
        <h1 className="text-sm font-display font-black text-gb-green">PARAMETERS</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard label="SOLVED" value={`${totalQuestions}`} suffix="Q" color="#9bbc0f" />
        <StatCard label="HIT" value={`${accuracy}`} suffix="%" color={accuracy >= 70 ? "#9bbc0f" : "#b83232"} />
        <StatCard label="STREAK" value={`${streak}`} suffix="D" color="#e8b923" />
        <StatCard label="SPEED" value={`${avgTimePerQuestion}`} suffix="S" color="#8fc0e8" />
      </div>

      <div className="pixel-panel p-4">
        <h2 className="font-display text-xs text-gold mb-3 pb-2" style={{ borderBottom: "2px dashed var(--border)" }}>
          ★ BATTLE LOG
        </h2>
        {stats.length === 0 ? (
          <p className="text-xs font-display text-muted text-center py-6">
            &gt; NO DATA<br />
            <span className="text-[10px] font-retro">모험을 시작하세요</span>
          </p>
        ) : (
          <div className="space-y-1">
            {[...stats].reverse().map((s) => {
              const acc = s.questions_solved > 0 ? Math.round((s.correct_count / s.questions_solved) * 100) : 0;
              return (
                <div
                  key={s.study_date}
                  className="flex justify-between items-center py-2 px-2"
                  style={{ background: "rgba(0, 0, 0, 0.2)", border: "1px solid var(--border)" }}
                >
                  <span className="text-xs font-retro text-parchment">{s.study_date}</span>
                  <div className="flex gap-3 text-xs font-display">
                    <span className="text-mana">{s.questions_solved}Q</span>
                    <span style={{ color: acc >= 70 ? "#9bbc0f" : "#b83232" }}>{acc}%</span>
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

function StatCard({ label, value, suffix, color }: { label: string; value: string; suffix: string; color: string }) {
  return (
    <div
      className="p-3 text-center pixel-panel"
      style={{ borderColor: color }}
    >
      <p className="text-2xl font-display font-black leading-none" style={{ color }}>
        {value}
        <span className="text-sm opacity-80 ml-0.5">{suffix}</span>
      </p>
      <p className="text-[9px] font-display text-muted mt-1">{label}</p>
    </div>
  );
}
