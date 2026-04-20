interface ComboCounterProps {
  combo: number;
  className?: string;
}

export default function ComboCounter({ combo, className = "" }: ComboCounterProps) {
  if (combo < 2) return null;

  const tier =
    combo >= 10 ? { label: "LEGEND", color: "#e8b923" } :
    combo >= 5 ? { label: "GREAT", color: "#8fc0e8" } :
    { label: "NICE", color: "#9bbc0f" };

  return (
    <div
      className={`${className} inline-flex items-center gap-1.5 px-2 py-1 animate-pop-in flex-shrink-0`}
      style={{
        background: "var(--gb-dark)",
        border: `2px solid ${tier.color}`,
        color: tier.color,
        fontFamily: "var(--font-pixel)",
      }}
    >
      <span style={{ fontSize: 9, letterSpacing: "0.1em", opacity: 0.8 }}>CMB</span>
      <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1 }}>×{combo}</span>
      <span style={{ fontSize: 8, letterSpacing: "0.1em", opacity: 0.85 }}>{tier.label}</span>
    </div>
  );
}
