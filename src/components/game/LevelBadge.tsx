interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function LevelBadge({ level, size = "md", className = "" }: LevelBadgeProps) {
  const dim = { sm: 40, md: 56, lg: 72 }[size];
  const lvSize = { sm: 8, md: 10, lg: 11 }[size];
  const numSize = { sm: 16, md: 22, lg: 28 }[size];

  return (
    <div
      className={`${className} relative inline-flex flex-col items-center justify-center flex-shrink-0 animate-pop-in`}
      style={{
        width: dim,
        height: dim,
        background: "var(--gb-green)",
        color: "var(--gb-dark)",
        border: "3px solid var(--gb-dark)",
        boxShadow: "3px 3px 0 var(--gb-dark), inset 1px 1px 0 rgba(255,255,255,0.3)",
        fontFamily: "var(--font-pixel)",
      }}
    >
      <span style={{ fontSize: lvSize, letterSpacing: "0.15em", lineHeight: 1 }}>LV</span>
      <span style={{ fontSize: numSize, fontWeight: 700, lineHeight: 1, marginTop: 2 }}>{level}</span>
    </div>
  );
}
