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
        className="relative w-full max-w-lg animate-slide-up"
        style={{
          maxHeight: "85vh",
          background: "#2a1f17",
          border: "4px solid #b83232",
          borderBottom: "none",
          boxShadow: "inset 0 0 0 2px #1a1410, inset 0 0 0 4px #5a4530",
        }}
      >
        <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: "85vh" }}>
          <div className="flex justify-center">
            <div className="w-10 h-1" style={{ background: "#b83232" }} />
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-xs font-display text-blood">⚠ REPORT BUG</h3>
          </div>

          {!enabled && (
            <div
              className="text-xs p-3 font-retro"
              style={{ background: "rgba(232, 185, 35, 0.08)", border: "2px solid #e8b923", color: "var(--warning-fg)" }}
            >
              &gt; SUPABASE NOT SET
            </div>
          )}

          {isChoiceReport && question.options.length > 0 && (
            <div>
              <label className="block text-[10px] text-muted mb-1.5 font-display">&gt; WHICH OPT?</label>
              <div className="flex gap-2">
                {question.options.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setOptionLabel(opt.label)}
                    className="flex-1 py-2 text-sm font-display font-bold transition-transform active:translate-x-[1px] active:translate-y-[1px]"
                    style={
                      optionLabel === opt.label
                        ? {
                            background: "#b83232",
                            color: "#e6d3a3",
                            border: "2px solid #1a1410",
                            boxShadow: "2px 2px 0 #1a1410",
                          }
                        : {
                            background: "#0f380f",
                            color: "var(--muted)",
                            border: "2px solid var(--border)",
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
            <label className="block text-[10px] text-muted mb-1.5 font-display">&gt; TYPE</label>
            <div className="space-y-1.5">
              {TYPE_ORDER.map((t) => {
                const active = reportType === t;
                return (
                  <label
                    key={t}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer text-sm"
                    style={
                      active
                        ? { background: "rgba(184, 50, 50, 0.1)", border: "2px solid #b83232" }
                        : { background: "#2a1f17", border: "2px solid #5a4530" }
                    }
                  >
                    <input
                      type="radio"
                      name="report-type"
                      value={t}
                      checked={active}
                      onChange={() => setReportType(t)}
                      style={{ accentColor: "#b83232" }}
                    />
                    <span className="font-retro" style={{ color: active ? "#e86060" : "var(--foreground)" }}>
                      {CORRECTION_TYPE_LABELS[t]}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-muted mb-1.5 font-display">&gt; NOTES (OPT)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="어디가 어떻게 잘못됐는지..."
              className="w-full px-3 py-2.5 text-sm leading-relaxed resize-none focus:outline-none font-retro"
              style={{
                background: "#0f380f",
                border: "2px solid var(--border)",
                color: "var(--foreground)",
              }}
              rows={3}
            />
          </div>

          {error && (
            <div
              className="text-xs p-3 font-retro"
              style={{ background: "rgba(184, 50, 50, 0.1)", border: "2px solid #b83232", color: "var(--danger-fg)" }}
            >
              &gt; SEND FAILED: {error}
            </div>
          )}

          <div className="flex gap-2 pb-20">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-display text-muted"
              style={{ background: "#2a1f17", border: "2px solid #5a4530", boxShadow: "2px 2px 0 #5a4530" }}
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!enabled || submitting}
              className="flex-1 py-2.5 text-xs font-display pixel-button disabled:opacity-40"
              style={{
                background: "#b83232",
                color: "#e6d3a3",
                borderColor: "#1a1410",
                boxShadow: "2px 2px 0 #1a1410",
              }}
            >
              {submitting ? "SENDING..." : "> SEND"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
