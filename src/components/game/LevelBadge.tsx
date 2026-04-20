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
      className={`${sizeClass} ${className} relative inline-flex items-center justify-center font-display font-bold animate-pop-in`}
      style={{
        background: "linear-gradient(135deg, #ff2e88 0%, #a855ff 100%)",
        color: "#0a0514",
        clipPath: "polygon(15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%, 0% 15%)",
        boxShadow: "0 0 18px rgba(255, 46, 136, 0.6), 0 0 38px rgba(168, 85, 255, 0.3)",
      }}
    >
      <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[0.55em] leading-none tracking-widest">LV</span>
      <span className="text-[1.3em] font-black mt-1 leading-none">{level}</span>
    </div>
  );
}
