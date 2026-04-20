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
    { key: "review" as const, label: "재도전", emoji: "🔄" },
    { key: "notes" as const, label: "노트", emoji: "📝", count: notes.length },
    { key: "corrections" as const, label: "수정요청", emoji: "⚠️", count: correctionsEnabled ? corrections.length : 0 },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <div className="mb-5">
        <p className="text-xs text-muted font-semibold tracking-wider">TRAINING HALL</p>
        <h1 className="text-2xl font-display font-black text-rose">수련장 🔄</h1>
      </div>

      <div className="flex gap-1.5 mb-5 p-1 rounded-full" style={{ background: "rgba(37,32,58,0.7)", border: "1px solid var(--border)" }}>
        {tabMeta.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2 text-xs font-display font-bold transition-all rounded-full flex items-center justify-center gap-1"
              style={
                active
                  ? {
                      background: "linear-gradient(135deg, #ffb4c6, #c8b4ff)",
                      color: "#2b1a20",
                      boxShadow: "0 4px 12px rgba(255,180,198,0.3)",
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
          <div
            className="rounded-3xl p-4 mb-4 bubble-shadow"
            style={{
              background: "linear-gradient(135deg, rgba(46,40,73,0.9), rgba(37,32,58,0.9))",
              border: "1px solid rgba(200,180,255,0.22)",
            }}
          >
            <div className="grid grid-cols-2 gap-4 text-center">
              <div
                className="rounded-2xl py-3"
                style={{
                  background: "rgba(255,159,181,0.08)",
                  border: "1px solid rgba(255,159,181,0.3)",
                }}
              >
                <p className="text-2xl font-display font-black text-rose">{wrongCount}</p>
                <p className="text-[11px] text-muted mt-0.5">💥 놓친 문제</p>
              </div>
              <div
                className="rounded-2xl py-3"
                style={{
                  background: "rgba(255,226,122,0.08)",
                  border: "1px solid rgba(255,226,122,0.3)",
                }}
              >
                <p className="text-2xl font-display font-black text-warning-fg">{reviewIds.length}</p>
                <p className="text-[11px] text-muted mt-0.5">🔄 오늘 재도전</p>
              </div>
            </div>
          </div>

          {reviewIds.length > 0 ? (
            <Link
              href="/questions?mode=review"
              className="block w-full text-center py-3.5 rounded-3xl font-display font-bold text-on-primary mb-6 active:scale-[0.97] transition-all"
              style={{
                background: "linear-gradient(135deg, #ffcba8, #ffb4c6)",
                boxShadow: "0 8px 24px rgba(255,203,168,0.35)",
              }}
            >
              🔄 재도전 시작! ({reviewIds.length}문제)
            </Link>
          ) : (
            <div className="text-center py-10 text-muted mb-6">
              <p className="text-4xl mb-3">🌸</p>
              <p className="text-sm font-display font-bold text-mint mb-2">오늘 재도전할 문제가 없어요!</p>
              <p className="text-xs">문제를 풀고 틀린 게 생기면 여기서 다시 만나요</p>
              <Link href="/questions" className="inline-block mt-4 text-rose font-display font-bold text-sm">
                ⚔️ 퀘스트 하러 가기 →
              </Link>
            </div>
          )}

          {!loading && wrongSummary.length > 0 && (
            <div>
              <h2 className="text-xs font-display font-bold mb-3 text-lavender tracking-wider">💥 놓친 퀘스트 목록</h2>
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
                                background: "linear-gradient(135deg, rgba(255,203,168,0.12), rgba(255,180,198,0.08))",
                                border: "1px solid rgba(255,203,168,0.4)",
                              }
                            : {
                                background: "rgba(37,32,58,0.6)",
                                border: "1px solid var(--border)",
                              }
                        }
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs leading-relaxed line-clamp-2 flex-1">
                            {q ? q.question_text.slice(0, 100) + (q.question_text.length > 100 ? "..." : "") : item.questionId}
                          </p>
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span className="text-[10px] text-rose font-display font-bold">×{item.attemptCount} 실패</span>
                            {isReviewDue && (
                              <span className="text-[10px] text-accent-fg font-display font-bold mt-0.5">🔄 오늘 재도전</span>
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
                className="w-full rounded-3xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                style={{
                  background: "rgba(37,32,58,0.7)",
                  border: "1.5px solid var(--border)",
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
                  <p className="text-lg font-display font-bold text-lavender mb-2">노트가 비어있어요!</p>
                  <p className="text-sm">문제 풀이 중 텍스트를 드래그하면<br />노트에 저장할 수 있어요</p>
                  <Link href="/questions" className="inline-block mt-4 text-rose font-display font-bold text-sm">
                    ⚔️ 퀘스트 하러 가기 →
                  </Link>
                </>
              ) : (
                <p className="text-sm">검색 결과가 없어요 🔍</p>
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
                  <div
                    key={note.id}
                    className="rounded-3xl p-4 space-y-2 bubble-shadow"
                    style={{
                      background: "linear-gradient(135deg, rgba(46,40,73,0.9), rgba(37,32,58,0.9))",
                      border: "1px solid rgba(200,180,255,0.2)",
                    }}
                  >
                    <div
                      className="rounded-2xl px-3 py-2"
                      style={{
                        background: "linear-gradient(135deg, rgba(255,226,122,0.12), rgba(255,203,168,0.08))",
                        borderLeft: "3px solid var(--pastel-lemon)",
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
                            background: "rgba(37,32,58,0.7)",
                            border: "1.5px solid var(--border)",
                            color: "var(--foreground)",
                          }}
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingNote(null)}
                            className="text-[10px] text-muted px-3 py-1 rounded-full font-display font-bold"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}
                          >
                            취소
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="text-[10px] px-3 py-1 rounded-full font-display font-bold text-on-primary"
                            style={{ background: "linear-gradient(135deg, #b4f2e1, #a8dcff)" }}
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
                          className="text-[10px] px-2 py-0.5 rounded-full font-display font-bold flex-shrink-0"
                          style={{
                            background: "rgba(200,180,255,0.12)",
                            color: "var(--pastel-lavender)",
                          }}
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
                              className="text-[10px] text-rose font-display font-bold"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-[10px] font-display font-bold"
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
              className="rounded-3xl p-4 text-sm"
              style={{
                background: "linear-gradient(135deg, rgba(255,226,122,0.12), rgba(255,203,168,0.1))",
                border: "1px solid rgba(255,226,122,0.4)",
                color: "var(--warning-fg)",
              }}
            >
              <p className="font-display font-bold mb-1">⚠️ Supabase 미설정</p>
              <p className="text-xs leading-relaxed">
                <code className="bg-card px-1 rounded">.env.local</code>에
                <code className="bg-card px-1 rounded ml-1">NEXT_PUBLIC_SUPABASE_URL</code>,
                <code className="bg-card px-1 rounded ml-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>를
                설정한 뒤 다시 로드하세요.
              </p>
            </div>
          ) : correctionsLoading ? (
            <p className="text-sm text-muted text-center py-8 font-display font-semibold animate-bounce-soft">🍡 불러오는 중...</p>
          ) : correctionsError ? (
            <div
              className="rounded-3xl p-3 text-sm"
              style={{
                background: "rgba(255,159,181,0.12)",
                border: "1px solid rgba(255,159,181,0.4)",
                color: "var(--danger-fg)",
              }}
            >
              💥 로드 실패: {correctionsError}
              <button onClick={() => void refreshCorrections()} className="block mt-2 text-xs underline font-display font-bold">
                다시 시도
              </button>
            </div>
          ) : corrections.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <p className="text-4xl mb-3">🌸</p>
              <p className="text-lg font-display font-bold text-mint mb-2">처리할 요청이 없어요!</p>
              <p className="text-sm">모바일에서 ⚠ 버튼으로 신고할 수 있어요</p>
            </div>
          ) : (
            <>
              <div
                className="rounded-3xl p-3 mb-3 text-xs leading-relaxed"
                style={{
                  background: "linear-gradient(135deg, rgba(168,220,255,0.12), rgba(200,180,255,0.08))",
                  border: "1px solid rgba(168,220,255,0.35)",
                  color: "var(--info-fg)",
                }}
              >
                💡 터미널에서 Claude Code에게 <span className="font-mono bg-card px-1 rounded">수정 요청 처리해줘</span>라고 말하면
                아래 {corrections.length}건을 순서대로 처리해요.
              </div>
              <div className="space-y-3">
                {corrections.map((c) => {
                  const q = questionMap.get(c.question_id);
                  return (
                    <div
                      key={c.id}
                      className="rounded-3xl p-3 space-y-2"
                      style={{
                        background: "linear-gradient(135deg, rgba(46,40,73,0.9), rgba(37,32,58,0.9))",
                        border: "1px solid rgba(200,180,255,0.2)",
                      }}
                    >
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-display font-bold ${TYPE_BADGE_CLASS[c.report_type]}`}>
                          {CORRECTION_TYPE_LABELS[c.report_type]}
                        </span>
                        {c.option_label && (
                          <span className="text-[10px] text-muted bg-muted-bg px-2 py-0.5 rounded-full font-display font-bold">
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
                            background: "rgba(255,226,122,0.12)",
                            borderLeft: "3px solid var(--pastel-lemon)",
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
                          className="text-[10px] font-display font-bold"
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
