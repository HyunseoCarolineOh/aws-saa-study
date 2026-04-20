interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function LevelBadge({ level, size = "md", className = "" }: LevelBadgeProps) {
  const sizeClass = {
    sm: "w-10 h-10 text-xs",
    md: "w-14 h-14 text-sm",
    lg: "w-20 h-20 text-base",
  }[size];

  return (
    <div
      className={`${sizeClass} ${className} relative inline-flex items-center justify-center rounded-full font-display font-bold text-on-primary animate-pop-in`}
      style={{
        background: "linear-gradient(135deg, #ffb4c6 0%, #c8b4ff 100%)",
        boxShadow: "0 6px 20px rgba(255, 180, 198, 0.4), inset 0 2px 0 rgba(255,255,255,0.4)",
      }}
    >
      <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[0.6em] opacity-70 leading-none">LV</span>
      <span className="text-[1.3em] font-black mt-1 leading-none">{level}</span>
    </div>
  );
}
