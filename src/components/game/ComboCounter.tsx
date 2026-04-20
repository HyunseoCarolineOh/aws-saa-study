interface ComboCounterProps {
  combo: number;
  className?: string;
}

export default function ComboCounter({ combo, className = "" }: ComboCounterProps) {
  if (combo < 2) return null;

  const tier =
    combo >= 10 ? { label: "PERFECT!!", color: "#ffee00" } :
    combo >= 5 ? { label: "GREAT!!", color: "#00f0ff" } :
    { label: "NICE!", color: "#b4ff39" };

  return (
    <div
      className={`${className} inline-flex items-center gap-2 px-3 py-1.5 font-display animate-pop-in`}
      style={{
        background: "rgba(10, 5, 20, 0.9)",
        border: `1px solid ${tier.color}aa`,
        boxShadow: `0 0 18px ${tier.color}66`,
      }}
    >
      <span className="text-[10px] text-neon-cyan tracking-widest">CMB</span>
      <span className="text-lg text-neon-pink leading-none neon-glow-pink">×{combo}</span>
      <span className="text-[9px] tracking-widest" style={{ color: tier.color, textShadow: `0 0 6px ${tier.color}` }}>
        {tier.label}
      </span>
    </div>
  );
}
