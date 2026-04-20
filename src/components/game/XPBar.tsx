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
          <span className="text-xs font-semibold text-muted">{label}</span>
          <span className="text-xs font-bold text-rose">{value} / {max}</span>
        </div>
      )}
      <div className="h-3 rounded-full bg-muted-bg overflow-hidden border border-border relative">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #ffb4c6 0%, #c8b4ff 50%, #a8dcff 100%)",
            boxShadow: "0 0 12px rgba(255, 180, 198, 0.45)",
          }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full pointer-events-none"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, transparent 50%)",
          }}
        />
      </div>
    </div>
  );
}
