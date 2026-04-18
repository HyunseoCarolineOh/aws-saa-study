"use client";

import { useEffect, useState } from "react";
import type { Question } from "@/lib/types";
import {
  CORRECTION_SCOPE_LABELS,
  CORRECTION_TYPE_LABELS,
  isCorrectionsEnabled,
  submitCorrection,
  type CorrectionScope,
  type CorrectionType,
} from "@/lib/corrections";

interface Props {
  isOpen: boolean;
  question: Question;
  scope: CorrectionScope;
  selectedText?: string;
  defaultOptionLabel?: string;
  onClose: () => void;
  onSubmitted: (message: string) => void;
}

const TYPE_ORDER: CorrectionType[] = [
  "translation_needed",
  "wrong_explanation",
  "invalid_choice",
  "wrong_answer",
];

export default function CorrectionReportSheet({
  isOpen,
  question,
  scope,
  selectedText,
  defaultOptionLabel,
  onClose,
  onSubmitted,
}: Props) {
  const [reportType, setReportType] = useState<CorrectionType>(TYPE_ORDER[0]);
  const [optionLabel, setOptionLabel] = useState<string>(defaultOptionLabel ?? question.options[0]?.label ?? "");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReportType(scope === "option" ? "invalid_choice" : TYPE_ORDER[0]);
      setOptionLabel(defaultOptionLabel ?? question.options[0]?.label ?? "");
      setDescription("");
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen, scope, defaultOptionLabel, question.options]);

  if (!isOpen) return null;

  const enabled = isCorrectionsEnabled();

  async function handleSave() {
    if (!enabled) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitCorrection({
        question_source: question.source,
        question_id: question.id,
        report_type: reportType,
        scope,
        option_label: scope === "option" ? optionLabel : null,
        selected_text: selectedText ?? null,
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

      <div className="relative w-full max-w-lg bg-white rounded-t-2xl animate-slide-up" style={{ maxHeight: "85vh" }}>
        <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: "85vh" }}>
          <div className="flex justify-center">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">문제 수정 요청</h3>
            <span className="text-[10px] text-muted bg-gray-100 px-2 py-0.5 rounded">
              {CORRECTION_SCOPE_LABELS[scope]}
            </span>
          </div>

          {!enabled && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs rounded-lg p-2">
              Supabase 환경변수가 설정되지 않아 신고를 보낼 수 없습니다.
            </div>
          )}

          {selectedText && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 px-3 py-2 rounded-r">
              <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">{selectedText}</p>
            </div>
          )}

          {scope === "option" && question.options.length > 0 && (
            <div>
              <label className="block text-xs text-muted mb-1">어느 선지인가요?</label>
              <div className="flex gap-2">
                {question.options.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setOptionLabel(opt.label)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      optionLabel === opt.label
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-gray-600 border-border"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-muted mb-1">유형</label>
            <div className="space-y-1.5">
              {TYPE_ORDER.map((t) => (
                <label
                  key={t}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm ${
                    reportType === t ? "border-primary bg-blue-50" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="report-type"
                    value={t}
                    checked={reportType === t}
                    onChange={() => setReportType(t)}
                    className="accent-primary"
                  />
                  <span>{CORRECTION_TYPE_LABELS[t]}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">추가 설명 (선택)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="어디가 어떻게 잘못됐는지 간단히 적어주세요"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm leading-relaxed resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              rows={3}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-2">
              전송 실패: {error}
            </div>
          )}

          <div className="flex gap-2 pb-20">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!enabled || submitting}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium active:scale-[0.98] transition-transform disabled:opacity-40"
            >
              {submitting ? "전송 중..." : "신고"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
