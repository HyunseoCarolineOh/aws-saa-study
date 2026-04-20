interface XPBarProps {
  value: number;
  max: number;
  label?: string;
  className?: string;
}

export default function XPBar({ value, max, label, className = "" }: XPBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round((value / Math.max(1, max)) * 100)));
  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="pixel-label text-muted">{label}</span>
          <span className="pixel-label text-gold">
            {value} / {max}
            <span className="ml-2 opacity-80">{pct}%</span>
          </span>
        </div>
      )}
      <div
        className="h-3.5"
        style={{
          background: "var(--gb-dark)",
          border: "2px solid var(--border)",
          boxShadow: "inset 1px 1px 0 rgba(0,0,0,0.4)",
        }}
      >
        <div
          className="h-full transition-[width] duration-300"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(180deg, #d4e27a 0%, #9bbc0f 60%, #4a7a3c 100%)",
          }}
        />
      </div>
    </div>
  );
}
