interface StreakFlameProps {
  days: number;
  className?: string;
}

export default function StreakFlame({ days, className = "" }: StreakFlameProps) {
  const isActive = days > 0;
  return (
    <div
      className={`${className} inline-flex items-center gap-1.5 px-3 py-1.5 font-retro`}
      style={{
        background: isActive ? "rgba(255, 238, 0, 0.12)" : "rgba(138, 111, 184, 0.1)",
        border: `1px solid ${isActive ? "rgba(255, 238, 0, 0.5)" : "rgba(138, 111, 184, 0.3)"}`,
        boxShadow: isActive ? "0 0 12px rgba(255, 238, 0, 0.3)" : undefined,
      }}
    >
      <span className={`text-lg leading-none ${isActive ? "animate-flicker" : "opacity-40 grayscale"}`} aria-hidden>
        🔥
      </span>
      <span className="text-sm font-bold text-neon-yellow tracking-wider">
        {days}
        <span className="opacity-70 text-xs ml-0.5">DAYS</span>
      </span>
    </div>
  );
}
