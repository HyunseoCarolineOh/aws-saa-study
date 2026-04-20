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
    { key: "review" as const, label: "REMATCH", color: "#ff2e88" },
    { key: "notes" as const, label: "NOTES", color: "#00f0ff", count: notes.length },
    { key: "corrections" as const, label: "REPORT", color: "#ffee00", count: correctionsEnabled ? corrections.length : 0 },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <div className="mb-5">
        <p className="text-[10px] font-display text-neon-cyan tracking-[0.3em] neon-glow-cyan">TRAINING ZONE</p>
        <h1 className="text-xl font-display font-black text-neon-pink neon-glow-pink animate-flicker">&gt; REMATCH ROOM</h1>
      </div>

      <div className="flex gap-1.5 mb-5">
        {tabMeta.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2 text-[10px] font-display tracking-widest transition-all flex items-center justify-center gap-1"
              style={
                active
                  ? {
                      background: `${tab.color}18`,
                      color: tab.color,
                      border: `1.5px solid ${tab.color}99`,
                      boxShadow: `0 0 14px ${tab.color}55`,
                      textShadow: `0 0 6px ${tab.color}99`,
                    }
                  : {
                      background: "rgba(18, 7, 38, 0.6)",
                      color: "var(--muted)",
                      border: "1px solid var(--border)",
                    }
              }
            >
              <span>{tab.label}</span>
              {tab.count && tab.count > 0 ? <span className="opacity-80">({tab.count})</span> : null}
            </button>
          );
        })}
      </div>

      {activeTab === "review" && (
        <>
          <div
            className="p-4 mb-4"
            style={{
              background: "rgba(18, 7, 38, 0.9)",
              border: "1.5px solid rgba(168, 85, 255, 0.35)",
            }}
          >
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="py-2" style={{ background: "rgba(255, 46, 136, 0.08)", border: "1px solid rgba(255, 46, 136, 0.35)" }}>
                <p className="text-2xl font-display font-black text-neon-pink neon-glow-pink">{wrongCount}</p>
                <p className="text-[10px] text-muted font-display tracking-widest mt-0.5">MISSES</p>
              </div>
              <div className="py-2" style={{ background: "rgba(255, 238, 0, 0.08)", border: "1px solid rgba(255, 238, 0, 0.35)" }}>
                <p className="text-2xl font-display font-black text-neon-yellow" style={{ textShadow: "0 0 10px rgba(255, 238, 0, 0.7)" }}>
                  {reviewIds.length}
                </p>
                <p className="text-[10px] text-muted font-display tracking-widest mt-0.5">TODAY</p>
              </div>
            </div>
          </div>

          {reviewIds.length > 0 ? (
            <Link
              href="/questions?mode=review"
              className="block w-full text-center py-3.5 font-display font-bold tracking-widest mb-6 active:scale-[0.97] transition-all"
              style={{
                background: "linear-gradient(135deg, #ffee00, #ff2e88)",
                color: "#0a0514",
                boxShadow: "0 0 24px rgba(255, 46, 136, 0.5)",
              }}
            >
              &gt; REMATCH! ({reviewIds.length}Q)
            </Link>
          ) : (
            <div className="text-center py-10 mb-6">
              <p className="text-4xl mb-3 animate-flicker">✨</p>
              <p className="text-sm font-display tracking-widest text-neon-lime mb-2 neon-glow-lime">&gt; ALL CLEAR!</p>
              <p className="text-xs text-muted font-retro">재도전할 퀘스트 없음</p>
              <Link href="/questions" className="inline-block mt-4 text-neon-pink font-display text-xs tracking-widest neon-glow-pink">
                &gt; GO QUEST →
              </Link>
            </div>
          )}

          {!loading && wrongSummary.length > 0 && (
            <div>
              <h2 className="text-xs font-display tracking-widest text-accent-fg mb-3">&gt; MISS LIST</h2>
              <div className="space-y-2">
                {wrongSummary
                  .sort((a, b) => b.lastAttemptAt.localeCompare(a.lastAttemptAt))
                  .map((item) => {
                    const q = questionMap.get(item.questionId);
                    const isReviewDue = reviewIds.includes(item.questionId);
                    return (
                      <div
                        key={item.questionId}
                        className="p-3"
                        style={
                          isReviewDue
                            ? {
                                background: "rgba(255, 238, 0, 0.08)",
                                border: "1px solid rgba(255, 238, 0, 0.4)",
                              }
                            : {
                                background: "rgba(18, 7, 38, 0.6)",
                                border: "1px solid var(--border)",
                              }
                        }
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs leading-relaxed line-clamp-2 flex-1">
                            {q ? q.question_text.slice(0, 100) + (q.question_text.length > 100 ? "..." : "") : item.questionId}
                          </p>
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span className="text-[10px] text-neon-pink font-display">×{item.attemptCount} MISS</span>
                            {isReviewDue && (
                              <span className="text-[10px] text-neon-yellow font-display mt-0.5">&gt; TODAY</span>
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
                placeholder="> SEARCH NOTES..."
                className="w-full px-4 py-2.5 text-sm focus:outline-none font-retro tracking-wider"
                style={{
                  background: "rgba(18, 7, 38, 0.8)",
                  border: "1.5px solid rgba(0, 240, 255, 0.35)",
                  color: "var(--foreground)",
                }}
              />
            </div>
          )}

          {filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-muted">
              {notes.length === 0 ? (
                <>
                  <div className="text-5xl mb-3 animate-flicker">📝</div>
                  <p className="text-sm font-display tracking-widest text-neon-cyan neon-glow-cyan mb-2">&gt; NO NOTES</p>
                  <p className="text-xs font-retro tracking-wider">텍스트 드래그로 노트 저장 가능</p>
                  <Link href="/questions" className="inline-block mt-4 text-neon-pink font-display text-xs tracking-widest neon-glow-pink">
                    &gt; GO QUEST →
                  </Link>
                </>
              ) : (
                <p className="text-sm font-display tracking-widest">&gt; NO MATCH</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map((note) => {
                const q = questionMap.get(note.questionId);
                const isEditing = editingNote?.id === note.id;
                const sourceLabel =
                  note.sourceContext === "question" ? "QUESTION" : note.sourceContext === "explanation" ? "ANSWER" : "DETAIL";

                return (
                  <div
                    key={note.id}
                    className="p-3 space-y-2"
                    style={{
                      background: "rgba(18, 7, 38, 0.85)",
                      border: "1px solid rgba(168, 85, 255, 0.3)",
                    }}
                  >
                    <div
                      className="px-3 py-2"
                      style={{
                        background: "rgba(255, 238, 0, 0.08)",
                        borderLeft: "3px solid var(--neon-yellow)",
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
                          className="w-full px-3 py-2 text-xs leading-relaxed resize-none focus:outline-none"
                          style={{
                            background: "rgba(10, 5, 20, 0.9)",
                            border: "1.5px solid rgba(0, 240, 255, 0.4)",
                            color: "var(--foreground)",
                          }}
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingNote(null)}
                            className="text-[10px] font-display tracking-widest text-muted px-3 py-1"
                            style={{ background: "rgba(18, 7, 38, 0.6)", border: "1px solid var(--border)" }}
                          >
                            CANCEL
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="text-[10px] font-display tracking-widest px-3 py-1"
                            style={{ background: "#b4ff39", color: "#0a0514" }}
                          >
                            &gt; SAVE
                          </button>
                        </div>
                      </div>
                    ) : (
                      note.memo && <p className="text-xs text-muted leading-relaxed pl-1">{note.memo}</p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className="text-[9px] px-1.5 py-0.5 font-display tracking-widest flex-shrink-0"
                          style={{
                            background: "rgba(168, 85, 255, 0.15)",
                            color: "var(--accent-fg)",
                            border: "1px solid rgba(168, 85, 255, 0.4)",
                          }}
                        >
                          {sourceLabel}
                        </span>
                        {q && (
                          <span className="text-[10px] text-muted truncate font-retro">
                            {q.question_text.slice(0, 40)}...
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-[10px] text-muted font-retro">
                          {new Date(note.createdAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                        </span>
                        {!isEditing && (
                          <>
                            <button
                              onClick={() => setEditingNote({ id: note.id, memo: note.memo })}
                              className="text-[10px] text-neon-cyan font-display tracking-widest"
                            >
                              EDIT
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-[10px] font-display tracking-widest"
                              style={{ color: "var(--danger-fg)" }}
                            >
                              DEL
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
              className="p-4 text-sm"
              style={{
                background: "rgba(255, 238, 0, 0.08)",
                border: "1px solid rgba(255, 238, 0, 0.4)",
                color: "var(--warning-fg)",
              }}
            >
              <p className="font-display tracking-widest mb-1">&gt; SUPABASE NOT SET</p>
              <p className="text-xs leading-relaxed font-retro">
                <code className="bg-card px-1">.env.local</code>에 env 설정 후 재로드
              </p>
            </div>
          ) : correctionsLoading ? (
            <p className="text-sm text-muted text-center py-8 font-display tracking-widest animate-flicker">&gt; LOADING...</p>
          ) : correctionsError ? (
            <div
              className="p-3 text-sm font-retro"
              style={{
                background: "rgba(255, 46, 136, 0.1)",
                border: "1px solid rgba(255, 46, 136, 0.45)",
                color: "var(--danger-fg)",
              }}
            >
              &gt; LOAD ERROR: {correctionsError}
              <button onClick={() => void refreshCorrections()} className="block mt-2 text-xs underline font-display tracking-widest">
                RETRY
              </button>
            </div>
          ) : corrections.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <p className="text-4xl mb-3 animate-flicker">✨</p>
              <p className="text-sm font-display tracking-widest text-neon-lime neon-glow-lime mb-2">&gt; NO REPORTS</p>
              <p className="text-xs font-retro tracking-wider">⚠ 버튼으로 신고 가능</p>
            </div>
          ) : (
            <>
              <div
                className="p-3 mb-3 text-xs leading-relaxed font-retro"
                style={{
                  background: "rgba(0, 240, 255, 0.08)",
                  border: "1px solid rgba(0, 240, 255, 0.4)",
                  color: "var(--info-fg)",
                }}
              >
                &gt; 터미널에서 <span className="font-mono bg-card px-1">수정 요청 처리해줘</span> 입력 시
                {corrections.length}건 순서대로 처리
              </div>
              <div className="space-y-3">
                {corrections.map((c) => {
                  const q = questionMap.get(c.question_id);
                  return (
                    <div
                      key={c.id}
                      className="p-3 space-y-2"
                      style={{
                        background: "rgba(18, 7, 38, 0.85)",
                        border: "1px solid rgba(168, 85, 255, 0.3)",
                      }}
                    >
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 font-display tracking-widest ${TYPE_BADGE_CLASS[c.report_type]}`}>
                          {CORRECTION_TYPE_LABELS[c.report_type]}
                        </span>
                        {c.option_label && (
                          <span className="text-[10px] text-muted bg-muted-bg px-1.5 py-0.5 font-display tracking-widest">
                            OPT {c.option_label}
                          </span>
                        )}
                        <span className="text-[10px] text-muted bg-muted-bg px-1.5 py-0.5 font-mono">
                          {c.question_id}
                        </span>
                      </div>
                      {q ? (
                        <p className="text-xs leading-relaxed line-clamp-2">
                          {q.question_text.slice(0, 120)}
                          {q.question_text.length > 120 ? "..." : ""}
                        </p>
                      ) : (
                        <p className="text-xs text-muted italic font-retro">NO DATA</p>
                      )}
                      {c.selected_text && (
                        <div
                          className="px-2 py-1"
                          style={{
                            background: "rgba(255, 238, 0, 0.08)",
                            borderLeft: "3px solid var(--neon-yellow)",
                          }}
                        >
                          <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: "var(--warning-fg)" }}>
                            {c.selected_text}
                          </p>
                        </div>
                      )}
                      {c.description && <p className="text-xs text-muted leading-relaxed pl-1 font-retro">{c.description}</p>}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-muted font-retro">
                          {new Date(c.created_at).toLocaleString("ko-KR", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <button
                          onClick={() => void handleDeleteCorrection(c.id)}
                          className="text-[10px] font-display tracking-widest"
                          style={{ color: "var(--danger-fg)" }}
                        >
                          DEL
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
