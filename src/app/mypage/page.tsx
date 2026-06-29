"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useExam } from "@/contexts/ExamContext";
import { getAttempts, getDailyStats, getStreak } from "@/lib/store";
import { createBrowserClient } from "@/lib/supabase";
import { validateNickname, checkNicknameAvailability, saveNickname } from "@/lib/nickname";
import MessageForm from "@/components/MessageForm";
import ExamSelector from "@/components/ExamSelector";
import type { Attempt, DailyStats } from "@/lib/types";

export default function MyPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const examContext = useExam();

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [streak, setStreak] = useState(0);
  const [nickname, setNickname] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // 닉네임 수정 모드 상태
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);
  const [nicknameChecking, setNicknameChecking] = useState(false);
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const nicknameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load local data
  useEffect(() => {
    setAttempts(getAttempts());
    setDailyStats(getDailyStats());
    setStreak(getStreak());
  }, []);

  // Fetch nickname from profiles table
  useEffect(() => {
    async function fetchNickname() {
      if (!user) {
        setLoadingProfile(false);
        return;
      }
      try {
        const supabase = createBrowserClient();
        const { data } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", user.id)
          .single();
        setNickname(data?.nickname ?? null);
      } catch {
        // Ignore errors - nickname will show as null
      } finally {
        setLoadingProfile(false);
      }
    }
    fetchNickname();
  }, [user]);

  // 닉네임 수정 모드 진입
  function startEditNickname() {
    setEditNickname(nickname ?? "");
    setNicknameError(null);
    setNicknameAvailable(null);
    setIsEditingNickname(true);
  }

  // 닉네임 수정 취소
  function cancelEditNickname() {
    setIsEditingNickname(false);
    setEditNickname("");
    setNicknameError(null);
    setNicknameAvailable(null);
    if (nicknameDebounceRef.current) {
      clearTimeout(nicknameDebounceRef.current);
      nicknameDebounceRef.current = null;
    }
  }

  // 디바운스된 닉네임 중복 확인
  const checkAvailability = useCallback(async (value: string) => {
    // 현재 닉네임과 동일하면 중복 체크 스킵
    if (value === nickname) {
      setNicknameAvailable(true);
      setNicknameError(null);
      setNicknameChecking(false);
      return;
    }
    setNicknameChecking(true);
    const available = await checkNicknameAvailability(value);
    setNicknameChecking(false);

    if (!available) {
      setNicknameAvailable(false);
      setNicknameError("이미 사용 중인 닉네임입니다");
    } else {
      setNicknameAvailable(true);
      setNicknameError(null);
    }
  }, [nickname]);

  // 닉네임 입력 변경 핸들러
  function handleNicknameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setEditNickname(value);
    setNicknameAvailable(null);

    if (nicknameDebounceRef.current) {
      clearTimeout(nicknameDebounceRef.current);
      nicknameDebounceRef.current = null;
    }

    if (value.length === 0) {
      setNicknameError(null);
      return;
    }

    const validation = validateNickname(value);

    if (!validation.isValid) {
      switch (validation.error) {
        case "too_short":
          setNicknameError("2자 이상 입력해주세요");
          break;
        case "too_long":
          setNicknameError("12자 이하로 입력해주세요");
          break;
        case "invalid_chars":
          setNicknameError("한글, 영문, 숫자만 가능합니다");
          break;
        default:
          setNicknameError(null);
      }
      return;
    }

    setNicknameError(null);
    nicknameDebounceRef.current = setTimeout(() => {
      checkAvailability(value);
    }, 300);
  }

  // 닉네임 저장
  async function handleNicknameSave() {
    if (isNicknameSaveDisabled) return;

    setNicknameSaving(true);
    const result = await saveNickname(editNickname);

    if (result.success) {
      setNickname(editNickname);
      setIsEditingNickname(false);
      setEditNickname("");
      setNicknameError(null);
      setNicknameAvailable(null);
    } else {
      setNicknameError(result.error || "닉네임 저장에 실패했습니다");
    }
    setNicknameSaving(false);
  }

  // 저장 버튼 비활성화 조건
  const isNicknameSaveDisabled =
    editNickname.length === 0 ||
    nicknameError !== null ||
    nicknameAvailable !== true ||
    nicknameChecking ||
    nicknameSaving;

  // Compute stats
  const totalSolved = new Set(attempts.map((a) => a.question_id)).size;
  const totalAttempts = attempts.length;
  const correctCount = attempts.filter((a) => a.is_correct).length;
  const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
  const avgTime =
    totalAttempts > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.time_spent_seconds, 0) / totalAttempts)
      : 0;

  // Sort daily stats descending
  const sortedDailyStats = [...dailyStats].sort((a, b) =>
    b.study_date.localeCompare(a.study_date)
  );

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24 space-y-6">
      {/* 현재 시험 표시 */}
      {examContext && (
        <section className="bg-card rounded-lg border border-border p-4 flex items-center gap-3">
          <span className="text-2xl">
            {examContext.currentExam === "CLF-C02" ? "☁️" : "🏗️"}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">
                {examContext.currentExam}
              </span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary-light">
                {examContext.currentExam === "CLF-C02" ? "Foundational" : "Associate"}
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              {examContext.examConfig.label}
            </p>
          </div>
        </section>
      )}

      {/* 프로필 섹션 */}
      <section className="bg-card rounded-lg border border-border p-4">
        <h2 className="font-semibold mb-3">프로필</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">이메일</span>
            <span>{user?.email ?? "-"}</span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-muted">닉네임</span>
            {isEditingNickname ? (
              <div className="flex flex-col items-end gap-1.5">
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="2~12자 한글, 영문, 숫자"
                  value={editNickname}
                  onChange={handleNicknameChange}
                  maxLength={12}
                  className={`w-40 rounded border bg-background px-2 py-1 text-sm text-foreground placeholder:text-muted outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary ${
                    nicknameError
                      ? "border-danger"
                      : nicknameAvailable === true
                      ? "border-green-500"
                      : "border-border"
                  }`}
                />
                {nicknameError && (
                  <p className="text-xs text-danger-fg">{nicknameError}</p>
                )}
                {nicknameAvailable === true && !nicknameError && (
                  <p className="text-xs text-green-500">사용 가능한 닉네임입니다</p>
                )}
                {nicknameChecking && (
                  <p className="text-xs text-muted">중복 확인 중...</p>
                )}
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={handleNicknameSave}
                    disabled={isNicknameSaveDisabled}
                    className="px-3 py-1 text-xs font-medium rounded bg-primary text-on-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {nicknameSaving ? "저장 중..." : "저장"}
                  </button>
                  <button
                    onClick={cancelEditNickname}
                    className="px-3 py-1 text-xs font-medium rounded border border-border text-muted hover:bg-background transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>{loadingProfile ? "..." : nickname ?? "-"}</span>
                <button
                  onClick={startEditNickname}
                  className="text-xs text-primary hover:underline"
                >
                  수정
                </button>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-4 w-full py-2 bg-red-500/10 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/20 transition-colors"
        >
          로그아웃
        </button>
      </section>

      {/* 학습 통계 섹션 */}
      <section className="bg-card rounded-lg border border-border p-4">
        <h2 className="font-semibold mb-3">학습 통계</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="총 풀이 수" value={`${totalSolved}문제`} color="text-primary" />
          <StatCard
            label="정답률"
            value={`${accuracy}%`}
            color={accuracy >= 70 ? "text-green-400" : "text-red-400"}
          />
          <StatCard label="연속 학습일" value={`${streak}일`} color="text-blue-400" />
          <StatCard label="평균 풀이 시간" value={`${avgTime}초`} color="text-amber-400" />
        </div>
      </section>

      {/* 일별 학습 기록 섹션 */}
      <section className="bg-card rounded-lg border border-border p-4">
        <h2 className="font-semibold mb-3">일별 학습 기록</h2>
        {sortedDailyStats.length === 0 ? (
          <p className="text-sm text-muted text-center py-4">
            아직 학습 기록이 없습니다. 문제를 풀어보세요!
          </p>
        ) : (
          <div className="space-y-2">
            {sortedDailyStats.map((s) => (
              <div
                key={s.study_date}
                className="flex justify-between items-center py-2 border-b border-border last:border-0"
              >
                <span className="text-sm">{s.study_date}</span>
                <div className="flex gap-4 text-xs text-muted">
                  <span>{s.questions_solved}문제</span>
                  <span>
                    {s.questions_solved > 0
                      ? Math.round((s.correct_count / s.questions_solved) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 시험 종류 변경 섹션 */}
      <section className="bg-card rounded-lg border border-border p-4">
        <ExamSelector mode="switch" />
      </section>

      {/* 개발자에게 메시지 보내기 섹션 */}
      <section className="bg-card rounded-lg border border-border p-4">
        <h2 className="font-semibold mb-3">개발자에게 메시지 보내기</h2>
        <MessageForm />
      </section>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-background rounded-lg border border-border p-3 text-center">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}
