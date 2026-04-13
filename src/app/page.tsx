import Link from "next/link";
import ServiceResumeCard from "@/components/ServiceResumeCard";

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
    return { phase: "1주차: 개념 정리", desc: "도메인별 핵심 개념 카드 학습", color: "bg-blue-500" };
  if (day <= 7)
    return { phase: "1주차: 사고력 훈련", desc: "시나리오 문제 풀이 (매일 20-30문제)", color: "bg-indigo-500" };
  if (day <= 12)
    return { phase: "2주차: 실전 문제", desc: "덤프 문제 집중 풀이 (매일 40-50문제)", color: "bg-purple-500" };
  return { phase: "2주차: 모의시험", desc: "모의시험 + 최종 약점 보강", color: "bg-red-500" };
}

export default function Dashboard() {
  const { currentDay, daysLeft, progress } = getDayInfo();
  const { phase, desc, color } = getWeekPhase(currentDay);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">AWS SAA-C03</h1>
        <p className="text-muted text-sm">2주 완성 학습 도구</p>
      </div>

      {/* D-Day 카드 */}
      <Link href="/curriculum" className={`block ${color} text-white rounded-2xl p-5 mb-4 shadow-lg`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-sm opacity-80">현재 진행</p>
            <p className="text-xl font-bold">Day {currentDay} / {STUDY_DAYS}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">D-{daysLeft}</p>
            <p className="text-xs opacity-80">남은 일수</p>
          </div>
        </div>
        <div className="bg-white/20 rounded-full h-2 mb-2">
          <div className="bg-white rounded-full h-2 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-sm font-medium">{phase}</p>
        <p className="text-xs opacity-80">{desc}</p>
      </Link>

      {/* 오늘의 학습 목표 */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        <h2 className="font-semibold mb-3">오늘의 학습 목표</h2>
        <div className="space-y-2">
          <TodoItem label="개념 카드 학습" count="10개" done={false} />
          <TodoItem label="문제 풀이" count="30문제" done={false} />
          <TodoItem label="오답 복습" count="5문제" done={false} />
        </div>
      </div>

      {/* 서비스 문제 이어서 풀기 */}
      <ServiceResumeCard />

      {/* 퀵 액션 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <QuickAction href="/questions" label="문제 풀기" sublabel="랜덤 출제" />
        <QuickAction href="/review" label="오답 복습" sublabel="오늘 복습할 문제" />
        <QuickAction href="/mock-exam" label="모의시험" sublabel="65문제 / 130분" />
        <QuickAction href="/concepts" label="개념 사전" sublabel="AWS 서비스 검색" />
      </div>

      {/* 학습 요약 */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h2 className="font-semibold mb-3">학습 현황</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <StatBox label="풀은 문제" value="0" />
          <StatBox label="정답률" value="0%" />
          <StatBox label="연속일" value="0일" />
        </div>
      </div>
    </div>
  );
}

function TodoItem({ label, count, done }: { label: string; count: string; done: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${done ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-2">
        <div
          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
            done ? "bg-green-600 border-green-600" : "border-gray-400"
          }`}
        >
          {done && <span className="text-white text-xs">&#x2713;</span>}
        </div>
        <span className={`text-sm ${done ? "line-through" : ""}`}>{label}</span>
      </div>
      <span className="text-xs text-muted">{count}</span>
    </div>
  );
}

function QuickAction({ href, label, sublabel }: { href: string; label: string; sublabel: string }) {
  return (
    <Link
      href={href}
      className="bg-card rounded-xl border border-border p-4 hover:border-primary transition-colors active:scale-[0.98]"
    >
      <p className="font-medium text-sm">{label}</p>
      <p className="text-xs text-muted">{sublabel}</p>
    </Link>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
