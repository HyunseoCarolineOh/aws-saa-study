"use client";

import { useState, useRef, useEffect } from "react";
import { addStudyNote } from "@/lib/store";

interface StudyNoteMemoSheetProps {
  isOpen: boolean;
  selectedText: string;
  questionId: string;
  sourceContext: "question" | "explanation" | "detail";
  onClose: () => void;
  onSaved: () => void;
}

export default function StudyNoteMemoSheet({
  isOpen,
  selectedText,
  questionId,
  sourceContext,
  onClose,
  onSaved,
}: StudyNoteMemoSheetProps) {
  const [memo, setMemo] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMemo("");
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleSave() {
    addStudyNote({
      questionId,
      selectedText,
      memo: memo.trim(),
      sourceContext,
    });
    onSaved();
  }

  const sourceLabel =
    sourceContext === "question" ? "문제" : sourceContext === "explanation" ? "해설" : "상세 풀이";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        className="relative w-full max-w-lg animate-slide-up pixel-window"
        style={{ maxHeight: "85vh", borderBottom: "none" }}
      >
        <div className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: "85vh" }}>
          <div className="flex justify-center">
            <div className="w-12 h-1.5" style={{ background: "var(--parchment)" }} />
          </div>

          <div className="flex items-center justify-between">
            <h3 className="section-title text-mana">📝 오답노트 저장</h3>
            <span
              className="pixel-badge"
              style={{
                background: "var(--accent-fg)",
                color: "var(--gb-dark)",
                borderColor: "var(--gb-dark)",
              }}
            >
              {sourceLabel}
            </span>
          </div>

          <div
            className="px-3 py-2.5"
            style={{
              background: "rgba(232, 185, 35, 0.1)",
              borderLeft: "3px solid var(--gold)",
            }}
          >
            <p className="body-sub leading-relaxed line-clamp-3" style={{ color: "var(--warning-fg)" }}>
              {selectedText}
            </p>
          </div>

          <div>
            <label className="block pixel-label text-muted mb-2">메모 (선택)</label>
            <textarea
              ref={textareaRef}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="헷갈리는 이유, 핵심 포인트..."
              className="pixel-input"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pb-20">
            <button onClick={onClose} className="pixel-btn pixel-btn-ghost flex-1 py-3">
              취소
            </button>
            <button onClick={handleSave} className="pixel-btn pixel-btn-primary flex-1 py-3">
              &gt; 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
