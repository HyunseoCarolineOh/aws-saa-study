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
  if (day <= 3) return { phase: "CH.1 BASICS", desc: "기본기 습득의 시대", color: "#9bbc0f" };
  if (day <= 7) return { phase: "CH.2 TRAINING", desc: "사고력 연마의 시대", color: "#8fc0e8" };
  if (day <= 12) return { phase: "CH.3 TRIAL", desc: "실전 시련의 시대", color: "#c4a4e0" };
  return { phase: "CH.4 BOSS", desc: "최종 결전의 시대", color: "#e86060" };
}

export default function Dashboard() {
  const { currentDay, daysLeft, progress } = getDayInfo();
  const { phase, desc, color } = getWeekPhase(currentDay);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-display text-gold mb-1">&gt; AWS SAA-C03</p>
          <h1 className="text-sm font-display font-black text-gb-green animate-blink">ADVENTURER LOG</h1>
        </div>
        <StreakFlame days={0} />
      </div>

      {/* PLAYER WINDOW */}
      <Link href="/curriculum" className="block p-4 mb-4 pixel-window">
        <div className="flex items-center gap-4 mb-4">
          <LevelBadge level={currentDay} size="lg" />
          <div className="flex-1">
            <p className="text-[10px] font-display mb-1" style={{ color }}>
              {phase}
            </p>
            <p className="text-sm font-retro text-parchment leading-tight">{desc}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-display font-black text-gold leading-none">D-{daysLeft}</p>
            <p className="text-[9px] text-muted mt-1 font-display">DAYS LEFT</p>
          </div>
        </div>
        <XPBar value={currentDay} max={STUDY_DAYS} label={`JOURNEY ${progress}%`} />
      </Link>

      {/* DAILY QUEST BOARD */}
      <div className="pixel-panel p-4 mb-4">
        <div className="flex items-center justify-between mb-3 pb-2" style={{ borderBottom: "2px dashed var(--border)" }}>
          <h2 className="font-display text-xs text-gold">★ TODAY'S QUEST</h2>
          <span className="text-[9px] font-display text-muted">DAILY</span>
        </div>
        <div className="space-y-2">
          <TodoItem label="CONCEPT STUDY" count="×10" tag="LEARN" done={false} />
          <TodoItem label="QUESTION DRILL" count="×30" tag="BATTLE" done={false} />
          <TodoItem label="MISS REVENGE" count="×5" tag="REDO" done={false} />
        </div>
      </div>

      <ServiceResumeCard />

      {/* MENU */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <QuickAction href="/questions" label="BATTLE" sublabel="랜덤 출제" emoji="⚔" color="#9bbc0f" />
        <QuickAction href="/review" label="REVENGE" sublabel="오답 재도전" emoji="🔄" color="#8fc0e8" />
        <QuickAction href="/mock-exam" label="BOSS" sublabel="65Q / 130M" emoji="👑" color="#e8b923" />
        <QuickAction href="/concepts" label="BESTIARY" sublabel="서비스 도감" emoji="📖" color="#c4a4e0" />
      </div>

      {/* STATUS WINDOW */}
      <div className="pixel-panel p-4">
        <div className="flex items-center justify-between mb-3 pb-2" style={{ borderBottom: "2px dashed var(--border)" }}>
          <h2 className="font-display text-xs text-mana">▲ STATUS</h2>
          <span className="text-[9px] font-display text-muted">PARAMS</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <StatBox label="SOLVED" value="0" color="#9bbc0f" />
          <StatBox label="HIT%" value="0" color="#8fc0e8" />
          <StatBox label="STREAK" value="0" color="#e8b923" />
        </div>
      </div>
    </div>
  );
}

function TodoItem({ label, count, tag, done }: { label: string; count: string; tag: string; done: boolean }) {
  return (
    <div className="flex items-center justify-between py-1" style={{ opacity: done ? 0.5 : 1 }}>
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-5 h-5 flex items-center justify-center font-display text-[9px]"
          style={{
            background: done ? "#9bbc0f" : "transparent",
            border: "2px solid #5a4530",
            color: done ? "#0f380f" : "#8a7050",
          }}
        >
          {done ? "✓" : ""}
        </span>
        <span className={`font-retro text-sm tracking-wide ${done ? "line-through" : ""}`}>{label}</span>
        <span className="text-[9px] font-display text-mana opacity-80">[{tag}]</span>
      </div>
      <span className="text-xs font-display text-gold">{count}</span>
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
      className="p-3 pixel-panel transition-transform active:translate-x-[2px] active:translate-y-[2px]"
      style={{ borderColor: color }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl" style={{ imageRendering: "pixelated" }}>{emoji}</span>
      </div>
      <p className="font-display font-bold text-xs" style={{ color }}>
        {label}
      </p>
      <p className="text-[11px] text-muted mt-0.5 font-retro">{sublabel}</p>
    </Link>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="py-2"
      style={{
        background: "#0f380f",
        border: `2px solid ${color}`,
      }}
    >
      <p className="text-xl font-display font-black leading-none" style={{ color }}>
        {value}
      </p>
      <p className="text-[9px] text-muted font-display mt-1">{label}</p>
    </div>
  );
}
