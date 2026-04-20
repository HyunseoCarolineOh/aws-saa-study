interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function LevelBadge({ level, size = "md", className = "" }: LevelBadgeProps) {
  const sizeClass = {
    sm: "w-10 h-10 text-[10px]",
    md: "w-14 h-14 text-xs",
    lg: "w-20 h-20 text-sm",
  }[size];

  return (
    <div
      className={`${sizeClass} ${className} relative inline-flex flex-col items-center justify-center font-display animate-pop-in`}
      style={{
        background: "#9bbc0f",
        color: "#0f380f",
        border: "3px solid #0f380f",
        boxShadow: "3px 3px 0 #0f380f, inset 1px 1px 0 rgba(255,255,255,0.3)",
      }}
    >
      <span className="text-[0.65em] leading-none tracking-widest">LV</span>
      <span className="text-[1.3em] font-black leading-none mt-0.5">{level}</span>
    </div>
  );
}
