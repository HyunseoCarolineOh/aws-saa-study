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
          <span className="text-[10px] font-display text-neon-cyan tracking-widest">{label}</span>
          <span className="text-[10px] font-display text-neon-pink">{value} / {max}</span>
        </div>
      )}
      <div
        className="h-3 overflow-hidden relative"
        style={{
          background: "rgba(10, 5, 20, 0.9)",
          border: "1px solid rgba(0, 240, 255, 0.4)",
          boxShadow: "inset 0 0 8px rgba(0, 0, 0, 0.8)",
        }}
      >
        <div
          className="h-full transition-[width] duration-500 ease-out relative"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #ff2e88 0%, #a855ff 50%, #00f0ff 100%)",
            boxShadow: "0 0 14px rgba(255, 46, 136, 0.7), inset 0 0 8px rgba(255, 255, 255, 0.3)",
          }}
        />
      </div>
    </div>
  );
}
