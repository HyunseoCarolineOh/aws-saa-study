interface ComboCounterProps {
  combo: number;
  className?: string;
}

export default function ComboCounter({ combo, className = "" }: ComboCounterProps) {
  if (combo < 2) return null;

  const tier =
    combo >= 10 ? { label: "LEGEND!", color: "#e8b923" } :
    combo >= 5 ? { label: "GREAT!", color: "#8fc0e8" } :
    { label: "NICE!", color: "#9bbc0f" };

  return (
    <div
      className={`${className} inline-flex items-center gap-1.5 px-2 py-1 font-display animate-pop-in`}
      style={{
        background: "#0f380f",
        border: `2px solid ${tier.color}`,
        color: tier.color,
      }}
    >
      <span className="text-[10px]">CMB</span>
      <span className="text-sm font-black leading-none">×{combo}</span>
      <span className="text-[9px]">{tier.label}</span>
    </div>
  );
}
