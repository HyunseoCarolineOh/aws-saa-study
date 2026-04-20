"use client";

import { useEffect, useState } from "react";

interface QuestCompleteProps {
  show: boolean;
  title?: string;
  subtitle?: string;
  onDone?: () => void;
}

export default function QuestComplete({ show, title = "퀘스트 완료!", subtitle, onDone }: QuestCompleteProps) {
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
        className="relative px-8 py-6 rounded-3xl font-display text-center animate-pop-in"
        style={{
          background: "linear-gradient(135deg, rgba(37,32,58,0.95), rgba(46,40,73,0.95))",
          border: "2px solid rgba(255,180,198,0.5)",
          boxShadow: "0 20px 60px rgba(255,180,198,0.3), 0 0 40px rgba(200,180,255,0.25)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="absolute -top-4 -left-4 text-3xl animate-sparkle">✨</div>
        <div className="absolute -top-3 -right-5 text-2xl animate-sparkle" style={{ animationDelay: "0.3s" }}>🌸</div>
        <div className="absolute -bottom-3 -left-3 text-2xl animate-sparkle" style={{ animationDelay: "0.6s" }}>🍡</div>
        <div className="absolute -bottom-4 -right-4 text-3xl animate-sparkle" style={{ animationDelay: "0.9s" }}>⭐</div>
        <p className="text-2xl font-black text-rose mb-1">{title}</p>
        {subtitle && <p className="text-sm text-lavender font-semibold">{subtitle}</p>}
      </div>
    </div>
  );
}
