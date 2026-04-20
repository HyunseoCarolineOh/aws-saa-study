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
      className={`${sizeClass} ${className} relative inline-flex items-center justify-center rounded-full font-black animate-pop-in animate-jelly-bounce text-on-primary`}
      style={{
        background: "linear-gradient(135deg, #ff6b9d 0%, #c86fff 100%)",
        boxShadow:
          "0 8px 24px rgba(255, 107, 157, 0.5), 0 4px 10px rgba(200, 111, 255, 0.3), inset 0 3px 0 rgba(255, 255, 255, 0.4), inset 0 -3px 0 rgba(0, 0, 0, 0.15)",
      }}
    >
      <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[0.6em] opacity-80 leading-none">LV</span>
      <span className="text-[1.4em] font-black mt-1.5 leading-none">{level}</span>
    </div>
  );
}
