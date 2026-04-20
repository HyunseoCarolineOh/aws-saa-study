"use client";

import { useEffect, useState } from "react";

interface QuestCompleteProps {
  show: boolean;
  title?: string;
  subtitle?: string;
  onDone?: () => void;
}

export default function QuestComplete({ show, title = "미션 성공!", subtitle, onDone }: QuestCompleteProps) {
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
        className="relative px-8 py-6 rounded-[32px] text-center animate-pop-in text-on-primary"
        style={{
          background: "linear-gradient(135deg, #ff6b9d 0%, #c86fff 50%, #4adede 100%)",
          boxShadow:
            "0 20px 60px rgba(255, 107, 157, 0.5), 0 0 80px rgba(200, 111, 255, 0.4), inset 0 4px 0 rgba(255, 255, 255, 0.3), inset 0 -3px 0 rgba(0, 0, 0, 0.15)",
        }}
      >
        <div className="absolute -top-4 -left-5 text-3xl animate-sparkle">🎉</div>
        <div className="absolute -top-3 -right-5 text-2xl animate-sparkle" style={{ animationDelay: "0.3s" }}>✨</div>
        <div className="absolute -bottom-3 -left-4 text-2xl animate-sparkle" style={{ animationDelay: "0.6s" }}>🎀</div>
        <div className="absolute -bottom-4 -right-4 text-3xl animate-sparkle" style={{ animationDelay: "0.9s" }}>🍬</div>
        <p className="text-2xl font-black mb-1">{title}</p>
        {subtitle && <p className="text-sm font-bold opacity-95">{subtitle}</p>}
      </div>
    </div>
  );
}
