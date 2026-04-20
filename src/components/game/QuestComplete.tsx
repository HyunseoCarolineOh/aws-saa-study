"use client";

import { useEffect, useState } from "react";

interface QuestCompleteProps {
  show: boolean;
  title?: string;
  subtitle?: string;
  onDone?: () => void;
}

export default function QuestComplete({ show, title = "STAGE CLEAR!", subtitle, onDone }: QuestCompleteProps) {
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
        className="relative px-8 py-6 text-center animate-pop-in font-display"
        style={{
          background: "rgba(10, 5, 20, 0.95)",
          border: "2px solid rgba(255, 46, 136, 0.7)",
          boxShadow: "0 0 60px rgba(255, 46, 136, 0.6), 0 0 120px rgba(168, 85, 255, 0.3), inset 0 0 20px rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(8px)",
        }}
      >
        <p className="text-2xl font-black text-neon-pink neon-glow-pink mb-1 animate-flicker">{title}</p>
        {subtitle && <p className="text-[10px] text-neon-cyan tracking-widest neon-glow-cyan">{subtitle}</p>}
      </div>
    </div>
  );
}
