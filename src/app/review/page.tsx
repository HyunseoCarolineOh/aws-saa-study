"use client";

import { useState, useEffect, useCallback } from "react";
import { getTodayReviewQuestionIds, getWrongAttemptsSummary, getStudyNotes, updateStudyNoteMemo, deleteStudyNote } from "@/lib/store";
import type { Question, StudyNote } from "@/lib/types";
import {
  CORRECTION_TYPE_LABELS,
  deleteCorrection,
  isCorrectionsEnabled,
  listPendingCorrections,
  type CorrectionRequest,
  type CorrectionType,
} from "@/lib/corrections";
import Link from "next/link";

const TYPE_BADGE_CLASS: Record<CorrectionType, string> = {
  translation_needed: "bg-info-bg text-info-fg border border-info-border",
  wrong_explanation: "bg-accent-bg text-accent-fg border border-accent-border",
  invalid_choice: "bg-warning-bg text-warning-fg border border-warning-border",
  wrong_answer: "bg-danger-bg text-danger-fg border border-danger-border",
  service_type_change: "bg-success-bg text-success-fg border border-success-border",
};

export default function ReviewPage() {
  const [activeTab, setActiveTab] = useState<"review" | "notes" | "corrections">("review");
  const [reviewIds, setReviewIds] = useState<string[]>([]);
  const [wrongSummary, setWrongSummary] = useState<{ questionId: string; lastAttemptAt: string; attemptCount: number }[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNote, setEditingNote] = useState<{ id: string; memo: string } | null>(null);
  const [corrections, setCorrections] = useState<CorrectionRequest[]>([]);
  const [correctionsLoading, setCorrectionsLoading] = useState(false);
  const [correctionsError, setCorrectionsError] = useState<string | null>(null);

  const correctionsEnabled = isCorrectionsEnabled();

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

  useEffect(() => {
    const ids = getTodayReviewQuestionIds();
    setReviewIds(ids);
    const summary = getWrongAttemptsSummary();
    setWrongSummary(summary);
    setNotes(getStudyNotes());

    fetch("/api/questions")
      .then((res) => res.json())
      .then((data) => setQuestions(data.questions))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === "corrections" && correctionsEnabled) {
      void refreshCorrections();
    }
  }, [activeTab, correctionsEnabled, refreshCorrections]);

  async function handleDeleteCorrection(id: number) {
    if (!confirm("이 수정 요청을 삭제할까요?")) return;
    try {
      await deleteCorrection(id);
      setCorrections((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "삭제 실패");
    }
  }

  function refreshNotes() {
    setNotes(getStudyNotes());
  }

  function handleDeleteNote(id: string) {
    if (!confirm("이 오답노트를 삭제할까요?")) return;
    deleteStudyNote(id);
    refreshNotes();
  }

  function handleSaveEdit() {
    if (!editingNote) return;
    updateStudyNoteMemo(editingNote.id, editingNote.memo.trim());
    setEditingNote(null);
    refreshNotes();
  }

  const wrongCount = wrongSummary.length;
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  // 검색 필터
  const filteredNotes = notes
    .filter((n) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return n.selectedText.toLowerCase().includes(q) || n.memo.toLowerCase().includes(q);
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const tabMeta = [
    { key: "review" as const, label: "복습", emoji: "🔄", grad: "linear-gradient(135deg, #ff6b9d, #c86fff)" },
    { key: "notes" as const, label: "노트", emoji: "📝", grad: "linear-gradient(135deg, #4adede, #7b61ff)", count: notes.length },
    { key: "corrections" as const, label: "수정요청", emoji: "⚠️", grad: "linear-gradient(135deg, #ffe156, #ffa040)", count: correctionsEnabled ? corrections.length : 0 },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <div className="mb-5">
        <p className="text-xs text-muted font-bold tracking-wide">TRAINING ZONE</p>
        <h1 className="text-2xl font-black text-jelly-pink">복습 공간 🔄</h1>
      </div>

      <div className="flex gap-1.5 mb-5 p-1.5 rounded-full" style={{ background: "rgba(15, 8, 35, 0.8)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
        {tabMeta.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2 text-xs font-black transition-all rounded-full flex items-center justify-center gap-1"
              style={
                active
                  ? {
                      background: tab.grad,
                      color: "#ffffff",
                      boxShadow: "0 4px 12px rgba(255, 107, 157, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
                    }
                  : { color: "var(--muted)" }
              }
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
              {tab.count && tab.count > 0 ? <span className="opacity-80">({tab.count})</span> : null}
            </button>
          );
        })}
      </div>

      {activeTab === "review" && (
        <>
          <div className="jelly-card p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div
                className="rounded-2xl py-3"
                style={{
                  background: "linear-gradient(135deg, rgba(255, 77, 143, 0.1), transparent)",
                  border: "1px solid rgba(255, 77, 143, 0.3)",
                }}
              >
                <p className="text-2xl font-black text-jelly-pink">{wrongCount}</p>
                <p className="text-[11px] text-muted font-bold mt-0.5">💥 틀린 문제</p>
              </div>
              <div
                className="rounded-2xl py-3"
                style={{
                  background: "linear-gradient(135deg, rgba(255, 225, 86, 0.1), transparent)",
                  border: "1px solid rgba(255, 225, 86, 0.3)",
                }}
              >
                <p className="text-2xl font-black text-warning-fg">{reviewIds.length}</p>
                <p className="text-[11px] text-muted font-bold mt-0.5">🔄 오늘 복습</p>
              </div>
            </div>
          </div>

          {reviewIds.length > 0 ? (
            <Link
              href="/questions?mode=review"
              className="block w-full text-center py-4 rounded-[20px] font-black text-on-primary mb-6 active:scale-[0.97] active:translate-y-1 transition-all"
              style={{
                background: "linear-gradient(135deg, #ffa040, #ff6b9d)",
                boxShadow:
                  "0 12px 28px -4px rgba(255, 160, 64, 0.45), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.15)",
              }}
            >
              🔄 복습 시작! ({reviewIds.length}문제)
            </Link>
          ) : (
            <div className="text-center py-10 text-muted mb-6">
              <p className="text-4xl mb-3">🌸</p>
              <p className="text-sm font-black text-jelly-lime mb-2">오늘은 복습할 게 없어요!</p>
              <p className="text-xs font-bold">문제 풀러 가볼까요?</p>
              <Link href="/questions" className="inline-block mt-4 text-jelly-pink font-black text-sm">
                ⚔️ 문제 풀러 가기 →
              </Link>
            </div>
          )}

          {!loading && wrongSummary.length > 0 && (
            <div>
              <h2 className="text-xs font-black mb-3 text-jelly-purple tracking-wider">💥 틀린 문제 목록</h2>
              <div className="space-y-2">
                {wrongSummary
                  .sort((a, b) => b.lastAttemptAt.localeCompare(a.lastAttemptAt))
                  .map((item) => {
                    const q = questionMap.get(item.questionId);
                    const isReviewDue = reviewIds.includes(item.questionId);
                    return (
                      <div
                        key={item.questionId}
                        className="rounded-2xl p-3"
                        style={
                          isReviewDue
                            ? {
                                background: "linear-gradient(135deg, rgba(255, 160, 64, 0.12), rgba(255, 107, 157, 0.08))",
                                border: "1.5px solid rgba(255, 160, 64, 0.4)",
                              }
                            : {
                                background: "rgba(26, 18, 56, 0.7)",
                                border: "1px solid rgba(255, 255, 255, 0.06)",
                              }
                        }
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs leading-relaxed line-clamp-2 flex-1">
                            {q ? q.question_text.slice(0, 100) + (q.question_text.length > 100 ? "..." : "") : item.questionId}
                          </p>
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span className="text-[10px] text-jelly-pink font-black">×{item.attemptCount} 실패</span>
                            {isReviewDue && (
                              <span className="text-[10px] text-accent-fg font-black mt-0.5">🔄 오늘 복습</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "notes" && (
        <>
          {notes.length > 0 && (
            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 노트 검색..."
                className="w-full rounded-full px-4 py-3 text-sm focus:outline-none transition-colors"
                style={{
                  background: "rgba(26, 18, 56, 0.85)",
                  border: "1.5px solid rgba(74, 222, 222, 0.35)",
                  color: "var(--foreground)",
                }}
              />
            </div>
          )}

          {filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-muted">
              {notes.length === 0 ? (
                <>
                  <div className="text-5xl mb-3">📝</div>
                  <p className="text-lg font-black text-jelly-purple mb-2">노트가 비어있어요!</p>
                  <p className="text-sm font-bold">문제 풀이 중 텍스트를 드래그해서 저장해요</p>
                  <Link href="/questions" className="inline-block mt-4 text-jelly-pink font-black text-sm">
                    ⚔️ 문제 풀러 가기 →
                  </Link>
                </>
              ) : (
                <p className="text-sm font-bold">검색 결과가 없어요 🔍</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map((note) => {
                const q = questionMap.get(note.questionId);
                const isEditing = editingNote?.id === note.id;
                const sourceLabel =
                  note.sourceContext === "question" ? "문제" : note.sourceContext === "explanation" ? "해설" : "상세 풀이";

                return (
                  <div key={note.id} className="jelly-card p-4 space-y-2">
                    <div
                      className="rounded-2xl px-3 py-2"
                      style={{
                        background: "linear-gradient(135deg, rgba(255, 225, 86, 0.12), rgba(255, 160, 64, 0.08))",
                        borderLeft: "3px solid var(--jelly-yellow)",
                      }}
                    >
                      <p className="text-xs leading-relaxed" style={{ color: "var(--warning-fg)" }}>
                        {note.selectedText}
                      </p>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingNote.memo}
                          onChange={(e) => setEditingNote({ ...editingNote, memo: e.target.value })}
                          className="w-full rounded-2xl px-3 py-2 text-xs leading-relaxed resize-none focus:outline-none"
                          style={{
                            background: "rgba(15, 8, 35, 0.8)",
                            border: "1.5px solid rgba(74, 222, 222, 0.4)",
                            color: "var(--foreground)",
                          }}
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingNote(null)}
                            className="text-[10px] text-muted px-3 py-1 rounded-full font-black"
                            style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border)" }}
                          >
                            취소
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="text-[10px] px-3 py-1 rounded-full font-black text-on-primary"
                            style={{
                              background: "linear-gradient(135deg, #7bff9a, #4adede)",
                              color: "#0d0823",
                              boxShadow: "0 3px 8px rgba(123, 255, 154, 0.3)",
                            }}
                          >
                            ✓ 저장
                          </button>
                        </div>
                      </div>
                    ) : (
                      note.memo && <p className="text-xs text-muted leading-relaxed pl-1">{note.memo}</p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-black flex-shrink-0 text-on-primary"
                          style={{ background: "linear-gradient(135deg, #c86fff, #7b61ff)" }}
                        >
                          {sourceLabel}
                        </span>
                        {q && (
                          <span className="text-[10px] text-muted truncate">
                            {q.question_text.slice(0, 40)}...
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-[10px] text-muted">
                          {new Date(note.createdAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                        </span>
                        {!isEditing && (
                          <>
                            <button
                              onClick={() => setEditingNote({ id: note.id, memo: note.memo })}
                              className="text-[10px] text-jelly-pink font-black"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-[10px] font-black"
                              style={{ color: "var(--danger-fg)" }}
                            >
                              삭제
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === "corrections" && (
        <>
          {!correctionsEnabled ? (
            <div
              className="rounded-2xl p-4 text-sm"
              style={{
                background: "linear-gradient(135deg, rgba(255, 225, 86, 0.12), rgba(255, 160, 64, 0.08))",
                border: "1.5px solid rgba(255, 225, 86, 0.4)",
                color: "var(--warning-fg)",
              }}
            >
              <p className="font-black mb-1">⚠️ Supabase 미설정</p>
              <p className="text-xs leading-relaxed font-bold">
                <code className="bg-card px-1 rounded">.env.local</code>에
                <code className="bg-card px-1 rounded ml-1">NEXT_PUBLIC_SUPABASE_URL</code>,
                <code className="bg-card px-1 rounded ml-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>를 설정한 뒤 재로드.
              </p>
            </div>
          ) : correctionsLoading ? (
            <p className="text-sm text-muted text-center py-8 font-bold animate-jelly-bounce">🎀 불러오는 중...</p>
          ) : correctionsError ? (
            <div
              className="rounded-2xl p-3 text-sm"
              style={{
                background: "rgba(255, 77, 143, 0.1)",
                border: "1.5px solid rgba(255, 77, 143, 0.4)",
                color: "var(--danger-fg)",
              }}
            >
              💥 로드 실패: {correctionsError}
              <button onClick={() => void refreshCorrections()} className="block mt-2 text-xs underline font-black">
                다시 시도
              </button>
            </div>
          ) : corrections.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <p className="text-4xl mb-3">🌸</p>
              <p className="text-lg font-black text-jelly-lime mb-2">처리할 요청이 없어요!</p>
              <p className="text-sm font-bold">모바일에서 ⚠ 버튼으로 신고할 수 있어요</p>
            </div>
          ) : (
            <>
              <div
                className="rounded-2xl p-3 mb-3 text-xs leading-relaxed"
                style={{
                  background: "linear-gradient(135deg, rgba(74, 222, 222, 0.12), rgba(200, 111, 255, 0.08))",
                  border: "1.5px solid rgba(74, 222, 222, 0.35)",
                  color: "var(--info-fg)",
                }}
              >
                💡 터미널에서 Claude Code에게 <span className="font-mono bg-card px-1">수정 요청 처리해줘</span>라고 말하면
                아래 {corrections.length}건을 순서대로 처리해요.
              </div>
              <div className="space-y-3">
                {corrections.map((c) => {
                  const q = questionMap.get(c.question_id);
                  return (
                    <div key={c.id} className="jelly-card p-3 space-y-2">
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${TYPE_BADGE_CLASS[c.report_type]}`}>
                          {CORRECTION_TYPE_LABELS[c.report_type]}
                        </span>
                        {c.option_label && (
                          <span className="text-[10px] text-muted bg-muted-bg px-2 py-0.5 rounded-full font-black">
                            선지 {c.option_label}
                          </span>
                        )}
                        <span className="text-[10px] text-muted bg-muted-bg px-2 py-0.5 rounded-full font-mono">
                          {c.question_id}
                        </span>
                      </div>
                      {q ? (
                        <p className="text-xs leading-relaxed line-clamp-2">
                          {q.question_text.slice(0, 120)}
                          {q.question_text.length > 120 ? "..." : ""}
                        </p>
                      ) : (
                        <p className="text-xs text-muted italic">문제 데이터를 찾을 수 없어요</p>
                      )}
                      {c.selected_text && (
                        <div
                          className="rounded-2xl px-3 py-2"
                          style={{
                            background: "rgba(255, 225, 86, 0.12)",
                            borderLeft: "3px solid var(--jelly-yellow)",
                          }}
                        >
                          <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: "var(--warning-fg)" }}>
                            {c.selected_text}
                          </p>
                        </div>
                      )}
                      {c.description && <p className="text-xs text-muted leading-relaxed pl-1">{c.description}</p>}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-muted">
                          {new Date(c.created_at).toLocaleString("ko-KR", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <button
                          onClick={() => void handleDeleteCorrection(c.id)}
                          className="text-[10px] font-black"
                          style={{ color: "var(--danger-fg)" }}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
