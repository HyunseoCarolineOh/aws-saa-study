interface StreakFlameProps {
  days: number;
  className?: string;
}

export default function StreakFlame({ days, className = "" }: StreakFlameProps) {
  const isActive = days > 0;
  return (
    <div
      className={`${className} inline-flex items-center gap-1.5 px-2.5 py-1.5 flex-shrink-0`}
      style={{
        background: isActive ? "rgba(232, 185, 35, 0.14)" : "rgba(90, 69, 48, 0.25)",
        border: `2px solid ${isActive ? "var(--gold)" : "var(--border)"}`,
      }}
    >
      <span
        className={`text-base leading-none ${isActive ? "animate-flame" : "opacity-45 grayscale"}`}
        aria-hidden
      >
        🔥
      </span>
      <span
        className="leading-none"
        style={{
          fontFamily: "var(--font-pixel)",
          fontSize: 11,
          color: isActive ? "var(--gold)" : "var(--muted)",
        }}
      >
        {days}
        <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.75 }}>DAY</span>
      </span>
    </div>
  );
}
