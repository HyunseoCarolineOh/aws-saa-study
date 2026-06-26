"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useExam } from "@/contexts/ExamContext";
import type { ExamType } from "@/lib/types";
import { getDailyStats, getStreak, getWrongAttemptsSummary } from "@/lib/store";

export default function MyPage() {
  const router = useRouter();
  const { user, nickname, signOut, refreshNickname } = useAuth();
  const { currentExam, examConfig, setExam } = useExam();
  const [editingNickname, setEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState(nickname || "");
  const [nicknameError, setNicknameError] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const stats = getDailyStats();
  const streak = getStreak();
  const totalSolved = stats.reduce((sum, s) => sum + s.questions_solved, 0);
  const totalCorrect = stats.reduce((sum, s) => sum + s.correct_count, 0);
  const wrongCount = getWrongAttemptsSummary().length;
  const accuracy = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;

  async function handleNicknameSave() {
    const trimmed = newNickname.trim();
    if (trimmed.length < 2) {
      setNicknameError("2자 이상 입력해주세요.");
      return;
    }
    setSavingNickname(true);
    const { createClient } = await import("@/lib/supabase");
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user!.id, nickname: trimmed });
    if (!error) {
      await refreshNickname();
      setEditingNickname(false);
      setNicknameError("");
    }
    setSavingNickname(false);
  }

  async function handleFeedbackSubmit() {
    const trimmed = feedback.trim();
    if (!trimmed || !user) return;
    setFeedbackLoading(true);
    const { createClient } = await import("@/lib/supabase");
    const supabase = createClient();
    await supabase.from("saa_feedback").insert({ user_id: user.id, message: trimmed });
    setFeedback("");
    setFeedbackSent(true);
    setFeedbackLoading(false);
    setTimeout(() => setFeedbackSent(false), 3000);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      {/* 시험 배지 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">마이페이지</h1>
        <span className="text-xs font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full">
          {examConfig.shortLabel}
        </span>
      </div>

      {/* 프로필 */}
      <div className="bg-gray-800/50 rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-1">
          {editingNickname ? (
            <div className="flex gap-2 items-center flex-1 mr-2">
              <input
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-blue-500"
                maxLength={20}
              />
              <button
                onClick={handleNicknameSave}
                disabled={savingNickname}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50"
              >
                저장
              </button>
              <button
                onClick={() => { setEditingNickname(false); setNicknameError(""); }}
                className="px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 text-sm"
              >
                취소
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">{nickname || "닉네임 없음"}</span>
              <button
                onClick={() => { setEditingNickname(true); setNewNickname(nickname || ""); }}
                className="text-xs text-gray-400 hover:text-gray-200"
              >
                수정
              </button>
            </div>
          )}
        </div>
        {nicknameError && <p className="text-red-400 text-xs mt-1">{nicknameError}</p>}
        <p className="text-sm text-gray-400">{user?.email}</p>
      </div>

      {/* 학습 통계 */}
      <div className="bg-gray-800/50 rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">{examConfig.shortLabel} 학습 통계</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="연속 학습일" value={`${streak}일`} />
          <StatCard label="총 풀이" value={`${totalSolved}문제`} />
          <StatCard label="정답률" value={`${accuracy}%`} />
          <StatCard label="오답" value={`${wrongCount}문제`} />
        </div>
      </div>

      {/* 시험 전환 */}
      <div className="bg-gray-800/50 rounded-2xl px-5 py-4 mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-white">시험 전환</span>
        <div className="flex rounded-xl overflow-hidden border border-gray-700">
          {(["SAA-C03", "CLF-C02"] as ExamType[]).map((exam) => (
            <button
              key={exam}
              onClick={() => setExam(exam)}
              className={`px-3 py-1.5 text-xs font-mono transition-colors ${
                currentExam === exam
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {exam}
            </button>
          ))}
        </div>
      </div>

      {/* 건의사항 */}
      <div className="bg-gray-800/50 rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-white mb-3">개발자에게 건의사항</h2>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="불편한 점, 개선 사항을 알려주세요"
          maxLength={500}
          rows={4}
          className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">{feedback.length}/500</span>
          <button
            onClick={handleFeedbackSubmit}
            disabled={feedbackLoading || feedback.trim().length === 0}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {feedbackLoading ? "전송 중..." : feedbackSent ? "전송됐습니다" : "전송"}
          </button>
        </div>
      </div>

      {/* 로그아웃 */}
      <button
        onClick={handleSignOut}
        className="w-full py-3 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors"
      >
        로그아웃
      </button>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-700/50 rounded-xl p-4">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}
