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

  function getTypeColor(type: string) {
    switch (type) {
      case "concept": return "bg-blue-500";
      case "practice": return "bg-indigo-500";
      case "drill": return "bg-purple-500";
      case "exam": return "bg-red-500";
      default: return "bg-gray-500";
    }
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case "concept": return "개념";
      case "practice": return "훈련";
      case "drill": return "실전";
      case "exam": return "시험";
      default: return "";
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
      <h1 className="text-xl font-bold mb-1">2주 커리큘럼</h1>
      <p className="text-sm text-muted mb-4">블로그 학습 전략 기반 체계적 일정</p>

      {/* 주차 구분 */}
      {[1, 2].map((week) => (
        <div key={week} className="mb-6">
          <h2 className="text-sm font-bold text-muted uppercase mb-3">
            {week}주차 {week === 1 ? "(개념 + 사고력)" : "(실전 + 모의시험)"}
          </h2>
          <div className="space-y-2">
            {CURRICULUM.filter((c) => (week === 1 ? c.day <= 7 : c.day > 7)).map((item) => {
              const dateStr = getDayDate(item.day);
              const solved = dailyStats[dateStr] || 0;
              const isToday = item.day === currentDay;
              const isPast = item.day < currentDay;
              const isDone = solved >= item.target;

              return (
                <Link
                  key={item.day}
                  href={item.type === "exam" ? "/mock-exam" : "/questions"}
                  className={`block bg-card rounded-xl border p-4 transition-all ${
                    isToday ? "border-primary shadow-md" : "border-border"
                  } ${isPast && !isToday ? "opacity-70" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Day 번호 */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      isDone ? "bg-success" : isPast ? "bg-muted" : getTypeColor(item.type)
                    }`}>
                      {isDone ? "\u2713" : item.day}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm">{item.title}</span>
                        {isToday && <span className="text-[10px] bg-primary text-on-primary px-1.5 py-0.5 rounded">TODAY</span>}
                      </div>
                      <p className="text-xs text-muted">{item.desc}</p>

                      {/* 진도 바 */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-border rounded-full h-1.5">
                          <div
                            className={`rounded-full h-1.5 ${isDone ? "bg-success" : "bg-primary"}`}
                            style={{ width: `${Math.min(100, (solved / item.target) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted">{solved}/{item.target}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${getTypeColor(item.type)} text-white`}>
                          {getTypeLabel(item.type)}
                        </span>
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
