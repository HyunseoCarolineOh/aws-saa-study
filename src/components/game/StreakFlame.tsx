interface StreakFlameProps {
  days: number;
  className?: string;
}

export default function StreakFlame({ days, className = "" }: StreakFlameProps) {
  const isActive = days > 0;
  return (
    <div
      className={`${className} inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full`}
      style={{
        background: isActive
          ? "linear-gradient(135deg, rgba(255, 160, 64, 0.2), rgba(255, 107, 157, 0.2))"
          : "rgba(168, 150, 216, 0.12)",
        border: `1.5px solid ${isActive ? "rgba(255, 160, 64, 0.5)" : "rgba(168, 150, 216, 0.3)"}`,
        boxShadow: isActive ? "0 4px 14px rgba(255, 160, 64, 0.25)" : undefined,
      }}
    >
      <span className={`text-lg leading-none ${isActive ? "animate-flame" : "opacity-50 grayscale"}`} aria-hidden>
        🔥
      </span>
      <span className="text-xs font-black text-accent-fg">
        {days}
        <span className="opacity-70 font-bold ml-0.5">일</span>
      </span>
    </div>
  );
}
