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
          <span className="text-xs font-bold text-muted">{label}</span>
          <span className="text-xs font-black text-jelly-pink">{value} / {max}</span>
        </div>
      )}
      <div
        className="h-4 overflow-hidden relative"
        style={{
          background: "rgba(15, 8, 35, 0.8)",
          border: "1.5px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "999px",
          boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div
          className="h-full transition-[width] duration-500 ease-out relative"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #ff6b9d 0%, #c86fff 50%, #4adede 100%)",
            borderRadius: "999px",
            boxShadow: "0 0 18px rgba(255, 107, 157, 0.55), inset 0 2px 0 rgba(255, 255, 255, 0.3)",
          }}
        />
      </div>
    </div>
  );
}
