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
  concept: { emoji: "🌱", label: "개념", tint: "#b4f2e1" },
  practice: { emoji: "🧩", label: "훈련", tint: "#c8b4ff" },
  drill: { emoji: "⚔️", label: "실전", tint: "#ffb4c6" },
  exam: { emoji: "👑", label: "보스", tint: "#ffe27a" },
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
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
      <div className="mb-5">
        <p className="text-xs text-muted font-semibold tracking-wider">QUEST MAP</p>
        <h1 className="text-2xl font-display font-black text-rose">14일 모험 지도 🗺️</h1>
        <p className="text-xs text-muted mt-1">매일 하나씩 깨면서 전진!</p>
      </div>

      {[1, 2].map((week) => (
        <div key={week} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-xs font-display font-bold px-3 py-1 rounded-full"
              style={{
                background: week === 1 ? "rgba(180,242,225,0.15)" : "rgba(255,226,122,0.15)",
                color: week === 1 ? "var(--pastel-mint)" : "var(--pastel-lemon)",
                border: `1px solid ${week === 1 ? "rgba(180,242,225,0.4)" : "rgba(255,226,122,0.4)"}`,
              }}
            >
              Chapter {week}
            </span>
            <span className="text-xs text-muted font-semibold">
              {week === 1 ? "기초 + 사고력" : "실전 + 보스전"}
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
                  className={`block rounded-3xl p-4 transition-all active:scale-[0.99] ${isToday ? "animate-pulse-glow" : ""}`}
                  style={{
                    background: isToday
                      ? "linear-gradient(135deg, rgba(255,180,198,0.18), rgba(200,180,255,0.12))"
                      : "rgba(37,32,58,0.6)",
                    border: isToday
                      ? "1.5px solid rgba(255,180,198,0.55)"
                      : "1px solid var(--border)",
                    opacity: isPast && !isToday ? 0.65 : 1,
                    boxShadow: isToday ? "0 8px 24px rgba(255,180,198,0.2)" : undefined,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-display font-black"
                      style={{
                        background: isDone
                          ? "linear-gradient(135deg, #b4f2e1, #a8dcff)"
                          : `linear-gradient(135deg, ${meta.tint}40, ${meta.tint}20)`,
                        border: `1.5px solid ${isDone ? "rgba(180,242,225,0.6)" : `${meta.tint}66`}`,
                        color: isDone ? "#1a2e26" : meta.tint,
                      }}
                    >
                      {isDone ? "✓" : item.day}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-xs">{meta.emoji}</span>
                        <span className="font-display font-bold text-sm">{item.title}</span>
                        {isToday && (
                          <span
                            className="text-[9px] px-2 py-0.5 rounded-full font-display font-black animate-bounce-soft"
                            style={{
                              background: "linear-gradient(135deg, #ffb4c6, #c8b4ff)",
                              color: "#2b1a20",
                            }}
                          >
                            NOW PLAYING
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted leading-snug">{item.desc}</p>

                      <div className="flex items-center gap-2 mt-2.5">
                        <div className="flex-1 bg-muted-bg rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-[width] duration-500"
                            style={{
                              width: `${pct}%`,
                              background: isDone
                                ? "linear-gradient(90deg, #b4f2e1, #a8dcff)"
                                : `linear-gradient(90deg, ${meta.tint}, ${meta.tint}aa)`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-muted font-semibold">{solved}/{item.target}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
