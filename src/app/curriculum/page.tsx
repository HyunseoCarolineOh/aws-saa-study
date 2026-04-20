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
  concept: { emoji: "🌱", label: "개념", grad: "linear-gradient(135deg, #7bff9a, #4adede)" },
  practice: { emoji: "💪", label: "훈련", grad: "linear-gradient(135deg, #4adede, #7b61ff)" },
  drill: { emoji: "⚡", label: "실전", grad: "linear-gradient(135deg, #ff6b9d, #c86fff)" },
  exam: { emoji: "👑", label: "보스", grad: "linear-gradient(135deg, #ffe156, #ffa040)" },
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
        <p className="text-xs text-muted font-bold tracking-wide">ADVENTURE MAP</p>
        <h1 className="text-2xl font-black text-jelly-pink">14일 모험 🗺️</h1>
        <p className="text-xs text-muted mt-1">매일 하나씩 깨면서 전진해요!</p>
      </div>

      {[1, 2].map((week) => (
        <div key={week} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-xs font-black px-3 py-1 rounded-full text-on-primary"
              style={{
                background: week === 1 ? "linear-gradient(135deg, #7bff9a, #4adede)" : "linear-gradient(135deg, #ffe156, #ffa040)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
              }}
            >
              Chapter {week}
            </span>
            <span className="text-xs text-muted font-bold">
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
                  className={`block rounded-[24px] p-4 transition-all active:scale-[0.98] ${isToday ? "animate-glow-pulse" : ""}`}
                  style={{
                    background: isToday
                      ? "linear-gradient(135deg, rgba(255, 107, 157, 0.16), rgba(200, 111, 255, 0.12))"
                      : "linear-gradient(145deg, rgba(26, 18, 56, 0.85), rgba(35, 24, 80, 0.85))",
                    border: isToday
                      ? "1.5px solid rgba(255, 107, 157, 0.55)"
                      : "1px solid rgba(255, 255, 255, 0.06)",
                    opacity: isPast && !isToday ? 0.55 : 1,
                    boxShadow: isToday
                      ? "0 10px 28px -4px rgba(255, 107, 157, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)"
                      : "0 6px 16px rgba(0, 0, 0, 0.25)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-[18px] flex items-center justify-center text-lg font-black text-on-primary"
                      style={{
                        background: isDone ? "linear-gradient(135deg, #7bff9a, #4adede)" : meta.grad,
                        boxShadow:
                          "0 6px 14px rgba(0, 0, 0, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.25), inset 0 -2px 0 rgba(0, 0, 0, 0.12)",
                      }}
                    >
                      {isDone ? "✓" : item.day}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-xs">{meta.emoji}</span>
                        <span className="font-black text-sm">{item.title}</span>
                        {isToday && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-black text-on-primary animate-jelly-bounce"
                            style={{
                              background: "linear-gradient(135deg, #ff6b9d, #c86fff)",
                            }}
                          >
                            지금!
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted leading-snug font-semibold">{item.desc}</p>

                      <div className="flex items-center gap-2 mt-2.5">
                        <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: "rgba(15, 8, 35, 0.8)" }}>
                          <div
                            className="h-full rounded-full transition-[width] duration-500"
                            style={{
                              width: `${pct}%`,
                              background: isDone ? "linear-gradient(90deg, #7bff9a, #4adede)" : meta.grad,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-muted font-black">{solved}/{item.target}</span>
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
