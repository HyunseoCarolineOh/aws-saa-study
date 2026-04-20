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
  if (day <= 3) return { tag: "CH.1", title: "기초 다지기", desc: "도메인별 핵심 개념 학습", color: "#9bbc0f" };
  if (day <= 7) return { tag: "CH.2", title: "사고력 훈련", desc: "시나리오 문제로 실력 다지기", color: "#5b9cd8" };
  if (day <= 12) return { tag: "CH.3", title: "실전 러시", desc: "덤프 문제 집중 풀이", color: "#c4a4e0" };
  return { tag: "CH.4", title: "최종 결전", desc: "모의시험 + 약점 보강", color: "#e86060" };
}

export default function Dashboard() {
  const { currentDay, daysLeft, progress } = getDayInfo();
  const { tag, title, desc, color } = getWeekPhase(currentDay);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-6">
      {/* 페이지 헤더 */}
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">SAA-C03 Adventure</p>
          <h1 className="page-title">모험일지</h1>
        </div>
        <StreakFlame days={0} />
      </header>

      {/* 플레이어 HUD — 유일한 pixel-window */}
      <Link href="/curriculum" className="block pixel-window p-4 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <LevelBadge level={currentDay} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="pixel-badge"
                style={{ background: `${color}22`, color, borderColor: `${color}88` }}
              >
                {tag}
              </span>
              <span className="section-title">{title}</span>
            </div>
            <p className="body-sub">{desc}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="stat-value-lg text-gold">D-{daysLeft}</p>
            <p className="pixel-label text-muted mt-1.5">LEFT</p>
          </div>
        </div>
        <XPBar value={currentDay} max={STUDY_DAYS} label="JOURNEY" />
      </Link>

      {/* 오늘의 퀘스트 */}
      <section className="pixel-panel p-4 mb-6">
        <div className="flex items-center justify-between mb-3 pb-2.5" style={{ borderBottom: "2px dashed var(--border)" }}>
          <h2 className="section-title text-gold">★ 오늘의 퀘스트</h2>
          <span className="section-tag">DAILY</span>
        </div>
        <ul className="space-y-0.5">
          <TodoItem label="개념 학습" count={10} unit="개" done={false} />
          <TodoItem label="문제 풀이" count={30} unit="문제" done={false} />
          <TodoItem label="오답 재도전" count={5} unit="문제" done={false} />
        </ul>
      </section>

      <ServiceResumeCard />

      {/* 메뉴 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <MenuTile href="/questions" title="문제 풀기" sub="랜덤 출제" emoji="⚔️" code="BATTLE" />
        <MenuTile href="/review" title="오답 복습" sub="재도전" emoji="🔄" code="REVENGE" />
        <MenuTile href="/mock-exam" title="모의고사" sub="65문제 · 130분" emoji="👑" code="BOSS" />
        <MenuTile href="/concepts" title="서비스 도감" sub="AWS 검색" emoji="📖" code="CODEX" />
      </div>

      {/* 스탯 */}
      <section className="pixel-panel p-4">
        <div className="flex items-center justify-between mb-3 pb-2.5" style={{ borderBottom: "2px dashed var(--border)" }}>
          <h2 className="section-title text-mana">▲ 스탯</h2>
          <span className="section-tag">STATUS</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatBox label="SOLVED" value="0" color="#9bbc0f" />
          <StatBox label="ACC %" value="0" color="#5b9cd8" />
          <StatBox label="STREAK" value="0" color="#e8b923" />
        </div>
      </section>
    </div>
  );
}

function TodoItem({ label, count, unit, done }: { label: string; count: number; unit: string; done: boolean }) {
  return (
    <li className="flex items-center justify-between py-2" style={{ opacity: done ? 0.45 : 1 }}>
      <div className="flex items-center gap-2.5">
        <span
          className="inline-flex w-5 h-5 items-center justify-center text-[10px]"
          style={{
            background: done ? "var(--gb-green)" : "transparent",
            border: "2px solid var(--border)",
            color: done ? "var(--gb-dark)" : "transparent",
            fontFamily: "var(--font-pixel)",
          }}
        >
          {done ? "✓" : ""}
        </span>
        <span className={`body-text ${done ? "line-through text-muted" : ""}`}>{label}</span>
      </div>
      <span className="stat-value-md text-gold">
        {count}
        <span className="body-sub ml-1 pixel-label">{unit}</span>
      </span>
    </li>
  );
}

function MenuTile({
  href,
  title,
  sub,
  emoji,
  code,
}: {
  href: string;
  title: string;
  sub: string;
  emoji: string;
  code: string;
}) {
  return (
    <Link
      href={href}
      className="pixel-panel p-4 transition-transform active:translate-x-[2px] active:translate-y-[2px]"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl leading-none">{emoji}</span>
        <span className="pixel-label text-muted">{code}</span>
      </div>
      <p className="section-title text-parchment leading-tight">{title}</p>
      <p className="caption mt-1">{sub}</p>
    </Link>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="py-3 text-center"
      style={{
        background: "var(--gb-dark)",
        border: `2px solid ${color}`,
      }}
    >
      <p className="stat-value-lg" style={{ color }}>
        {value}
      </p>
      <p className="pixel-label text-muted mt-2">{label}</p>
    </div>
  );
}
