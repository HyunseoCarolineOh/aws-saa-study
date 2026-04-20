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
  concept: { label: "CONCEPT", color: "#b4ff39" },
  practice: { label: "TRAIN", color: "#00f0ff" },
  drill: { label: "DRILL", color: "#ff2e88" },
  exam: { label: "BOSS", color: "#a855ff" },
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
        <p className="text-[10px] font-display text-neon-cyan tracking-[0.3em] neon-glow-cyan">QUEST MAP</p>
        <h1 className="text-xl font-display font-black text-neon-pink neon-glow-pink animate-flicker">&gt; STAGE SELECT</h1>
        <p className="text-[10px] text-muted mt-1 font-retro tracking-wider">클리어할 스테이지를 선택하라</p>
      </div>

      {[1, 2].map((week) => (
        <div key={week} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-[10px] font-display tracking-widest px-2.5 py-1"
              style={{
                background: week === 1 ? "rgba(180, 255, 57, 0.12)" : "rgba(255, 238, 0, 0.12)",
                color: week === 1 ? "#b4ff39" : "#ffee00",
                border: `1px solid ${week === 1 ? "rgba(180, 255, 57, 0.45)" : "rgba(255, 238, 0, 0.45)"}`,
              }}
            >
              WORLD {week}
            </span>
            <span className="text-[10px] text-muted font-retro tracking-wider">
              {week === 1 ? "BASICS + TRAINING" : "DRILL + FINAL BOSS"}
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
                  className="block p-4 transition-all active:scale-[0.99]"
                  style={{
                    background: isToday
                      ? "rgba(255, 46, 136, 0.1)"
                      : "rgba(18, 7, 38, 0.85)",
                    border: isToday
                      ? `1.5px solid rgba(255, 46, 136, 0.6)`
                      : `1px solid ${meta.color}33`,
                    opacity: isPast && !isToday ? 0.55 : 1,
                    boxShadow: isToday
                      ? "0 0 20px rgba(255, 46, 136, 0.35)"
                      : `inset 0 0 14px ${meta.color}11`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-sm font-display font-black"
                      style={{
                        background: isDone ? "#b4ff39" : `${meta.color}20`,
                        border: `1.5px solid ${isDone ? "#b4ff39" : meta.color}`,
                        color: isDone ? "#0a0514" : meta.color,
                        textShadow: isDone ? "none" : `0 0 6px ${meta.color}`,
                      }}
                    >
                      {isDone ? "✓" : item.day.toString().padStart(2, "0")}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span
                          className="text-[9px] font-display tracking-widest px-1.5 py-0.5"
                          style={{
                            background: `${meta.color}22`,
                            color: meta.color,
                            border: `1px solid ${meta.color}55`,
                          }}
                        >
                          {meta.label}
                        </span>
                        <span className="font-display font-bold text-sm">{item.title}</span>
                        {isToday && (
                          <span
                            className="text-[9px] font-display tracking-widest px-1.5 py-0.5 animate-flicker"
                            style={{
                              background: "#ff2e88",
                              color: "#0a0514",
                            }}
                          >
                            NOW
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted leading-snug font-retro">{item.desc}</p>

                      <div className="flex items-center gap-2 mt-2.5">
                        <div className="flex-1 h-1.5 overflow-hidden" style={{ background: "rgba(0, 0, 0, 0.6)", border: "1px solid rgba(58, 29, 95, 0.5)" }}>
                          <div
                            className="h-full transition-[width] duration-500"
                            style={{
                              width: `${pct}%`,
                              background: isDone
                                ? "linear-gradient(90deg, #b4ff39, #00f0ff)"
                                : `linear-gradient(90deg, ${meta.color}, ${meta.color}aa)`,
                              boxShadow: `0 0 6px ${isDone ? "#b4ff39" : meta.color}aa`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-muted font-display">{solved}/{item.target}</span>
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
