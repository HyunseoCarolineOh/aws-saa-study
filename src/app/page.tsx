import Link from "next/link";
import ServiceResumeCard from "@/components/ServiceResumeCard";
import XPBar from "@/components/game/XPBar";
import LevelBadge from "@/components/game/LevelBadge";
import StreakFlame from "@/components/game/StreakFlame";

const STUDY_START = new Date("2026-04-08");
const STUDY_DAYS = 14;

function getDayInfo() {
  const now = new Date();
  const diffMs = now.getTime() - STUDY_START.getTime();
  const currentDay = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  const daysLeft = STUDY_DAYS - currentDay + 1;
  const progress = Math.min(100, Math.round((currentDay / STUDY_DAYS) * 100));
  return {
    currentDay: Math.max(1, Math.min(currentDay, STUDY_DAYS)),
    daysLeft: Math.max(0, daysLeft),
    progress,
  };
}

function getWeekPhase(day: number) {
  if (day <= 3) return { phase: "STAGE 1: CONCEPT", desc: "도메인별 기본기 습득", color: "#b4ff39" };
  if (day <= 7) return { phase: "STAGE 2: THINK FAST", desc: "시나리오 문제 연습", color: "#00f0ff" };
  if (day <= 12) return { phase: "STAGE 3: SPEED RUSH", desc: "덤프 문제 연타", color: "#a855ff" };
  return { phase: "FINAL: BOSS RUSH", desc: "모의시험 + 약점 보강", color: "#ff2e88" };
}

export default function Dashboard() {
  const { currentDay, daysLeft, progress } = getDayInfo();
  const { phase, desc, color } = getWeekPhase(currentDay);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-display text-neon-cyan tracking-[0.3em] neon-glow-cyan">AWS SAA-C03</p>
          <h1 className="text-xl font-display font-black text-neon-pink neon-glow-pink animate-flicker">&gt; INSERT COIN</h1>
        </div>
        <StreakFlame days={0} />
      </div>

      {/* PLAYER HUD */}
      <Link
        href="/curriculum"
        className="block p-5 mb-4 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(18, 7, 38, 0.95), rgba(28, 14, 56, 0.95))",
          border: "1.5px solid rgba(0, 240, 255, 0.45)",
          boxShadow: "0 0 30px rgba(0, 240, 255, 0.15), inset 0 0 20px rgba(255, 46, 136, 0.08)",
        }}
      >
        <div className="flex items-center gap-4 mb-4">
          <LevelBadge level={currentDay} size="lg" />
          <div className="flex-1">
            <p className="text-[10px] font-display tracking-widest mb-1" style={{ color }}>
              {phase}
            </p>
            <p className="text-xs text-muted leading-relaxed">{desc}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-display font-black text-neon-pink leading-none neon-glow-pink">D-{daysLeft}</p>
            <p className="text-[9px] text-muted mt-1 tracking-widest font-display">LEFT</p>
          </div>
        </div>
        <XPBar value={currentDay} max={STUDY_DAYS} label={`QUEST PROG ${progress}%`} />
      </Link>

      {/* DAILY QUEST */}
      <div
        className="p-5 mb-4 relative"
        style={{
          background: "rgba(18, 7, 38, 0.9)",
          border: "1.5px solid rgba(180, 255, 57, 0.35)",
          boxShadow: "0 0 18px rgba(180, 255, 57, 0.12)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm text-neon-lime neon-glow-lime tracking-widest">&gt; DAILY QUEST</h2>
          <span className="text-[9px] text-muted tracking-widest font-display">LOG</span>
        </div>
        <div className="space-y-1">
          <TodoItem label="CONCEPT CARDS" count="×10" tag="LEARN" done={false} />
          <TodoItem label="QUESTION DRILL" count="×30" tag="SOLVE" done={false} />
          <TodoItem label="MISS REMATCH" count="×5" tag="REDO" done={false} />
        </div>
      </div>

      <ServiceResumeCard />

      {/* ARCADE MENU */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <QuickAction href="/questions" label="QUEST" sublabel="랜덤 출제" emoji="⚔" color="#ff2e88" />
        <QuickAction href="/review" label="REMATCH" sublabel="오답 재도전" emoji="🔄" color="#b4ff39" />
        <QuickAction href="/mock-exam" label="BOSS" sublabel="65Q / 130MIN" emoji="👑" color="#a855ff" />
        <QuickAction href="/concepts" label="CODEX" sublabel="AWS 도감" emoji="📖" color="#00f0ff" />
      </div>

      {/* HI-SCORE */}
      <div
        className="p-5"
        style={{
          background: "rgba(18, 7, 38, 0.9)",
          border: "1.5px solid rgba(168, 85, 255, 0.4)",
          boxShadow: "0 0 18px rgba(168, 85, 255, 0.12)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm text-accent-fg tracking-widest" style={{ textShadow: "0 0 8px rgba(168,85,255,0.6)" }}>
            &gt; HI-SCORE
          </h2>
          <span className="text-[9px] text-muted tracking-widest font-display">STATS</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <StatBox label="SOLVED" value="0" color="#ff2e88" />
          <StatBox label="ACC" value="0%" color="#00f0ff" />
          <StatBox label="STREAK" value="0D" color="#ffee00" />
        </div>
      </div>
    </div>
  );
}

function TodoItem({ label, count, tag, done }: { label: string; count: string; tag: string; done: boolean }) {
  return (
    <div
      className="flex items-center justify-between py-2 px-2"
      style={{
        background: done ? "rgba(180, 255, 57, 0.06)" : "transparent",
        opacity: done ? 0.55 : 1,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-5 h-5 flex items-center justify-center font-display text-[9px]"
          style={{
            background: done ? "#b4ff39" : "transparent",
            border: `1px solid ${done ? "#b4ff39" : "#3a1d5f"}`,
            color: done ? "#0a0514" : "#8a6fb8",
          }}
        >
          {done ? "✓" : ""}
        </span>
        <span className={`font-display text-xs tracking-wide ${done ? "line-through" : ""}`}>{label}</span>
        <span className="text-[9px] font-display text-neon-cyan opacity-70 tracking-widest">[{tag}]</span>
      </div>
      <span className="text-xs font-display text-neon-pink">{count}</span>
    </div>
  );
}

function QuickAction({
  href,
  label,
  sublabel,
  emoji,
  color,
}: {
  href: string;
  label: string;
  sublabel: string;
  emoji: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="p-4 transition-all active:scale-[0.97] relative overflow-hidden"
      style={{
        background: "rgba(18, 7, 38, 0.85)",
        border: `1.5px solid ${color}55`,
        boxShadow: `0 0 12px ${color}22, inset 0 0 16px rgba(0, 0, 0, 0.5)`,
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl" style={{ filter: `drop-shadow(0 0 6px ${color})` }}>{emoji}</span>
      </div>
      <p className="font-display font-bold text-sm tracking-widest" style={{ color, textShadow: `0 0 8px ${color}99` }}>
        {label}
      </p>
      <p className="text-[10px] text-muted mt-0.5 font-retro">{sublabel}</p>
    </Link>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="py-2.5 px-1"
      style={{
        background: `${color}10`,
        border: `1px solid ${color}44`,
      }}
    >
      <p className="text-xl font-display font-black leading-none" style={{ color, textShadow: `0 0 8px ${color}99` }}>
        {value}
      </p>
      <p className="text-[9px] text-muted font-display tracking-widest mt-1">{label}</p>
    </div>
  );
}
