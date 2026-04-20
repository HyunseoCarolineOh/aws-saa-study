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
          background: "rgba(10, 5, 20, 0.98)",
          border: "1.5px solid rgba(0, 240, 255, 0.5)",
          borderBottom: "none",
          boxShadow: "0 0 30px rgba(0, 240, 255, 0.25)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: "85vh" }}>
          <div className="flex justify-center">
            <div className="w-10 h-1" style={{ background: "var(--neon-cyan)", boxShadow: "0 0 8px rgba(0, 240, 255, 0.8)" }} />
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display tracking-widest text-neon-cyan neon-glow-cyan">&gt; SAVE NOTE</h3>
            <span
              className="text-[10px] px-2 py-0.5 font-display tracking-widest"
              style={{
                background: "rgba(168, 85, 255, 0.15)",
                color: "var(--accent-fg)",
                border: "1px solid rgba(168, 85, 255, 0.4)",
              }}
            >
              FROM: {sourceLabel.toUpperCase()}
            </span>
          </div>

          <div
            className="px-3 py-2"
            style={{
              background: "rgba(255, 238, 0, 0.08)",
              borderLeft: "3px solid var(--neon-yellow)",
            }}
          >
            <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "var(--warning-fg)" }}>
              {selectedText}
            </p>
          </div>

          <div>
            <label className="block text-[10px] text-muted mb-1 font-display tracking-widest">&gt; MEMO (OPTIONAL)</label>
            <textarea
              ref={textareaRef}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="헷갈리는 이유/포인트..."
              className="w-full px-3 py-2.5 text-sm leading-relaxed resize-none focus:outline-none"
              style={{
                background: "rgba(18, 7, 38, 0.8)",
                border: "1.5px solid rgba(0, 240, 255, 0.35)",
                color: "var(--foreground)",
              }}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pb-20">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-display tracking-widest text-muted"
              style={{
                background: "rgba(18, 7, 38, 0.6)",
                border: "1px solid var(--border)",
              }}
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 text-xs font-display font-bold tracking-widest active:scale-[0.97] transition-all"
              style={{
                background: "linear-gradient(135deg, #00f0ff, #a855ff)",
                color: "#0a0514",
                boxShadow: "0 0 16px rgba(0, 240, 255, 0.4)",
              }}
            >
              &gt; SAVE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
