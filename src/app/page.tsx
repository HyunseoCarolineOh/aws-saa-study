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
  if (day <= 3)
    return { phase: "개념 정복기", desc: "도메인별 핵심 카드로 기본기 챙기기", emoji: "🌱" };
  if (day <= 7)
    return { phase: "시나리오 훈련", desc: "하루 20-30문제씩 사고력 다지기", emoji: "🧩" };
  if (day <= 12)
    return { phase: "실전 러시", desc: "덤프 문제로 하루 40-50개 몰아치기", emoji: "🔥" };
  return { phase: "최종 보스전", desc: "모의시험 + 약점 마무리", emoji: "👑" };
}

export default function Dashboard() {
  const { currentDay, daysLeft, progress } = getDayInfo();
  const { phase, desc, emoji } = getWeekPhase(currentDay);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
      {/* 상단 타이틀 */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted font-semibold tracking-wider">AWS SAA-C03</p>
          <h1 className="text-2xl font-display font-black text-rose">SAA 모험일지 🍡</h1>
        </div>
        <StreakFlame days={0} />
      </div>

      {/* 플레이어 카드 (D-Day 히어로) */}
      <Link
        href="/curriculum"
        className="block rounded-3xl p-5 mb-4 relative overflow-hidden bubble-shadow wobble-hover"
        style={{
          background: "linear-gradient(135deg, #2e2849 0%, #25203a 100%)",
          border: "1px solid rgba(200,180,255,0.3)",
        }}
      >
        <div className="flex items-center gap-4 mb-4">
          <LevelBadge level={currentDay} size="lg" />
          <div className="flex-1">
            <p className="text-xs text-mint font-semibold tracking-wide mb-0.5">오늘의 챕터 {emoji}</p>
            <p className="text-lg font-display font-bold text-foreground">{phase}</p>
            <p className="text-xs text-muted">{desc}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-display font-black text-rose leading-none">D-{daysLeft}</p>
            <p className="text-[10px] text-muted mt-1">남은 여정</p>
          </div>
        </div>
        <XPBar value={currentDay} max={STUDY_DAYS} label={`여정 진행도 (${progress}%)`} />
      </Link>

      {/* 오늘의 퀘스트 */}
      <div
        className="rounded-3xl p-5 mb-4 bubble-shadow"
        style={{
          background: "linear-gradient(135deg, rgba(180,242,225,0.08), rgba(200,180,255,0.08))",
          border: "1px solid rgba(180,242,225,0.3)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-mint">오늘의 퀘스트 🎯</h2>
          <span className="text-[10px] text-muted font-semibold">DAILY</span>
        </div>
        <div className="space-y-1">
          <TodoItem label="개념 카드 학습" count="10개" emoji="📘" done={false} />
          <TodoItem label="문제 퀘스트" count="30문제" emoji="⚔️" done={false} />
          <TodoItem label="오답 재도전" count="5문제" emoji="🔄" done={false} />
        </div>
      </div>

      <ServiceResumeCard />

      {/* 빠른 이동 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <QuickAction href="/questions" label="퀘스트 시작" sublabel="랜덤 출제" emoji="⚔️" tint="rose" />
        <QuickAction href="/review" label="수련장" sublabel="오답 재도전" emoji="🔄" tint="mint" />
        <QuickAction href="/mock-exam" label="보스전" sublabel="65문제 / 130분" emoji="👑" tint="lavender" />
        <QuickAction href="/concepts" label="서비스 도감" sublabel="AWS 검색" emoji="📖" tint="lemon" />
      </div>

      {/* 스탯 창 */}
      <div
        className="rounded-3xl p-5 bubble-shadow"
        style={{
          background: "linear-gradient(135deg, rgba(255,180,198,0.05), rgba(168,220,255,0.05))",
          border: "1px solid rgba(200,180,255,0.22)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-lavender">나의 스탯 ✨</h2>
          <span className="text-[10px] text-muted font-semibold">STATUS</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <StatBox label="클리어" value="0" emoji="⚔️" tint="#ffb4c6" />
          <StatBox label="명중률" value="0%" emoji="🎯" tint="#b4f2e1" />
          <StatBox label="스트릭" value="0일" emoji="🔥" tint="#ffcba8" />
        </div>
      </div>
    </div>
  );
}

function TodoItem({ label, count, emoji, done }: { label: string; count: string; emoji: string; done: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 ${done ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-sm border-2"
          style={{
            background: done ? "rgba(180,242,225,0.3)" : "rgba(255,255,255,0.04)",
            borderColor: done ? "var(--pastel-mint)" : "var(--border)",
          }}
        >
          {done ? "✓" : emoji}
        </div>
        <span className={`text-sm font-medium ${done ? "line-through text-muted" : "text-foreground"}`}>{label}</span>
      </div>
      <span className="text-xs text-muted font-semibold">{count}</span>
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
  tint: "rose" | "mint" | "lavender" | "lemon";
}) {
  const tintMap = {
    rose: { bg: "rgba(255,180,198,0.12)", border: "rgba(255,180,198,0.35)", glow: "rgba(255,180,198,0.2)" },
    mint: { bg: "rgba(180,242,225,0.1)", border: "rgba(180,242,225,0.35)", glow: "rgba(180,242,225,0.2)" },
    lavender: { bg: "rgba(200,180,255,0.12)", border: "rgba(200,180,255,0.35)", glow: "rgba(200,180,255,0.2)" },
    lemon: { bg: "rgba(255,226,122,0.1)", border: "rgba(255,226,122,0.35)", glow: "rgba(255,226,122,0.2)" },
  }[tint];
  return (
    <Link
      href={href}
      className="rounded-3xl p-4 transition-all active:scale-[0.96] wobble-hover"
      style={{
        background: tintMap.bg,
        border: `1px solid ${tintMap.border}`,
        boxShadow: `0 6px 20px ${tintMap.glow}`,
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{emoji}</span>
      </div>
      <p className="font-display font-bold text-sm text-foreground">{label}</p>
      <p className="text-[11px] text-muted mt-0.5">{sublabel}</p>
    </Link>
  );
}

function StatBox({ label, value, emoji, tint }: { label: string; value: string; emoji: string; tint: string }) {
  return (
    <div
      className="rounded-2xl py-2.5 px-1"
      style={{
        background: `linear-gradient(180deg, ${tint}15, transparent)`,
        border: `1px solid ${tint}2e`,
      }}
    >
      <div className="text-lg mb-0.5">{emoji}</div>
      <p className="text-lg font-display font-black" style={{ color: tint }}>{value}</p>
      <p className="text-[10px] text-muted font-semibold">{label}</p>
    </div>
  );
}
