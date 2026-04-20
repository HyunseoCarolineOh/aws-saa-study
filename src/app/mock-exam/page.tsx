"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MockExam } from "@/lib/types";
import { getMockExamResults } from "@/lib/store";

export default function MockExamPage() {
  const [results, setResults] = useState<MockExam[]>([]);

  useEffect(() => {
    setResults(getMockExamResults().sort((a, b) => b.started_at.localeCompare(a.started_at)));
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <div className="mb-5">
        <p className="text-xs text-muted font-bold tracking-wide">FINAL MISSION</p>
        <h1 className="text-2xl font-black text-jelly-pink">보스전 👑</h1>
        <p className="text-xs text-muted mt-1">실전 감각 다지는 미니 시뮬레이션!</p>
      </div>

      <div
        className="rounded-[28px] p-5 mb-4 text-on-primary"
        style={{
          background: "linear-gradient(135deg, #ffe156 0%, #ffa040 50%, #ff6b9d 100%)",
          boxShadow:
            "0 14px 36px -6px rgba(255, 160, 64, 0.45), inset 0 3px 0 rgba(255, 255, 255, 0.3), inset 0 -3px 0 rgba(0, 0, 0, 0.15)",
        }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="text-4xl animate-jelly-bounce">👑</div>
          <div className="flex-1">
            <p className="font-black text-lg">SAA-C03 미니 보스</p>
            <p className="text-xs opacity-95 mt-0.5 font-bold">10문제 · 15분</p>
          </div>
        </div>

        <div className="space-y-1.5 text-xs opacity-95 font-bold mb-5">
          <p>🏆 합격 기준: 720점 이상 (1000점 만점)</p>
          <p>🎯 SAA-C03 출제 비중 반영</p>
          <p>🛡️ 보안 30% · 🧱 복원력 26% · ⚡ 고성능 24% · 💰 비용 20%</p>
        </div>

        <Link
          href="/mock-exam/start"
          className="block w-full text-center py-3.5 rounded-[18px] font-black active:scale-[0.97] active:translate-y-1 transition-all"
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            color: "#ff4d8f",
            boxShadow: "0 6px 18px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
          }}
        >
          ⚔️ 보스전 시작하기!
        </Link>
      </div>

      <div className="jelly-card p-5">
        <h2 className="font-black text-base text-jelly-purple mb-3">📜 배틀 로그</h2>
        {results.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">
            <span className="block text-3xl mb-2">🌙</span>
            아직 도전한 적이 없어요
          </p>
        ) : (
          <div className="space-y-2">
            {results.map((exam) => {
              const date = new Date(exam.finished_at);
              const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
              return (
                <div
                  key={exam.id}
                  className="flex items-center justify-between py-3 px-3 rounded-2xl"
                  style={{
                    background: exam.passed
                      ? "linear-gradient(135deg, rgba(123, 255, 154, 0.1), transparent)"
                      : "linear-gradient(135deg, rgba(255, 77, 143, 0.1), transparent)",
                    border: `1.5px solid ${exam.passed ? "rgba(123, 255, 154, 0.35)" : "rgba(255, 77, 143, 0.35)"}`,
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-black text-on-primary"
                        style={
                          exam.passed
                            ? { background: "linear-gradient(135deg, #7bff9a, #4adede)", color: "#0d0823" }
                            : { background: "linear-gradient(135deg, #ff4d8f, #c86fff)" }
                        }
                      >
                        {exam.passed ? "🏆 승리" : "💥 패배"}
                      </span>
                      <span className="text-sm font-black">{exam.score}점</span>
                    </div>
                    <p className="text-[10px] text-muted font-bold">
                      {dateStr} · {exam.correct_count}/{exam.total_questions} 명중
                    </p>
                  </div>
                  <div className="text-right">
                    {Object.entries(exam.domain_scores).map(([domain, s]) => (
                      <p key={domain} className="text-[9px] text-muted">
                        {domain.replace(" 아키텍처", "")} {s.correct}/{s.total}
                      </p>
                    ))}
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
