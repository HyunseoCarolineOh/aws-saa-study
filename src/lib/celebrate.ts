const EMOJIS = ["🎉", "✨", "🏆", "🎊", "⭐", "🚀", "💯", "🥳"];

export async function celebrateCorrect(): Promise<void> {
  if (typeof window === "undefined") return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const { default: confetti } = await import("canvas-confetti");

  const shapes = EMOJIS.map((text) =>
    confetti.shapeFromText({ text, scalar: 3.2 })
  );

  const baseOptions = {
    shapes,
    scalar: 3.2,
    ticks: 260,
    gravity: 0.45,
    drift: 0,
    startVelocity: 28,
    decay: 0.94,
    disableForReducedMotion: false,
  } as const;

  if (reduced) {
    confetti({
      ...baseOptions,
      particleCount: 16,
      spread: 70,
      ticks: 160,
      origin: { x: 0.5, y: 0.6 },
    });
    return;
  }

  const fire = (originX: number, delay: number) => {
    window.setTimeout(() => {
      confetti({
        ...baseOptions,
        particleCount: 14,
        spread: 80,
        origin: { x: originX, y: 0.75 },
      });
    }, delay);
  };

  // 1차: 좌/중/우 동시 발사
  fire(0.15, 0);
  fire(0.5, 0);
  fire(0.85, 0);

  // 2차: 450ms 후 살짝 안쪽에서 추가 발사 → 천천히 이어지는 "펑—펑" 느낌
  fire(0.3, 450);
  fire(0.7, 450);

  // 3차: 900ms 후 화면 중앙 마무리 버스트
  fire(0.5, 900);
}
