"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getDailyStats } from "@/lib/store";

const STUDY_START = new Date("2026-04-08");

const CURRICULUM = [
  { day: 1, title: "컴퓨팅 & 스토리지", desc: "EC2, Lambda, S3, EBS, EFS 핵심 개념", type: "concept", target: 10 },
  { day: 2, title: "데이터베이스 & 네트워킹", desc: "RDS, DynamoDB, VPC, CloudFront, Route 53", type: "concept", target: 10 },
  { day: 3, title: "보안 & 관리", desc: "IAM, KMS, CloudWatch, Organizations", type: "concept", target: 10 },
  { day: 4, title: "사고력 훈련 Day 1", desc: "시나리오 문제 + 풀이 과정 학습", type: "practice", target: 20 },
  { day: 5, title: "사고력 훈련 Day 2", desc: "보안/네트워크 중심 문제 풀이", type: "practice", target: 25 },
  { day: 6, title: "사고력 훈련 Day 3", desc: "스토리지/DB 중심 문제 풀이", type: "practice", target: 25 },
  { day: 7, title: "사고력 훈련 Day 4", desc: "비용 최적화 + 종합 문제 풀이", type: "practice", target: 30 },
  { day: 8, title: "실전 문제 Day 1", desc: "덤프 문제 집중 풀이", type: "drill", target: 40 },
  { day: 9, title: "실전 문제 Day 2", desc: "오답 복습 + 새 문제 풀이", type: "drill", target: 40 },
  { day: 10, title: "실전 문제 Day 3", desc: "약점 도메인 집중 공략", type: "drill", target: 45 },
  { day: 11, title: "실전 문제 Day 4", desc: "시간 관리 연습 + 문제 풀이", type: "drill", target: 45 },
  { day: 12, title: "실전 문제 Day 5", desc: "전 범위 랜덤 문제 풀이", type: "drill", target: 50 },
  { day: 13, title: "모의시험 1회", desc: "65문제 / 130분 실전 시뮬레이션", type: "exam", target: 65 },
  { day: 14, title: "모의시험 2회 + 최종 보강", desc: "모의시험 + 오답 총복습", type: "exam", target: 65 },
];

function getCurrentDay() {
  const now = new Date();
  const diffMs = now.getTime() - STUDY_START.getTime();
  return Math.max(1, Math.min(14, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1));
}

const TYPE_META = {
  concept: { label: "STUDY", color: "#9bbc0f" },
  practice: { label: "TRAIN", color: "#5b9cd8" },
  drill: { label: "DRILL", color: "#c4a4e0" },
  exam: { label: "BOSS", color: "#e86060" },
} as const;

export default function CurriculumPage() {
  const [currentDay] = useState(getCurrentDay());
  const [dailyStats, setDailyStats] = useState<Record<string, number>>({});

  useEffect(() => {
    const stats = getDailyStats();
    const map: Record<string, number> = {};
    stats.forEach((s) => {
      map[s.study_date] = s.questions_solved;
    });
    setDailyStats(map);
  }, []);

  function getDayDate(day: number) {
    const d = new Date(STUDY_START);
    d.setDate(d.getDate() + day - 1);
    return d.toISOString().split("T")[0];
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-6">
      <header className="mb-6">
        <p className="eyebrow">World Map</p>
        <h1 className="page-title">14일 커리큘럼</h1>
        <p className="page-sub">스테이지를 클리어하며 전진해요</p>
      </header>

      {[1, 2].map((week) => (
        <section key={week} className="mb-6">
          <div className="flex items-center gap-2.5 mb-3">
            <span
              className="pixel-badge"
              style={{
                background: week === 1 ? "var(--gb-green)" : "var(--gold)",
                color: "var(--gb-dark)",
                borderColor: "var(--gb-dark)",
              }}
            >
              WORLD {week}
            </span>
            <span className="body-sub">
              {week === 1 ? "기초 + 훈련" : "실전 + 보스"}
            </span>
          </div>
          <div className="space-y-2.5">
            {CURRICULUM.filter((c) => (week === 1 ? c.day <= 7 : c.day > 7)).map((item) => {
              const dateStr = getDayDate(item.day);
              const solved = dailyStats[dateStr] || 0;
              const isToday = item.day === currentDay;
              const isPast = item.day < currentDay;
              const isDone = solved >= item.target;
              const meta = TYPE_META[item.type as keyof typeof TYPE_META];
              const pct = Math.min(100, (solved / item.target) * 100);

              return (
                <Link
                  key={item.day}
                  href={item.type === "exam" ? "/mock-exam" : "/questions"}
                  className="block p-3.5 pixel-panel transition-transform active:translate-x-[1px] active:translate-y-[1px]"
                  style={{
                    borderColor: isToday ? "var(--gold)" : "var(--border)",
                    background: isToday ? "rgba(232, 185, 35, 0.08)" : "var(--card)",
                    opacity: isPast && !isToday ? 0.6 : 1,
                    boxShadow: isToday ? "2px 2px 0 var(--gold)" : "2px 2px 0 rgba(0,0,0,0.35)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex-shrink-0 w-11 h-11 flex items-center justify-center"
                      style={{
                        background: isDone ? "var(--gb-green)" : meta.color,
                        color: "var(--gb-dark)",
                        border: "2px solid var(--gb-dark)",
                        boxShadow: "2px 2px 0 var(--gb-dark)",
                        fontFamily: "var(--font-pixel)",
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      {isDone ? "✓" : item.day.toString().padStart(2, "0")}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span
                          className="pixel-badge"
                          style={{
                            background: `${meta.color}22`,
                            color: meta.color,
                            borderColor: meta.color,
                            padding: "2px 6px",
                            fontSize: 8,
                          }}
                        >
                          {meta.label}
                        </span>
                        <span className="section-title">{item.title}</span>
                        {isToday && (
                          <span
                            className="pixel-badge animate-blink"
                            style={{
                              background: "var(--gold)",
                              color: "var(--gb-dark)",
                              borderColor: "var(--gb-dark)",
                              padding: "2px 6px",
                              fontSize: 8,
                            }}
                          >
                            ★ NOW
                          </span>
                        )}
                      </div>
                      <p className="body-sub leading-snug">{item.desc}</p>

                      <div className="flex items-center gap-2 mt-2.5">
                        <div
                          className="flex-1 h-1.5"
                          style={{ background: "var(--gb-dark)", border: "1.5px solid var(--border)" }}
                        >
                          <div
                            className="h-full transition-[width] duration-300"
                            style={{
                              width: `${pct}%`,
                              background: isDone ? "var(--gb-green)" : meta.color,
                            }}
                          />
                        </div>
                        <span className="pixel-label text-muted">
                          {solved}/{item.target}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
