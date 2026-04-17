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
      <h1 className="text-xl font-bold mb-4">미니 모의고사</h1>

      <div className="bg-card rounded-xl border border-border p-6 mb-4">
        <h2 className="font-semibold text-lg mb-2">SAA-C03 미니 모의고사</h2>
        <div className="space-y-2 text-sm text-muted mb-6">
          <p>&#x2022; 10문제 / 15분</p>
          <p>&#x2022; 합격 기준: 720점 이상 (1000점 만점)</p>
          <p>&#x2022; SAA-C03 실제 출제 비중에 따라 도메인별 선별</p>
          <p>&#x2022; 보안 30% · 복원력 26% · 고성능 24% · 비용 20%</p>
        </div>

        <Link
          href="/mock-exam/start"
          className="block w-full bg-primary text-white text-center py-3 rounded-xl font-medium"
        >
          모의고사 시작
        </Link>
      </div>

      <div className="bg-card rounded-xl border border-border p-4">
        <h2 className="font-semibold mb-3">이전 시험 기록</h2>
        {results.length === 0 ? (
          <p className="text-sm text-muted text-center py-4">아직 시험 기록이 없습니다</p>
        ) : (
          <div className="space-y-3">
            {results.map((exam) => {
              const date = new Date(exam.finished_at);
              const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
              return (
                <div key={exam.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${exam.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {exam.passed ? "합격" : "불합격"}
                      </span>
                      <span className="text-sm font-bold">{exam.score}점</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">{dateStr} · 정답 {exam.correct_count}/{exam.total_questions}</p>
                  </div>
                  <div className="text-right">
                    {Object.entries(exam.domain_scores).map(([domain, s]) => (
                      <p key={domain} className="text-[10px] text-muted">
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
