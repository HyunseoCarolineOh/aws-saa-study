"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface TextSelectionPopoverProps {
  questionId: string;
  sourceContext: "question" | "explanation" | "detail";
  onSaveRequest: (selectedText: string, sourceContext: "question" | "explanation" | "detail") => void;
  children: React.ReactNode;
}

export default function TextSelectionPopover({
  questionId,
  sourceContext,
  onSaveRequest,
  children,
}: TextSelectionPopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [popover, setPopover] = useState<{ top: number; left: number; text: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelectionChange = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setPopover(null);
        return;
      }

      const container = containerRef.current;
      if (!container) return;

      const range = sel.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) {
        setPopover(null);
        return;
      }

      const text = sel.toString().trim();
      if (!text) {
        setPopover(null);
        return;
      }

      const rangeRect = range.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // 선택 영역 아래에 표시 (모바일 OS 메뉴와 충돌 방지)
      const POPOVER_HEIGHT = 36;
      const POPOVER_WIDTH = 120;
      const GAP = 8;

      let top = rangeRect.bottom - containerRect.top + GAP;
      // 하단 공간 부족 시 위에 표시
      if (rangeRect.bottom + POPOVER_HEIGHT + GAP > window.innerHeight) {
        top = rangeRect.top - containerRect.top - POPOVER_HEIGHT - GAP;
      }

      const left = Math.max(
        0,
        Math.min(
          rangeRect.left - containerRect.left + rangeRect.width / 2 - POPOVER_WIDTH / 2,
          containerRect.width - POPOVER_WIDTH
        )
      );

      setPopover({ top, left, text });
    }, 300);
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [handleSelectionChange]);

  // 문제 변경 시 팝오버 초기화
  useEffect(() => {
    setPopover(null);
  }, [questionId]);

  function handleSave() {
    if (!popover) return;
    onSaveRequest(popover.text, sourceContext);
    window.getSelection()?.removeAllRanges();
    setPopover(null);
  }

  return (
    <div ref={containerRef} className="relative select-text">
      {children}
      {popover && (
        <div
          className="absolute z-40 animate-fade-in"
          style={{ top: popover.top, left: popover.left }}
        >
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 text-xs font-display font-bold px-3 py-2 rounded-full whitespace-nowrap text-on-primary animate-pop-in"
            style={{
              touchAction: "manipulation",
              minHeight: 44,
              background: "linear-gradient(135deg, #ffb4c6, #c8b4ff)",
              boxShadow: "0 8px 20px rgba(255,180,198,0.4), 0 0 0 1px rgba(255,255,255,0.15) inset",
            }}
          >
            📝 노트 저장
          </button>
        </div>
      )}
    </div>
  );
}
