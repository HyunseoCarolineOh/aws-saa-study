interface ComboCounterProps {
  combo: number;
  className?: string;
}

export default function ComboCounter({ combo, className = "" }: ComboCounterProps) {
  if (combo < 2) return null;

  const tier =
    combo >= 10 ? { label: "EXCELLENT!", glow: "#ffe27a" } :
    combo >= 5 ? { label: "GREAT!", glow: "#c8b4ff" } :
    { label: "NICE!", glow: "#b4f2e1" };

  return (
    <div
      className={`${className} inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-display font-bold animate-pop-in`}
      style={{
        background: `linear-gradient(135deg, rgba(255,180,198,0.2), rgba(200,180,255,0.2))`,
        border: `1px solid ${tier.glow}66`,
        boxShadow: `0 0 16px ${tier.glow}44`,
      }}
    >
      <span className="text-xs text-mint">COMBO</span>
      <span className="text-lg text-rose leading-none">×{combo}</span>
      <span className="text-[10px] text-lavender opacity-80 tracking-wide">{tier.label}</span>
    </div>
  );
}
