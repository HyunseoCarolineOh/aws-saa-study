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
        <p className="text-[9px] font-display text-gold mb-1">&gt; FINAL BOSS</p>
        <h1 className="text-sm font-display font-black text-blood">BOSS ROOM</h1>
        <p className="text-xs font-retro text-parchment mt-1">실전 시뮬레이션에 도전하라</p>
      </div>

      <div className="p-4 mb-4 pixel-window" style={{ borderColor: "#e8b923" }}>
        <div className="flex items-start gap-3 mb-4">
          <div className="text-3xl animate-pixel-bounce" style={{ imageRendering: "pixelated" }}>👑</div>
          <div className="flex-1">
            <p className="font-display font-black text-xs text-gold">SAA-C03 MINI BOSS</p>
            <p className="text-xs text-parchment mt-0.5 font-retro">10 QUESTIONS · 15 MIN</p>
          </div>
        </div>

        <div className="space-y-1 text-xs text-parchment font-retro mb-4" style={{ padding: "8px 12px", background: "#0f380f", border: "2px solid var(--border)" }}>
          <p>&gt; CLEAR: 720 / 1000</p>
          <p>&gt; SAA-C03 출제 비중 반영</p>
          <p>&gt; SEC 30% · RES 26% · PERF 24% · COST 20%</p>
        </div>

        <Link
          href="/mock-exam/start"
          className="block w-full text-center py-3 font-display font-bold text-sm pixel-button"
          style={{ letterSpacing: "0.1em" }}
        >
          &gt; ENGAGE!
        </Link>
      </div>

      <div className="pixel-panel p-4">
        <h2 className="font-display text-xs text-mana mb-3 pb-2" style={{ borderBottom: "2px dashed var(--border)" }}>
          ▲ BATTLE LOG
        </h2>
        {results.length === 0 ? (
          <p className="text-xs font-display text-muted text-center py-6">&gt; NO BATTLES</p>
        ) : (
          <div className="space-y-2">
            {results.map((exam) => {
              const date = new Date(exam.finished_at);
              const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
              return (
                <div
                  key={exam.id}
                  className="flex items-center justify-between py-2 px-2"
                  style={{
                    background: exam.passed ? "rgba(155, 188, 15, 0.08)" : "rgba(184, 50, 50, 0.08)",
                    border: `2px solid ${exam.passed ? "#9bbc0f" : "#b83232"}`,
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-[9px] px-1.5 py-0.5 font-display"
                        style={
                          exam.passed
                            ? { background: "#9bbc0f", color: "#0f380f", border: "1px solid #0f380f" }
                            : { background: "#b83232", color: "#e6d3a3", border: "1px solid #1a1410" }
                        }
                      >
                        {exam.passed ? "★ WIN" : "× LOSE"}
                      </span>
                      <span className="text-sm font-display font-bold text-parchment">{exam.score}</span>
                    </div>
                    <p className="text-[10px] text-muted font-retro">
                      {dateStr} · {exam.correct_count}/{exam.total_questions}
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
