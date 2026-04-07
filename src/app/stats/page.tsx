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
  const totalMinutes = stats.reduce((sum, s) => sum + s.study_minutes, 0);
  const avgTimePerQuestion =
    totalQuestions > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.time_spent_seconds, 0) / totalQuestions)
      : 0;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="text-xl font-bold mb-4">학습 통계</h1>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard label="총 풀이 수" value={`${totalQuestions}문제`} color="text-primary" />
        <StatCard label="정답률" value={`${accuracy}%`} color={accuracy >= 70 ? "text-green-600" : "text-red-500"} />
        <StatCard label="연속 학습일" value={`${streak}일`} color="text-purple-600" />
        <StatCard label="평균 풀이 시간" value={`${avgTimePerQuestion}초`} color="text-orange-500" />
      </div>

      {/* 일별 학습 기록 */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h2 className="font-semibold mb-3">일별 학습 기록</h2>
        {stats.length === 0 ? (
          <p className="text-sm text-muted text-center py-4">아직 학습 기록이 없습니다</p>
        ) : (
          <div className="space-y-2">
            {[...stats].reverse().map((s) => (
              <div key={s.study_date} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                <span className="text-sm">{s.study_date}</span>
                <div className="flex gap-4 text-xs text-muted">
                  <span>{s.questions_solved}문제</span>
                  <span>
                    {s.questions_solved > 0
                      ? Math.round((s.correct_count / s.questions_solved) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}
