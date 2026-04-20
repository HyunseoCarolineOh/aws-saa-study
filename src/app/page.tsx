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
  if (day <= 3) return { phase: "기초 체력 올리기", desc: "도메인별 기본기 탄탄!", emoji: "🌱" };
  if (day <= 7) return { phase: "사고력 훈련", desc: "시나리오 문제로 레벨업!", emoji: "💪" };
  if (day <= 12) return { phase: "실전 스피드런", desc: "하루 40-50문제 몰아치기!", emoji: "🎯" };
  return { phase: "최종 미션!", desc: "보스전 + 약점 마무리", emoji: "🎆" };
}

export default function Dashboard() {
  const { currentDay, daysLeft, progress } = getDayInfo();
  const { phase, desc, emoji } = getWeekPhase(currentDay);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted font-bold tracking-wide">AWS SAA-C03</p>
          <h1 className="text-2xl font-black text-jelly-pink">SAA 모험 🎮</h1>
        </div>
        <StreakFlame days={0} />
      </div>

      {/* 플레이어 HUD */}
      <Link href="/curriculum" className="block jelly-card p-5 mb-4 transition-transform active:scale-[0.98]">
        <div className="flex items-center gap-4 mb-4">
          <LevelBadge level={currentDay} size="lg" />
          <div className="flex-1">
            <p className="text-xs font-bold tracking-wide mb-0.5" style={{ color: "#c4a4ff" }}>
              {emoji} 현재 챕터
            </p>
            <p className="text-lg font-black">{phase}</p>
            <p className="text-xs text-muted mt-0.5">{desc}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black leading-none text-jelly-pink">D-{daysLeft}</p>
            <p className="text-[10px] text-muted mt-1 font-bold">남은 날</p>
          </div>
        </div>
        <XPBar value={currentDay} max={STUDY_DAYS} label={`여정 진행도 (${progress}%)`} />
      </Link>

      {/* 오늘 미션 */}
      <div
        className="jelly-card p-5 mb-4"
        style={{
          background: "linear-gradient(135deg, rgba(74, 222, 222, 0.14), rgba(200, 111, 255, 0.1))",
          border: "1.5px solid rgba(74, 222, 222, 0.35)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-base text-jelly-teal">오늘의 미션 🎯</h2>
          <span className="text-[10px] text-muted font-bold">DAILY</span>
        </div>
        <div className="space-y-1">
          <TodoItem label="개념 학습" count="10개" emoji="📘" done={false} />
          <TodoItem label="문제 챌린지" count="30문제" emoji="⚡" done={false} />
          <TodoItem label="오답 복습" count="5문제" emoji="🔄" done={false} />
        </div>
      </div>

      <ServiceResumeCard />

      {/* 빠른 이동 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <QuickAction href="/questions" label="챌린지" sublabel="랜덤 출제" emoji="⚡" tint="pink" />
        <QuickAction href="/review" label="복습" sublabel="오답 재도전" emoji="🔄" tint="teal" />
        <QuickAction href="/mock-exam" label="보스전" sublabel="65문제 · 130분" emoji="👑" tint="purple" />
        <QuickAction href="/concepts" label="도감" sublabel="서비스 검색" emoji="📖" tint="yellow" />
      </div>

      {/* 스탯 */}
      <div className="jelly-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-base text-jelly-purple">나의 스탯 ✨</h2>
          <span className="text-[10px] text-muted font-bold">STATUS</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <StatBox label="클리어" value="0" emoji="⚔️" color="#ff6b9d" />
          <StatBox label="명중률" value="0%" emoji="🎯" color="#4adede" />
          <StatBox label="스트릭" value="0일" emoji="🔥" color="#ffa040" />
        </div>
      </div>
    </div>
  );
}

function TodoItem({ label, count, emoji, done }: { label: string; count: string; emoji: string; done: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 ${done ? "opacity-55" : ""}`}>
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
          style={{
            background: done ? "linear-gradient(135deg, #7bff9a, #4adede)" : "rgba(255, 255, 255, 0.04)",
            border: done ? "none" : "1.5px solid var(--border)",
            boxShadow: done ? "0 4px 12px rgba(123, 255, 154, 0.35)" : undefined,
          }}
        >
          {done ? "✓" : emoji}
        </div>
        <span className={`text-sm font-bold ${done ? "line-through text-muted" : "text-foreground"}`}>{label}</span>
      </div>
      <span className="text-xs text-muted font-black">{count}</span>
    </div>
  );
}

function QuickAction({
  href,
  label,
  sublabel,
  emoji,
  tint,
}: {
  href: string;
  label: string;
  sublabel: string;
  emoji: string;
  tint: "pink" | "teal" | "purple" | "yellow";
}) {
  const tintMap = {
    pink: "linear-gradient(135deg, #ff6b9d 0%, #c86fff 100%)",
    teal: "linear-gradient(135deg, #4adede 0%, #7b61ff 100%)",
    purple: "linear-gradient(135deg, #c86fff 0%, #7b61ff 100%)",
    yellow: "linear-gradient(135deg, #ffe156 0%, #ffa040 100%)",
  }[tint];
  const shadowMap = {
    pink: "0 10px 24px -6px rgba(255, 107, 157, 0.45)",
    teal: "0 10px 24px -6px rgba(74, 222, 222, 0.45)",
    purple: "0 10px 24px -6px rgba(200, 111, 255, 0.45)",
    yellow: "0 10px 24px -6px rgba(255, 225, 86, 0.4)",
  }[tint];
  return (
    <Link
      href={href}
      className="rounded-[24px] p-4 transition-all active:scale-[0.95] active:translate-y-1 text-on-primary"
      style={{
        background: tintMap,
        boxShadow: `${shadowMap}, inset 0 2px 0 rgba(255, 255, 255, 0.25), inset 0 -2px 0 rgba(0, 0, 0, 0.12)`,
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-3xl drop-shadow-md">{emoji}</span>
      </div>
      <p className="font-black text-base">{label}</p>
      <p className="text-[11px] opacity-90 mt-0.5 font-semibold">{sublabel}</p>
    </Link>
  );
}

function StatBox({ label, value, emoji, color }: { label: string; value: string; emoji: string; color: string }) {
  return (
    <div
      className="rounded-3xl py-3 px-1"
      style={{
        background: `${color}15`,
        border: `1.5px solid ${color}44`,
        boxShadow: `inset 0 2px 0 rgba(255,255,255,0.06)`,
      }}
    >
      <div className="text-xl mb-0.5">{emoji}</div>
      <p className="text-xl font-black" style={{ color }}>{value}</p>
      <p className="text-[10px] text-muted font-bold">{label}</p>
    </div>
  );
}
