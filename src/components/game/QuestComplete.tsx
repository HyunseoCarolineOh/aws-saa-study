"use client";

import { useEffect, useState } from "react";

interface QuestCompleteProps {
  show: boolean;
  title?: string;
  subtitle?: string;
  onDone?: () => void;
}

export default function QuestComplete({ show, title = "QUEST CLEAR!", subtitle, onDone }: QuestCompleteProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        onDone?.();
      }, 1800);
      return () => clearTimeout(t);
    }
  }, [show, onDone]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center animate-fade-in px-6">
      <div className="pixel-window px-6 py-5 text-center animate-pop-in">
        <p
          className="animate-blink"
          style={{
            fontFamily: "var(--font-pixel)",
            fontSize: 16,
            color: "var(--gb-green)",
            letterSpacing: "0.05em",
          }}
        >
          ★ {title} ★
        </p>
        {subtitle && <p className="body-sub mt-2">{subtitle}</p>}
      </div>
    </div>
  );
}
