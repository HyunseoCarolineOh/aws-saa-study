"use client";

import { useEffect, useState } from "react";
import type { Question } from "@/lib/types";
import {
  CORRECTION_TYPE_LABELS,
  isCorrectionsEnabled,
  submitCorrection,
  type CorrectionType,
} from "@/lib/corrections";

interface Props {
  isOpen: boolean;
  question: Question;
  onClose: () => void;
  onSubmitted: (message: string) => void;
}

const TYPE_ORDER: CorrectionType[] = [
  "translation_needed",
  "wrong_explanation",
  "invalid_choice",
  "wrong_answer",
  "service_type_change",
];

export default function CorrectionReportSheet({
  isOpen,
  question,
  onClose,
  onSubmitted,
}: Props) {
  const [reportType, setReportType] = useState<CorrectionType>(TYPE_ORDER[0]);
  const [optionLabel, setOptionLabel] = useState<string>(question.options[0]?.label ?? "");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReportType(TYPE_ORDER[0]);
      setOptionLabel(question.options[0]?.label ?? "");
      setDescription("");
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen, question.options]);

  if (!isOpen) return null;

  const enabled = isCorrectionsEnabled();
  const isChoiceReport = reportType === "invalid_choice";

  async function handleSave() {
    if (!enabled) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitCorrection({
        question_source: question.source,
        question_id: question.id,
        report_type: reportType,
        scope: isChoiceReport ? "option" : "question",
        option_label: isChoiceReport ? optionLabel : null,
        selected_text: null,
        description: description.trim() || null,
      });
      onSubmitted("수정 요청이 접수되었습니다");
    } catch (e) {
      const message = e instanceof Error ? e.message : "전송 실패";
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div
        className="relative w-full max-w-lg rounded-t-[32px] animate-slide-up"
        style={{
          maxHeight: "85vh",
          background: "linear-gradient(180deg, rgba(26, 18, 56, 0.98), rgba(13, 8, 35, 0.98))",
          border: "1.5px solid rgba(255, 107, 157, 0.4)",
          borderBottom: "none",
          backdropFilter: "blur(18px)",
        }}
      >
        <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: "85vh" }}>
          <div className="flex justify-center">
            <div
              className="w-12 h-1.5 rounded-full"
              style={{ background: "linear-gradient(90deg, #ff6b9d, #c86fff)" }}
            />
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-jelly-pink">⚠️ 수정 요청 보내기</h3>
          </div>

          {!enabled && (
            <div
              className="text-xs rounded-2xl p-3"
              style={{
                background: "linear-gradient(135deg, rgba(255, 225, 86, 0.12), rgba(255, 160, 64, 0.08))",
                border: "1.5px solid rgba(255, 225, 86, 0.4)",
                color: "var(--warning-fg)",
              }}
            >
              Supabase 환경변수가 없어 신고를 보낼 수 없어요.
            </div>
          )}

          {isChoiceReport && question.options.length > 0 && (
            <div>
              <label className="block text-xs text-muted mb-1.5 font-black">어느 선지인가요?</label>
              <div className="flex gap-2">
                {question.options.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setOptionLabel(opt.label)}
                    className="flex-1 py-2.5 rounded-2xl text-sm font-black transition-all active:scale-[0.95]"
                    style={
                      optionLabel === opt.label
                        ? {
                            background: "linear-gradient(135deg, #ff6b9d, #c86fff)",
                            color: "#ffffff",
                            boxShadow: "0 4px 12px rgba(255, 107, 157, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
                          }
                        : {
                            background: "rgba(26, 18, 56, 0.85)",
                            color: "var(--muted)",
                            border: "1px solid var(--border)",
                          }
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-muted mb-1.5 font-black">유형</label>
            <div className="space-y-1.5">
              {TYPE_ORDER.map((t) => {
                const active = reportType === t;
                return (
                  <label
                    key={t}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-2xl cursor-pointer text-sm transition-all"
                    style={
                      active
                        ? {
                            background: "linear-gradient(135deg, rgba(255, 107, 157, 0.14), rgba(200, 111, 255, 0.1))",
                            border: "1.5px solid rgba(255, 107, 157, 0.5)",
                          }
                        : {
                            background: "rgba(26, 18, 56, 0.5)",
                            border: "1.5px solid var(--border)",
                          }
                    }
                  >
                    <input
                      type="radio"
                      name="report-type"
                      value={t}
                      checked={active}
                      onChange={() => setReportType(t)}
                      style={{ accentColor: "var(--jelly-pink)" }}
                    />
                    <span style={{ color: active ? "var(--jelly-pink)" : "var(--foreground)", fontWeight: active ? 900 : 600 }}>
                      {CORRECTION_TYPE_LABELS[t]}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted mb-1.5 font-black">💭 추가 설명 (선택)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="어디가 어떻게 잘못됐는지..."
              className="w-full rounded-2xl px-3 py-2.5 text-sm leading-relaxed resize-none focus:outline-none"
              style={{
                background: "rgba(15, 8, 35, 0.8)",
                border: "1.5px solid var(--border)",
                color: "var(--foreground)",
              }}
              rows={3}
            />
          </div>

          {error && (
            <div
              className="text-xs rounded-2xl p-3"
              style={{
                background: "rgba(255, 77, 143, 0.14)",
                border: "1.5px solid rgba(255, 77, 143, 0.4)",
                color: "var(--danger-fg)",
              }}
            >
              💥 전송 실패: {error}
            </div>
          )}

          <div className="flex gap-2 pb-20">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-[18px] text-sm font-black text-muted"
              style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border)" }}
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!enabled || submitting}
              className="flex-1 py-3 rounded-[18px] text-sm font-black text-on-primary active:scale-[0.97] active:translate-y-1 transition-all disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #ff6b9d, #c86fff)",
                boxShadow: "0 10px 24px -4px rgba(255, 107, 157, 0.45), inset 0 2px 0 rgba(255, 255, 255, 0.3)",
              }}
            >
              {submitting ? "🎀 전송 중..." : "✨ 신고 보내기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
