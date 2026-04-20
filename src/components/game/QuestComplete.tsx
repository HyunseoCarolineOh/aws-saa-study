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
    <div className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center animate-fade-in">
      <div
        className="relative px-6 py-5 text-center animate-pop-in font-display pixel-window"
        style={{
          background: "#2a1f17",
          color: "#e6d3a3",
        }}
      >
        <p className="text-lg font-black text-gb-green mb-1 animate-blink">★ {title} ★</p>
        {subtitle && <p className="text-[10px] text-parchment font-retro">{subtitle}</p>}
      </div>
    </div>
  );
}
