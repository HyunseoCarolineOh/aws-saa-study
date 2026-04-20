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
      <header className="mb-6">
        <p className="eyebrow">Final Boss</p>
        <h1 className="page-title">모의고사</h1>
        <p className="page-sub">SAA-C03 출제 비중 반영한 미니 시뮬레이션</p>
      </header>

      {/* 보스 카드 — 유일한 pixel-window */}
      <section className="pixel-window p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-4xl leading-none animate-pixel-bounce" aria-hidden>
            👑
          </div>
          <div className="flex-1 min-w-0">
            <p className="pixel-label text-gold">SAA-C03 MINI BOSS</p>
            <p className="section-title mt-1.5">미니 보스전</p>
            <p className="caption mt-0.5">10문제 · 15분 · 합격 720점</p>
          </div>
        </div>

        <ul
          className="space-y-1.5 px-3 py-2.5 mb-4"
          style={{ background: "var(--gb-dark)", border: "2px solid var(--border)" }}
        >
          <li className="body-sub flex items-baseline gap-2">
            <span className="pixel-label text-gold flex-shrink-0">▸</span>
            <span>실제 출제 비중 반영 선별</span>
          </li>
          <li className="body-sub flex items-baseline gap-2">
            <span className="pixel-label text-mana flex-shrink-0">▸</span>
            <span>보안 30% · 복원력 26% · 고성능 24% · 비용 20%</span>
          </li>
          <li className="body-sub flex items-baseline gap-2">
            <span className="pixel-label text-gb-green flex-shrink-0">▸</span>
            <span>도메인별 정답률 분석 제공</span>
          </li>
        </ul>

        <Link
          href="/mock-exam/start"
          className="pixel-btn pixel-btn-primary w-full py-3.5 text-base"
        >
          ⚔️ 보스전 시작
        </Link>
      </section>

      {/* 배틀 로그 */}
      <section className="pixel-panel p-4">
        <div
          className="flex items-center justify-between mb-3 pb-2.5"
          style={{ borderBottom: "2px dashed var(--border)" }}
        >
          <h2 className="section-title text-mana">▲ 배틀 로그</h2>
          <span className="section-tag">HISTORY</span>
        </div>
        {results.length === 0 ? (
          <div className="text-center py-8">
            <p className="pixel-label text-muted mb-2">&gt; NO BATTLES</p>
            <p className="body-sub">아직 도전한 기록이 없어요</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {results.map((exam) => {
              const date = new Date(exam.finished_at);
              const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
              return (
                <li
                  key={exam.id}
                  className="flex items-center justify-between p-3"
                  style={{
                    background: exam.passed ? "rgba(155, 188, 15, 0.08)" : "rgba(184, 50, 50, 0.08)",
                    border: `2px solid ${exam.passed ? "var(--gb-green)" : "var(--blood)"}`,
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="pixel-badge"
                        style={
                          exam.passed
                            ? {
                                background: "var(--gb-green)",
                                color: "var(--gb-dark)",
                                borderColor: "var(--gb-dark)",
                              }
                            : {
                                background: "var(--blood)",
                                color: "var(--parchment)",
                                borderColor: "var(--gb-dark)",
                              }
                        }
                      >
                        {exam.passed ? "★ WIN" : "× LOSE"}
                      </span>
                      <span className="stat-value-md text-parchment">{exam.score}</span>
                    </div>
                    <p className="caption">
                      {dateStr} · {exam.correct_count}/{exam.total_questions} 정답
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 pl-2">
                    {Object.entries(exam.domain_scores).map(([domain, s]) => (
                      <p key={domain} className="caption">
                        {domain.replace(" 아키텍처", "")} {s.correct}/{s.total}
                      </p>
                    ))}
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
