interface StreakFlameProps {
  days: number;
  className?: string;
}

export default function StreakFlame({ days, className = "" }: StreakFlameProps) {
  const isActive = days > 0;
  return (
    <div
      className={`${className} inline-flex items-center gap-1.5 px-2 py-1 font-retro`}
      style={{
        background: isActive ? "rgba(232, 185, 35, 0.15)" : "rgba(138, 112, 80, 0.1)",
        border: `2px solid ${isActive ? "#e8b923" : "#5a4530"}`,
      }}
    >
      <span className={`text-base leading-none ${isActive ? "animate-flame" : "opacity-40 grayscale"}`} aria-hidden>
        🔥
      </span>
      <span className="text-sm font-bold text-gold tracking-wider leading-none">
        {days}
        <span className="opacity-70 text-xs ml-0.5">DAY</span>
      </span>
    </div>
  );
}
