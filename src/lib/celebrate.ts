const EMOJIS = ["🎉", "✨", "🏆", "🎊", "⭐", "🚀", "💯", "🥳"];

export async function celebrateCorrect(): Promise<void> {
  if (typeof window === "undefined") return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const { default: confetti } = await import("canvas-confetti");

  const shapes = EMOJIS.map((text) =>
    confetti.shapeFromText({ text, scalar: 2 })
  );

  const baseOptions = {
    shapes,
    scalar: 2,
    ticks: 120,
    gravity: 0.9,
    drift: 0,
    startVelocity: 45,
    disableForReducedMotion: false,
  } as const;

  if (reduced) {
    confetti({
      ...baseOptions,
      particleCount: 20,
      spread: 60,
      ticks: 80,
      origin: { x: 0.5, y: 0.6 },
    });
    return;
  }

  const fire = (originX: number, delay: number) => {
    window.setTimeout(() => {
      confetti({
        ...baseOptions,
        particleCount: 18,
        spread: 70,
        origin: { x: originX, y: 0.7 },
      });
    }, delay);
  };

  // 1차: 좌/중/우 동시 발사
  fire(0.15, 0);
  fire(0.5, 0);
  fire(0.85, 0);

  // 2차: 200ms 후 살짝 안쪽에서 추가 발사 → "펑펑" 연쇄 느낌
  fire(0.3, 200);
  fire(0.7, 200);
}
