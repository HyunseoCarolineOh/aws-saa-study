interface StreakFlameProps {
  days: number;
  className?: string;
}

export default function StreakFlame({ days, className = "" }: StreakFlameProps) {
  const isActive = days > 0;
  return (
    <div
      className={`${className} inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border`}
      style={{
        background: isActive ? "rgba(255, 203, 168, 0.18)" : "rgba(181, 170, 212, 0.12)",
        borderColor: isActive ? "rgba(255, 203, 168, 0.45)" : "rgba(181, 170, 212, 0.3)",
      }}
    >
      <span className={`text-lg leading-none ${isActive ? "animate-flame" : "opacity-50 grayscale"}`} aria-hidden>
        🔥
      </span>
      <span className="text-xs font-bold text-accent-fg">
        {days}
        <span className="opacity-70 font-medium ml-0.5">일</span>
      </span>
    </div>
  );
}
