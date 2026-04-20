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
        <p className="text-xs text-muted font-semibold tracking-wider">BOSS BATTLE</p>
        <h1 className="text-2xl font-display font-black text-rose">보스전 👑</h1>
        <p className="text-xs text-muted mt-1">실전 감각 다지는 미니 시뮬레이션</p>
      </div>

      <div
        className="rounded-3xl p-5 mb-4 bubble-shadow"
        style={{
          background: "linear-gradient(135deg, rgba(255,226,122,0.12), rgba(255,180,198,0.12))",
          border: "1.5px solid rgba(255,226,122,0.4)",
        }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="text-3xl animate-bounce-soft">👑</div>
          <div className="flex-1">
            <p className="font-display font-black text-foreground">SAA-C03 미니 보스</p>
            <p className="text-xs text-muted mt-0.5">10문제 · 15분</p>
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-muted mb-5">
          <p>🏆 합격 기준: 720점 이상 (1000점 만점)</p>
          <p>🎯 SAA-C03 출제 비중 반영</p>
          <p>🛡️ 보안 30% · 🧱 복원력 26% · ⚡ 고성능 24% · 💰 비용 20%</p>
        </div>

        <Link
          href="/mock-exam/start"
          className="block w-full text-center py-3.5 rounded-3xl font-display font-bold text-on-primary active:scale-[0.97] transition-all"
          style={{
            background: "linear-gradient(135deg, #ffb4c6, #c8b4ff)",
            boxShadow: "0 8px 24px rgba(255,180,198,0.4)",
          }}
        >
          ⚔️ 보스전 시작하기
        </Link>
      </div>

      <div
        className="rounded-3xl p-5 bubble-shadow"
        style={{
          background: "linear-gradient(135deg, rgba(46,40,73,0.9), rgba(37,32,58,0.9))",
          border: "1px solid rgba(200,180,255,0.22)",
        }}
      >
        <h2 className="font-display font-bold text-lavender mb-3">📜 배틀 로그</h2>
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
                      ? "linear-gradient(135deg, rgba(180,242,225,0.08), transparent)"
                      : "linear-gradient(135deg, rgba(255,159,181,0.08), transparent)",
                    border: `1px solid ${exam.passed ? "rgba(180,242,225,0.25)" : "rgba(255,159,181,0.25)"}`,
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-display font-black"
                        style={
                          exam.passed
                            ? {
                                background: "linear-gradient(135deg, #b4f2e1, #a8dcff)",
                                color: "#1a2e26",
                              }
                            : {
                                background: "rgba(255,159,181,0.25)",
                                color: "var(--danger-fg)",
                                border: "1px solid rgba(255,159,181,0.45)",
                              }
                        }
                      >
                        {exam.passed ? "🏆 VICTORY" : "💥 DEFEAT"}
                      </span>
                      <span className="text-sm font-display font-bold">{exam.score}점</span>
                    </div>
                    <p className="text-[10px] text-muted">
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
