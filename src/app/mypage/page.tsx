"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useExam } from "@/contexts/ExamContext";
import type { ExamType } from "@/lib/types";
import { getDailyStats, getStreak, getWrongAttemptsSummary } from "@/lib/store";
import {
  CORRECTION_TYPE_LABELS,
  deleteCorrection,
  isCorrectionsEnabled,
  listPendingCorrections,
  type CorrectionRequest,
  type CorrectionType,
} from "@/lib/corrections";
import { CHANGELOG } from "@/lib/changelog";

const TYPE_BADGE_CLASS: Record<CorrectionType, string> = {
  translation_needed: "bg-info-bg text-info-fg border border-info-border",
  wrong_explanation: "bg-accent-bg text-accent-fg border border-accent-border",
  invalid_choice: "bg-warning-bg text-warning-fg border border-warning-border",
  wrong_answer: "bg-danger-bg text-danger-fg border border-danger-border",
  service_type_change: "bg-success-bg text-success-fg border border-success-border",
  wrong_question: "bg-danger-bg text-danger-fg border border-danger-border",
};

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

  // 수정 요청 상태
  const [correctionsOpen, setCorrectionsOpen] = useState(false);
  const [corrections, setCorrections] = useState<CorrectionRequest[]>([]);
  const [correctionsLoading, setCorrectionsLoading] = useState(false);
  const [correctionsError, setCorrectionsError] = useState<string | null>(null);
  const correctionsEnabled = isCorrectionsEnabled();

  // 업데이트 로그 상태
  const [changelogOpen, setChangelogOpen] = useState(false);

  const stats = getDailyStats();
  const streak = getStreak();
  const totalSolved = stats.reduce((sum, s) => sum + s.questions_solved, 0);
  const totalCorrect = stats.reduce((sum, s) => sum + s.correct_count, 0);
  const wrongCount = getWrongAttemptsSummary().length;
  const accuracy = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;

  const refreshCorrections = useCallback(async () => {
    if (!correctionsEnabled) return;
    setCorrectionsLoading(true);
    setCorrectionsError(null);
    try {
      const rows = await listPendingCorrections();
      setCorrections(rows);
    } catch (e) {
      setCorrectionsError(e instanceof Error ? e.message : "로드 실패");
    } finally {
      setCorrectionsLoading(false);
    }
  }, [correctionsEnabled]);

  async function handleToggleCorrections() {
    const next = !correctionsOpen;
    setCorrectionsOpen(next);
    if (next && corrections.length === 0 && !correctionsLoading) {
      await refreshCorrections();
    }
  }

  async function handleDeleteCorrection(id: number) {
    if (!confirm("이 수정 요청을 삭제할까요?")) return;
    try {
      await deleteCorrection(id);
      setCorrections((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "삭제 실패");
    }
  }

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

      {/* 수정 요청 관리 */}
      <div className="bg-gray-800/50 rounded-2xl mb-4 overflow-hidden">
        <button
          onClick={() => void handleToggleCorrections()}
          className="w-full flex items-center justify-between px-5 py-4"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">수정 요청 관리</span>
            {correctionsEnabled && corrections.length > 0 && (
              <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                {corrections.length}건
              </span>
            )}
          </div>
          <span className="text-gray-400 text-sm">{correctionsOpen ? "▲" : "▼"}</span>
        </button>

        {correctionsOpen && (
          <div className="px-5 pb-5">
            {!correctionsEnabled ? (
              <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs rounded-xl p-3 leading-relaxed">
                <p className="font-medium mb-1">Supabase 미설정</p>
                <p>
                  <code className="bg-gray-900 px-1 rounded">.env.local</code>에{" "}
                  <code className="bg-gray-900 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
                  <code className="bg-gray-900 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>를
                  설정한 뒤 다시 로드하세요.
                </p>
              </div>
            ) : correctionsLoading ? (
              <p className="text-sm text-gray-400 text-center py-4">불러오는 중...</p>
            ) : correctionsError ? (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl p-3">
                로드 실패: {correctionsError}
                <button
                  onClick={() => void refreshCorrections()}
                  className="block mt-2 underline"
                >
                  다시 시도
                </button>
              </div>
            ) : corrections.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">처리할 수정 요청이 없습니다</p>
            ) : (
              <>
                <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs rounded-xl p-3 mb-3 leading-relaxed">
                  터미널에서 Claude Code에게{" "}
                  <span className="font-mono bg-gray-900 px-1 rounded">수정 요청 처리해줘</span>라고 말하면
                  아래 {corrections.length}건을 순서대로 처리합니다.
                </div>
                <div className="space-y-3">
                  {corrections.map((c) => (
                    <div key={c.id} className="bg-gray-700/50 rounded-xl border border-gray-600 p-3 space-y-2">
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${TYPE_BADGE_CLASS[c.report_type]}`}>
                          {CORRECTION_TYPE_LABELS[c.report_type]}
                        </span>
                        {c.option_label && (
                          <span className="text-[10px] text-gray-400 bg-gray-600 px-1.5 py-0.5 rounded">
                            선지 {c.option_label}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 bg-gray-600 px-1.5 py-0.5 rounded font-mono">
                          {c.question_id}
                        </span>
                      </div>
                      {c.selected_text && (
                        <div className="bg-yellow-500/10 border-l-4 border-yellow-500 px-2 py-1 rounded-r">
                          <p className="text-[11px] text-yellow-400 leading-relaxed line-clamp-2">{c.selected_text}</p>
                        </div>
                      )}
                      {c.description && (
                        <p className="text-xs text-gray-400 leading-relaxed">{c.description}</p>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-gray-500">
                          {new Date(c.created_at).toLocaleString("ko-KR", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <button
                          onClick={() => void handleDeleteCorrection(c.id)}
                          className="text-[10px] text-red-400 font-medium"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 업데이트 로그 */}
      <div className="bg-gray-800/50 rounded-2xl mb-4 overflow-hidden">
        <button
          onClick={() => setChangelogOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4"
        >
          <span className="text-sm font-semibold text-white">업데이트 로그</span>
          <span className="text-gray-400 text-sm">{changelogOpen ? "▲" : "▼"}</span>
        </button>

        {changelogOpen && (
          <div className="px-5 pb-5 space-y-4">
            {CHANGELOG.map((entry) => (
              <div key={entry.version}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded">
                    {entry.version}
                  </span>
                  <span className="text-xs text-gray-500">{entry.date}</span>
                </div>
                <ul className="space-y-1">
                  {entry.changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                      <span className="text-gray-500 mt-0.5 flex-shrink-0">•</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
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
