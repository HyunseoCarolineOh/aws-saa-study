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
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-[10px] font-display text-parchment">{label}</span>
          <span className="text-[10px] font-display text-gold">{value}/{max}</span>
        </div>
      )}
      <div
        className="h-3 relative"
        style={{
          background: "#0f380f",
          border: "2px solid #5a4530",
          boxShadow: "inset 1px 1px 0 rgba(0,0,0,0.4)",
        }}
      >
        <div
          className="h-full transition-[width] duration-300"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(180deg, #d4e27a 0%, #9bbc0f 50%, #4a7a3c 100%)",
          }}
        />
      </div>
    </div>
  );
}
