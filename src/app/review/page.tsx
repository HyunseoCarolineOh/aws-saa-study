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
    { key: "review" as const, label: "REDO", color: "#9bbc0f" },
    { key: "notes" as const, label: "NOTES", color: "#8fc0e8", count: notes.length },
    { key: "corrections" as const, label: "REPORT", color: "#e8b923", count: correctionsEnabled ? corrections.length : 0 },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <div className="mb-5">
        <p className="text-[9px] font-display text-gold mb-1">&gt; TRAINING HALL</p>
        <h1 className="text-sm font-display font-black text-gb-green">REVENGE ROOM</h1>
      </div>

      <div className="flex gap-1.5 mb-5">
        {tabMeta.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2 text-[10px] font-display transition-all flex items-center justify-center gap-1"
              style={
                active
                  ? {
                      background: tab.color,
                      color: "#0f380f",
                      border: "2px solid #1a1410",
                      boxShadow: "2px 2px 0 #1a1410",
                    }
                  : {
                      background: "#2a1f17",
                      color: "var(--muted)",
                      border: "2px solid #5a4530",
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
          <div className="pixel-panel p-3 mb-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="py-2" style={{ background: "rgba(184, 50, 50, 0.1)", border: "2px solid #b83232" }}>
                <p className="text-2xl font-display font-black text-blood">{wrongCount}</p>
                <p className="text-[10px] font-display text-muted mt-0.5">× MISSES</p>
              </div>
              <div className="py-2" style={{ background: "rgba(232, 185, 35, 0.1)", border: "2px solid #e8b923" }}>
                <p className="text-2xl font-display font-black text-gold">{reviewIds.length}</p>
                <p className="text-[10px] font-display text-muted mt-0.5">&gt; TODAY</p>
              </div>
            </div>
          </div>

          {reviewIds.length > 0 ? (
            <Link
              href="/questions?mode=review"
              className="block w-full text-center py-3 font-display font-bold text-sm mb-6 pixel-button"
              style={{
                background: "#e8b923",
                color: "#1a1410",
                borderColor: "#1a1410",
                boxShadow: "2px 2px 0 #1a1410",
              }}
            >
              &gt; REVENGE! ({reviewIds.length}Q)
            </Link>
          ) : (
            <div className="text-center py-10 mb-6">
              <p className="text-4xl mb-3 animate-pixel-bounce">★</p>
              <p className="text-xs font-display text-gb-green mb-2">&gt; ALL CLEAR!</p>
              <p className="text-sm text-parchment font-retro">재도전할 퀘스트 없음</p>
              <Link href="/questions" className="inline-block mt-4 text-gold font-display text-xs">
                &gt; GO BATTLE ►
              </Link>
            </div>
          )}

          {!loading && wrongSummary.length > 0 && (
            <div>
              <h2 className="text-[11px] font-display text-accent-fg mb-3">&gt; MISS LIST</h2>
              <div className="space-y-2">
                {wrongSummary
                  .sort((a, b) => b.lastAttemptAt.localeCompare(a.lastAttemptAt))
                  .map((item) => {
                    const q = questionMap.get(item.questionId);
                    const isReviewDue = reviewIds.includes(item.questionId);
                    return (
                      <div
                        key={item.questionId}
                        className="p-3 pixel-panel"
                        style={isReviewDue ? { borderColor: "#e8b923", background: "rgba(232, 185, 35, 0.08)" } : undefined}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs leading-relaxed line-clamp-2 flex-1 font-retro">
                            {q ? q.question_text.slice(0, 100) + (q.question_text.length > 100 ? "..." : "") : item.questionId}
                          </p>
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span className="text-[10px] text-blood font-display">×{item.attemptCount}</span>
                            {isReviewDue && <span className="text-[10px] text-gold font-display mt-0.5">&gt; TODAY</span>}
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
                placeholder="> SEARCH..."
                className="w-full px-3 py-2.5 text-sm focus:outline-none font-retro"
                style={{
                  background: "#0f380f",
                  border: "2px solid #5b9cd8",
                  color: "var(--foreground)",
                }}
              />
            </div>
          )}

          {filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-muted">
              {notes.length === 0 ? (
                <>
                  <div className="text-4xl mb-3 animate-pixel-bounce">📝</div>
                  <p className="text-xs font-display text-mana mb-2">&gt; NO NOTES</p>
                  <p className="text-sm font-retro">텍스트 드래그로 저장</p>
                  <Link href="/questions" className="inline-block mt-4 text-gb-green font-display text-xs">
                    &gt; GO BATTLE ►
                  </Link>
                </>
              ) : (
                <p className="text-sm font-display">&gt; NO MATCH</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map((note) => {
                const q = questionMap.get(note.questionId);
                const isEditing = editingNote?.id === note.id;
                const sourceLabel =
                  note.sourceContext === "question" ? "Q" : note.sourceContext === "explanation" ? "ANS" : "DET";

                return (
                  <div key={note.id} className="p-3 space-y-2 pixel-panel">
                    <div
                      className="px-3 py-2"
                      style={{
                        background: "rgba(232, 185, 35, 0.1)",
                        borderLeft: "4px solid #e8b923",
                      }}
                    >
                      <p className="text-xs leading-relaxed font-retro" style={{ color: "var(--warning-fg)" }}>
                        {note.selectedText}
                      </p>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingNote.memo}
                          onChange={(e) => setEditingNote({ ...editingNote, memo: e.target.value })}
                          className="w-full px-3 py-2 text-xs leading-relaxed resize-none focus:outline-none font-retro"
                          style={{
                            background: "#0f380f",
                            border: "2px solid #5b9cd8",
                            color: "var(--foreground)",
                          }}
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button onClick={() => setEditingNote(null)} className="text-[10px] font-display text-muted px-3 py-1" style={{ border: "2px solid var(--border)" }}>
                            CANCEL
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="text-[10px] font-display px-3 py-1"
                            style={{ background: "#9bbc0f", color: "#0f380f", border: "2px solid #0f380f" }}
                          >
                            &gt; SAVE
                          </button>
                        </div>
                      </div>
                    ) : (
                      note.memo && <p className="text-xs text-parchment leading-relaxed pl-1 font-retro">{note.memo}</p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className="text-[9px] px-1.5 py-0.5 font-display flex-shrink-0"
                          style={{
                            background: "#c4a4e0",
                            color: "#0f380f",
                            border: "1px solid #0f380f",
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
                              className="text-[10px] text-mana font-display"
                            >
                              EDIT
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-[10px] text-blood font-display"
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
                background: "rgba(232, 185, 35, 0.08)",
                border: "2px solid #e8b923",
                color: "var(--warning-fg)",
              }}
            >
              <p className="font-display text-xs mb-1">&gt; SUPABASE NOT SET</p>
              <p className="text-xs leading-relaxed font-retro">.env.local 설정 후 재로드</p>
            </div>
          ) : correctionsLoading ? (
            <p className="text-sm text-muted text-center py-8 font-display animate-blink">&gt; LOADING...</p>
          ) : correctionsError ? (
            <div
              className="p-3 text-sm font-retro"
              style={{
                background: "rgba(184, 50, 50, 0.1)",
                border: "2px solid #b83232",
                color: "var(--danger-fg)",
              }}
            >
              &gt; ERROR: {correctionsError}
              <button onClick={() => void refreshCorrections()} className="block mt-2 text-xs underline font-display">
                RETRY
              </button>
            </div>
          ) : corrections.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <p className="text-4xl mb-3 animate-pixel-bounce">★</p>
              <p className="text-xs font-display text-gb-green mb-2">&gt; NO REPORTS</p>
              <p className="text-sm font-retro">⚠ 버튼으로 신고</p>
            </div>
          ) : (
            <>
              <div
                className="p-3 mb-3 text-xs leading-relaxed font-retro"
                style={{
                  background: "rgba(91, 156, 216, 0.08)",
                  border: "2px solid #5b9cd8",
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
                    <div key={c.id} className="p-3 space-y-2 pixel-panel">
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 font-display ${TYPE_BADGE_CLASS[c.report_type]}`}>
                          {CORRECTION_TYPE_LABELS[c.report_type]}
                        </span>
                        {c.option_label && (
                          <span className="text-[10px] text-muted px-1.5 py-0.5 font-display" style={{ background: "#0f380f", border: "1px solid var(--border)" }}>
                            OPT {c.option_label}
                          </span>
                        )}
                        <span className="text-[10px] text-muted px-1.5 py-0.5 font-mono" style={{ background: "#0f380f", border: "1px solid var(--border)" }}>
                          {c.question_id}
                        </span>
                      </div>
                      {q ? (
                        <p className="text-xs leading-relaxed line-clamp-2 font-retro">
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
                            background: "rgba(232, 185, 35, 0.1)",
                            borderLeft: "3px solid #e8b923",
                          }}
                        >
                          <p className="text-[11px] leading-relaxed line-clamp-2 font-retro" style={{ color: "var(--warning-fg)" }}>
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
                          className="text-[10px] font-display"
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
