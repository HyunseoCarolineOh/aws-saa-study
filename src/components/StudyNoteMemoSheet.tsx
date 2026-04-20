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
      // 약간의 딜레이 후 포커스 (애니메이션 완료 대기)
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
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div
        className="relative w-full max-w-lg animate-slide-up"
        style={{
          maxHeight: "85vh",
          background: "#2a1f17",
          border: "4px solid #e6d3a3",
          borderBottom: "none",
          boxShadow: "inset 0 0 0 2px #1a1410, inset 0 0 0 4px #5a4530",
        }}
      >
        <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: "85vh" }}>
          <div className="flex justify-center">
            <div className="w-10 h-1" style={{ background: "#e6d3a3" }} />
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-xs font-display text-mana">&gt; SAVE NOTE</h3>
            <span
              className="text-[10px] px-1.5 py-0.5 font-display"
              style={{ background: "#c4a4e0", color: "#0f380f", border: "1px solid #0f380f" }}
            >
              {sourceLabel}
            </span>
          </div>

          <div className="px-3 py-2" style={{ background: "rgba(232, 185, 35, 0.1)", borderLeft: "4px solid #e8b923" }}>
            <p className="text-xs leading-relaxed line-clamp-3 font-retro" style={{ color: "var(--warning-fg)" }}>
              {selectedText}
            </p>
          </div>

          <div>
            <label className="block text-[10px] text-muted mb-1 font-display">&gt; MEMO</label>
            <textarea
              ref={textareaRef}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="이 부분이 왜 중요한지..."
              className="w-full px-3 py-2.5 text-sm leading-relaxed resize-none focus:outline-none font-retro"
              style={{
                background: "#0f380f",
                border: "2px solid #5b9cd8",
                color: "var(--foreground)",
              }}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pb-20">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-display text-muted"
              style={{ background: "#2a1f17", border: "2px solid #5a4530", boxShadow: "2px 2px 0 #5a4530" }}
            >
              CANCEL
            </button>
            <button onClick={handleSave} className="flex-1 py-2.5 text-xs font-display pixel-button">
              &gt; SAVE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
