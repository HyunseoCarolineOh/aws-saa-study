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
        className="relative w-full max-w-lg rounded-t-3xl animate-slide-up"
        style={{
          maxHeight: "85vh",
          background: "linear-gradient(180deg, rgba(46,40,73,0.98), rgba(37,32,58,0.98))",
          border: "1px solid rgba(200,180,255,0.3)",
          borderBottom: "none",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: "85vh" }}>
          <div className="flex justify-center">
            <div className="w-10 h-1.5 rounded-full" style={{ background: "var(--pastel-rose)" }} />
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold text-rose">📝 노트에 저장</h3>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-display font-bold"
              style={{
                background: "rgba(200,180,255,0.12)",
                color: "var(--pastel-lavender)",
              }}
            >
              {sourceLabel}에서 선택
            </span>
          </div>

          <div
            className="rounded-2xl px-3 py-2"
            style={{
              background: "linear-gradient(135deg, rgba(255,226,122,0.12), rgba(255,203,168,0.08))",
              borderLeft: "3px solid var(--pastel-lemon)",
            }}
          >
            <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "var(--warning-fg)" }}>
              {selectedText}
            </p>
          </div>

          <div>
            <label className="block text-xs text-muted mb-1 font-display font-bold">💭 메모 (선택)</label>
            <textarea
              ref={textareaRef}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="헷갈리는 이유나 포인트를 적어둬요..."
              className="w-full rounded-2xl px-3 py-2.5 text-sm leading-relaxed resize-none focus:outline-none"
              style={{
                background: "rgba(37,32,58,0.7)",
                border: "1.5px solid var(--border)",
                color: "var(--foreground)",
              }}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pb-20">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-3xl text-sm font-display font-bold text-muted"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-3xl text-sm font-display font-bold text-on-primary active:scale-[0.97] transition-all"
              style={{
                background: "linear-gradient(135deg, #ffb4c6, #c8b4ff)",
                boxShadow: "0 6px 18px rgba(255,180,198,0.3)",
              }}
            >
              ✨ 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
