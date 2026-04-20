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
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        className="relative w-full max-w-lg animate-slide-up pixel-window"
        style={{ maxHeight: "85vh", borderColor: "var(--blood)", borderBottom: "none" }}
      >
        <div className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: "85vh" }}>
          <div className="flex justify-center">
            <div className="w-12 h-1.5" style={{ background: "var(--blood)" }} />
          </div>

          <h3 className="section-title text-blood">⚠️ 문제 수정 요청</h3>

          {!enabled && (
            <div
              className="p-3 body-sub"
              style={{
                background: "rgba(232, 185, 35, 0.08)",
                border: "2px solid var(--gold)",
                color: "var(--warning-fg)",
              }}
            >
              Supabase 환경변수가 설정되지 않아 신고할 수 없어요
            </div>
          )}

          {isChoiceReport && question.options.length > 0 && (
            <div>
              <label className="block pixel-label text-muted mb-2">어느 선지인가요?</label>
              <div className="flex gap-2">
                {question.options.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setOptionLabel(opt.label)}
                    className="flex-1 py-2.5 transition-transform active:translate-x-[1px] active:translate-y-[1px]"
                    style={
                      optionLabel === opt.label
                        ? {
                            background: "var(--blood)",
                            color: "var(--parchment)",
                            border: "2px solid var(--gb-dark)",
                            boxShadow: "2px 2px 0 var(--gb-dark)",
                            fontFamily: "var(--font-pixel)",
                            fontSize: 13,
                          }
                        : {
                            background: "var(--gb-dark)",
                            color: "var(--muted)",
                            border: "2px solid var(--border)",
                            fontFamily: "var(--font-pixel)",
                            fontSize: 13,
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
            <label className="block pixel-label text-muted mb-2">유형</label>
            <div className="space-y-2">
              {TYPE_ORDER.map((t) => {
                const active = reportType === t;
                return (
                  <label
                    key={t}
                    className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer"
                    style={
                      active
                        ? { background: "rgba(184, 50, 50, 0.1)", border: "2px solid var(--blood)" }
                        : { background: "var(--muted-bg)", border: "2px solid var(--border)" }
                    }
                  >
                    <input
                      type="radio"
                      name="report-type"
                      value={t}
                      checked={active}
                      onChange={() => setReportType(t)}
                      style={{ accentColor: "var(--blood)" }}
                    />
                    <span
                      className="body-text"
                      style={{
                        color: active ? "var(--danger-fg)" : "var(--foreground)",
                        fontWeight: active ? 700 : 500,
                      }}
                    >
                      {CORRECTION_TYPE_LABELS[t]}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block pixel-label text-muted mb-2">추가 설명 (선택)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="어디가 어떻게 잘못됐는지..."
              className="pixel-input"
              rows={3}
            />
          </div>

          {error && (
            <div
              className="p-3 body-sub"
              style={{
                background: "rgba(184, 50, 50, 0.1)",
                border: "2px solid var(--blood)",
                color: "var(--danger-fg)",
              }}
            >
              &gt; 전송 실패: {error}
            </div>
          )}

          <div className="flex gap-3 pb-20">
            <button type="button" onClick={onClose} className="pixel-btn pixel-btn-ghost flex-1 py-3">
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!enabled || submitting}
              className="pixel-btn pixel-btn-danger flex-1 py-3"
            >
              {submitting ? "전송 중..." : "⚠ 신고 보내기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
