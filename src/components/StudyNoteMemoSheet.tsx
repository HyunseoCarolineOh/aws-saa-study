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
        className="relative w-full max-w-lg rounded-t-[32px] animate-slide-up"
        style={{
          maxHeight: "85vh",
          background: "linear-gradient(180deg, rgba(26, 18, 56, 0.98), rgba(13, 8, 35, 0.98))",
          border: "1.5px solid rgba(74, 222, 222, 0.4)",
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
            <h3 className="text-base font-black text-jelly-pink">📝 노트 저장</h3>
            <span
              className="text-[10px] px-2.5 py-1 rounded-full font-black text-on-primary"
              style={{ background: "linear-gradient(135deg, #c86fff, #7b61ff)" }}
            >
              {sourceLabel}에서
            </span>
          </div>

          <div
            className="rounded-2xl px-3 py-2"
            style={{
              background: "linear-gradient(135deg, rgba(255, 225, 86, 0.12), rgba(255, 160, 64, 0.08))",
              borderLeft: "3px solid var(--jelly-yellow)",
            }}
          >
            <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "var(--warning-fg)" }}>
              {selectedText}
            </p>
          </div>

          <div>
            <label className="block text-xs text-muted mb-1.5 font-black">💭 메모 (선택)</label>
            <textarea
              ref={textareaRef}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="헷갈리는 이유나 포인트를 적어봐요..."
              className="w-full rounded-2xl px-3 py-2.5 text-sm leading-relaxed resize-none focus:outline-none"
              style={{
                background: "rgba(15, 8, 35, 0.8)",
                border: "1.5px solid rgba(74, 222, 222, 0.35)",
                color: "var(--foreground)",
              }}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pb-20">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-[18px] text-sm font-black text-muted"
              style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border)" }}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 rounded-[18px] text-sm font-black text-on-primary active:scale-[0.97] active:translate-y-1 transition-all"
              style={{
                background: "linear-gradient(135deg, #ff6b9d, #c86fff)",
                boxShadow: "0 10px 24px -4px rgba(255, 107, 157, 0.45), inset 0 2px 0 rgba(255, 255, 255, 0.3)",
              }}
            >
              ✨ 저장!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
