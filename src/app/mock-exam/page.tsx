"use client";

import Link from "next/link";

export default function MockExamPage() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="text-xl font-bold mb-4">모의시험</h1>

      <div className="bg-card rounded-xl border border-border p-6 mb-4">
        <h2 className="font-semibold text-lg mb-2">SAA-C03 모의시험</h2>
        <div className="space-y-2 text-sm text-muted mb-6">
          <p>&#x2022; 65문제 / 130분</p>
          <p>&#x2022; 합격 기준: 720점 이상 (1000점 만점)</p>
          <p>&#x2022; 단수 응답(4지선다) + 복수 응답(5지선다) 혼합</p>
          <p>&#x2022; 실제 시험과 동일한 형식</p>
        </div>

        <Link
          href="/mock-exam/start"
          className="block w-full bg-primary text-white text-center py-3 rounded-xl font-medium"
        >
          모의시험 시작
        </Link>
      </div>

      <div className="bg-card rounded-xl border border-border p-4">
        <h2 className="font-semibold mb-3">이전 시험 기록</h2>
        <p className="text-sm text-muted text-center py-4">아직 시험 기록이 없습니다</p>
      </div>
    </div>
  );
}
