interface ComboCounterProps {
  combo: number;
  className?: string;
}

export default function ComboCounter({ combo, className = "" }: ComboCounterProps) {
  if (combo < 2) return null;

  const tier =
    combo >= 10 ? { label: "AMAZING!", bg: "linear-gradient(135deg, #ffe156, #ffa040)" } :
    combo >= 5 ? { label: "GREAT!", bg: "linear-gradient(135deg, #c86fff, #ff6b9d)" } :
    { label: "NICE!", bg: "linear-gradient(135deg, #7bff9a, #4adede)" };

  return (
    <div
      className={`${className} inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-black animate-pop-in text-on-primary`}
      style={{
        background: tier.bg,
        boxShadow: "0 6px 18px rgba(200, 111, 255, 0.35), inset 0 2px 0 rgba(255, 255, 255, 0.3)",
      }}
    >
      <span className="text-[10px] opacity-90">콤보</span>
      <span className="text-lg leading-none">×{combo}</span>
      <span className="text-[10px] opacity-90">{tier.label}</span>
    </div>
  );
}
