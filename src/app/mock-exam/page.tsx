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
        <p className="text-[10px] font-display text-neon-cyan tracking-[0.3em] neon-glow-cyan">FINAL BOSS</p>
        <h1 className="text-xl font-display font-black text-neon-pink neon-glow-pink animate-flicker">&gt; BOSS ROOM</h1>
        <p className="text-[10px] text-muted mt-1 font-retro tracking-wider">실전 시뮬레이션에 도전하라</p>
      </div>

      <div
        className="p-5 mb-4"
        style={{
          background: "rgba(18, 7, 38, 0.9)",
          border: "1.5px solid rgba(168, 85, 255, 0.5)",
          boxShadow: "0 0 24px rgba(168, 85, 255, 0.25)",
        }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="text-3xl animate-flicker" style={{ filter: "drop-shadow(0 0 8px #a855ff)" }}>👑</div>
          <div className="flex-1">
            <p className="font-display font-black text-sm tracking-widest text-accent-fg" style={{ textShadow: "0 0 8px rgba(168,85,255,0.6)" }}>
              SAA-C03 MINI BOSS
            </p>
            <p className="text-[10px] text-muted mt-0.5 font-retro tracking-wider">10 QUESTIONS · 15 MIN</p>
          </div>
        </div>

        <div className="space-y-1 text-[11px] text-muted font-retro tracking-wider mb-5">
          <p>&gt; CLEAR SCORE: 720 / 1000</p>
          <p>&gt; SAA-C03 출제 비중 반영</p>
          <p>&gt; SECURITY 30% · RESILIENCE 26% · PERF 24% · COST 20%</p>
        </div>

        <Link
          href="/mock-exam/start"
          className="block w-full text-center py-3.5 font-display font-bold tracking-widest active:scale-[0.97] transition-all"
          style={{
            background: "linear-gradient(135deg, #ff2e88 0%, #a855ff 100%)",
            color: "#0a0514",
            boxShadow: "0 0 24px rgba(255, 46, 136, 0.6)",
          }}
        >
          &gt; ENGAGE BOSS!
        </Link>
      </div>

      <div
        className="p-5"
        style={{
          background: "rgba(18, 7, 38, 0.9)",
          border: "1.5px solid rgba(0, 240, 255, 0.35)",
          boxShadow: "0 0 14px rgba(0, 240, 255, 0.1)",
        }}
      >
        <h2 className="font-display text-sm text-neon-cyan tracking-widest neon-glow-cyan mb-3">&gt; BATTLE LOG</h2>
        {results.length === 0 ? (
          <p className="text-xs font-display tracking-widest text-muted text-center py-6">
            &gt; NO BATTLES FOUND
          </p>
        ) : (
          <div className="space-y-2">
            {results.map((exam) => {
              const date = new Date(exam.finished_at);
              const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
              return (
                <div
                  key={exam.id}
                  className="flex items-center justify-between py-2.5 px-3"
                  style={{
                    background: exam.passed
                      ? "rgba(180, 255, 57, 0.06)"
                      : "rgba(255, 46, 136, 0.06)",
                    border: `1px solid ${exam.passed ? "rgba(180, 255, 57, 0.3)" : "rgba(255, 46, 136, 0.3)"}`,
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-[9px] px-2 py-0.5 font-display tracking-widest"
                        style={
                          exam.passed
                            ? {
                                background: "#b4ff39",
                                color: "#0a0514",
                              }
                            : {
                                background: "rgba(255, 46, 136, 0.2)",
                                color: "#ff7ab0",
                                border: "1px solid rgba(255, 46, 136, 0.5)",
                              }
                        }
                      >
                        {exam.passed ? "★ VICTORY" : "× DEFEAT"}
                      </span>
                      <span className="text-sm font-display font-bold">{exam.score}</span>
                    </div>
                    <p className="text-[10px] text-muted font-retro tracking-wider">
                      {dateStr} · {exam.correct_count}/{exam.total_questions} HIT
                    </p>
                  </div>
                  <div className="text-right">
                    {Object.entries(exam.domain_scores).map(([domain, s]) => (
                      <p key={domain} className="text-[9px] text-muted font-retro">
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
