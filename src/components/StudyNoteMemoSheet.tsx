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

      {/* 바텀시트 */}
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl animate-slide-up" style={{ maxHeight: "85vh" }}>
        <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: "85vh" }}>
          {/* 핸들 */}
          <div className="flex justify-center">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">오답노트 저장</h3>
            <span className="text-[10px] text-muted bg-gray-100 px-2 py-0.5 rounded">
              {sourceLabel}에서 선택
            </span>
          </div>

          {/* 선택된 텍스트 미리보기 */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 px-3 py-2 rounded-r">
            <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">
              {selectedText}
            </p>
          </div>

          {/* 메모 입력 */}
          <div>
            <label className="block text-xs text-muted mb-1">메모 (선택사항)</label>
            <textarea
              ref={textareaRef}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="이 부분이 왜 중요한지, 헷갈리는 이유 등..."
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm leading-relaxed resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              rows={3}
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pb-20">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium active:scale-[0.98] transition-transform"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
