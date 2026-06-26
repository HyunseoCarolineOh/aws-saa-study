"use client";

import { EXAM_CONFIGS } from "@/lib/examConfig";
import { useExam } from "@/contexts/ExamContext";
import type { ExamType } from "@/lib/types";

interface Props {
  mode: "initial" | "switch";
  onSelect?: () => void;
}

export default function ExamSelector({ mode, onSelect }: Props) {
  const { setExam, currentExam } = useExam();

  function handleSelect(exam: ExamType) {
    setExam(exam);
    onSelect?.();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
      {mode === "initial" && (
        <div className="text-center mb-2">
          <h2 className="text-xl font-bold text-white mb-1">시험 선택</h2>
          <p className="text-sm text-gray-400">공부할 AWS 시험을 선택하세요</p>
        </div>
      )}
      {mode === "switch" && (
        <div className="text-center mb-2">
          <h2 className="text-base font-semibold text-white mb-1">시험 전환</h2>
        </div>
      )}
      <div className="flex gap-4 w-full max-w-sm">
        {(["SAA-C03", "CLF-C02"] as ExamType[]).map((examType) => {
          const cfg = EXAM_CONFIGS[examType];
          const isActive = currentExam === examType;
          return (
            <button
              key={examType}
              onClick={() => handleSelect(examType)}
              className={`flex-1 rounded-2xl p-5 text-left transition-all border-2 ${
                isActive
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-gray-700 bg-gray-800/50 hover:border-gray-500"
              }`}
            >
              <div className="text-xs font-mono text-gray-400 mb-1">{cfg.shortLabel}</div>
              <div className="text-sm font-semibold text-white leading-tight">
                {cfg.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
