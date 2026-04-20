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
    { key: "review" as const, label: "복습", color: "var(--gb-green)" },
    { key: "notes" as const, label: "노트", color: "var(--mana)", count: notes.length },
    { key: "corrections" as const, label: "수정요청", color: "var(--gold)", count: correctionsEnabled ? corrections.length : 0 },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-6">
      <header className="mb-6">
        <p className="eyebrow">Training Hall</p>
        <h1 className="page-title">복습 공간</h1>
        <p className="page-sub">오답을 다시 풀고 메모도 확인해요</p>
      </header>

      <div className="flex gap-2 mb-6">
        {tabMeta.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-transform active:translate-x-[1px] active:translate-y-[1px]"
              style={
                active
                  ? {
                      background: tab.color,
                      color: "var(--gb-dark)",
                      border: "2px solid var(--gb-dark)",
                      boxShadow: "2px 2px 0 var(--gb-dark)",
                      fontSize: 13,
                      fontWeight: 700,
                    }
                  : {
                      background: "var(--card)",
                      color: "var(--muted)",
                      border: "2px solid var(--border)",
                      fontSize: 13,
                      fontWeight: 600,
                    }
              }
            >
              <span>{tab.label}</span>
              {tab.count && tab.count > 0 ? <span className="pixel-label opacity-80">({tab.count})</span> : null}
            </button>
          );
        })}
      </div>

      {activeTab === "review" && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div
              className="pixel-panel p-4 text-center"
              style={{ borderColor: "var(--blood)", boxShadow: "2px 2px 0 rgba(184, 50, 50, 0.3)" }}
            >
              <p className="stat-value-lg text-blood" style={{ fontSize: 26 }}>
                {wrongCount}
              </p>
              <p className="pixel-label text-muted mt-2">MISSES</p>
            </div>
            <div
              className="pixel-panel p-4 text-center"
              style={{ borderColor: "var(--gold)", boxShadow: "2px 2px 0 rgba(232, 185, 35, 0.3)" }}
            >
              <p className="stat-value-lg text-gold" style={{ fontSize: 26 }}>
                {reviewIds.length}
              </p>
              <p className="pixel-label text-muted mt-2">TODAY</p>
            </div>
          </div>

          {reviewIds.length > 0 ? (
            <Link
              href="/questions?mode=review"
              className="pixel-btn pixel-btn-gold w-full py-3.5 mb-6"
            >
              🔄 오답 복습 시작 ({reviewIds.length}문제)
            </Link>
          ) : (
            <div className="text-center py-10 mb-6">
              <p className="text-4xl mb-3 animate-pixel-bounce">★</p>
              <p className="pixel-label text-gb-green mb-2">&gt; ALL CLEAR!</p>
              <p className="body-sub">재도전할 문제가 없어요</p>
              <Link href="/questions" className="inline-block mt-4 pixel-label text-gold">
                &gt; 문제 풀러 가기 ►
              </Link>
            </div>
          )}

          {!loading && wrongSummary.length > 0 && (
            <section>
              <h2 className="section-title text-accent-fg mb-3">× 틀린 문제 목록</h2>
              <ul className="space-y-2">
                {wrongSummary
                  .sort((a, b) => b.lastAttemptAt.localeCompare(a.lastAttemptAt))
                  .map((item) => {
                    const q = questionMap.get(item.questionId);
                    const isReviewDue = reviewIds.includes(item.questionId);
                    return (
                      <li
                        key={item.questionId}
                        className="p-3 pixel-panel"
                        style={
                          isReviewDue
                            ? { borderColor: "var(--gold)", background: "rgba(232, 185, 35, 0.06)" }
                            : undefined
                        }
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="body-sub leading-relaxed line-clamp-2 flex-1">
                            {q
                              ? q.question_text.slice(0, 100) + (q.question_text.length > 100 ? "..." : "")
                              : item.questionId}
                          </p>
                          <div className="flex flex-col items-end flex-shrink-0 gap-1">
                            <span className="pixel-label text-blood">×{item.attemptCount}</span>
                            {isReviewDue && <span className="pixel-label text-gold">TODAY</span>}
                          </div>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </section>
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
                className="pixel-input"
              />
            </div>
          )}

          {filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              {notes.length === 0 ? (
                <>
                  <div className="text-5xl mb-3">📝</div>
                  <p className="pixel-label text-mana mb-2">&gt; NO NOTES</p>
                  <p className="body-sub">문제 풀이 중 텍스트 드래그로 저장돼요</p>
                  <Link href="/questions" className="inline-block mt-4 pixel-label text-gb-green">
                    &gt; 문제 풀러 가기 ►
                  </Link>
                </>
              ) : (
                <p className="pixel-label text-muted">&gt; NO MATCH</p>
              )}
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredNotes.map((note) => {
                const q = questionMap.get(note.questionId);
                const isEditing = editingNote?.id === note.id;
                const sourceLabel =
                  note.sourceContext === "question"
                    ? "문제"
                    : note.sourceContext === "explanation"
                    ? "해설"
                    : "상세";

                return (
                  <li key={note.id} className="pixel-panel p-3 space-y-2.5">
                    <div
                      className="px-3 py-2"
                      style={{
                        background: "rgba(232, 185, 35, 0.1)",
                        borderLeft: "3px solid var(--gold)",
                      }}
                    >
                      <p className="body-sub leading-relaxed" style={{ color: "var(--warning-fg)" }}>
                        {note.selectedText}
                      </p>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingNote.memo}
                          onChange={(e) => setEditingNote({ ...editingNote, memo: e.target.value })}
                          className="pixel-input"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button onClick={() => setEditingNote(null)} className="pixel-btn pixel-btn-ghost py-2 px-4 text-xs">
                            취소
                          </button>
                          <button onClick={handleSaveEdit} className="pixel-btn pixel-btn-primary py-2 px-4 text-xs">
                            &gt; 저장
                          </button>
                        </div>
                      </div>
                    ) : (
                      note.memo && <p className="body-text pl-1">{note.memo}</p>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className="pixel-badge"
                          style={{
                            background: "var(--accent-fg)",
                            color: "var(--gb-dark)",
                            borderColor: "var(--gb-dark)",
                            padding: "2px 6px",
                            fontSize: 9,
                          }}
                        >
                          {sourceLabel}
                        </span>
                        {q && (
                          <span className="caption truncate">
                            {q.question_text.slice(0, 40)}...
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <span className="caption">
                          {new Date(note.createdAt).toLocaleDateString("ko-KR", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        {!isEditing && (
                          <>
                            <button
                              onClick={() => setEditingNote({ id: note.id, memo: note.memo })}
                              className="pixel-label text-mana"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="pixel-label text-blood"
                            >
                              삭제
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {activeTab === "corrections" && (
        <>
          {!correctionsEnabled ? (
            <div
              className="pixel-panel p-4"
              style={{
                background: "rgba(232, 185, 35, 0.08)",
                borderColor: "var(--gold)",
                color: "var(--warning-fg)",
              }}
            >
              <p className="pixel-label mb-2">&gt; SUPABASE NOT SET</p>
              <p className="body-sub leading-relaxed">.env.local 환경변수 설정 후 재로드 해주세요</p>
            </div>
          ) : correctionsLoading ? (
            <p className="pixel-label text-muted text-center py-8 animate-blink">&gt; LOADING...</p>
          ) : correctionsError ? (
            <div
              className="pixel-panel p-3"
              style={{
                background: "rgba(184, 50, 50, 0.1)",
                borderColor: "var(--blood)",
                color: "var(--danger-fg)",
              }}
            >
              <p className="body-sub">&gt; ERROR: {correctionsError}</p>
              <button onClick={() => void refreshCorrections()} className="block mt-2 pixel-label underline">
                다시 시도
              </button>
            </div>
          ) : corrections.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">★</p>
              <p className="pixel-label text-gb-green mb-2">&gt; NO REPORTS</p>
              <p className="body-sub">⚠ 버튼으로 문제 오류를 신고할 수 있어요</p>
            </div>
          ) : (
            <>
              <div
                className="pixel-panel p-3 mb-3 body-sub leading-relaxed"
                style={{
                  background: "rgba(91, 156, 216, 0.08)",
                  borderColor: "var(--mana)",
                  color: "var(--info-fg)",
                }}
              >
                💡 터미널에서 <code className="font-mono bg-card px-1.5 py-0.5">수정 요청 처리해줘</code> 입력 시
                {corrections.length}건 순서대로 처리됩니다
              </div>
              <ul className="space-y-3">
                {corrections.map((c) => {
                  const q = questionMap.get(c.question_id);
                  return (
                    <li key={c.id} className="pixel-panel p-3 space-y-2">
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className={`pixel-badge ${TYPE_BADGE_CLASS[c.report_type]}`}>
                          {CORRECTION_TYPE_LABELS[c.report_type]}
                        </span>
                        {c.option_label && (
                          <span
                            className="pixel-badge"
                            style={{
                              background: "var(--gb-dark)",
                              color: "var(--muted)",
                              borderColor: "var(--border)",
                            }}
                          >
                            OPT {c.option_label}
                          </span>
                        )}
                        <span
                          className="caption px-1.5 py-0.5"
                          style={{
                            background: "var(--gb-dark)",
                            border: "1.5px solid var(--border)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {c.question_id}
                        </span>
                      </div>
                      {q ? (
                        <p className="body-sub leading-relaxed line-clamp-2">
                          {q.question_text.slice(0, 120)}
                          {q.question_text.length > 120 ? "..." : ""}
                        </p>
                      ) : (
                        <p className="body-sub italic">문제 데이터를 찾을 수 없어요</p>
                      )}
                      {c.selected_text && (
                        <div
                          className="px-3 py-2"
                          style={{
                            background: "rgba(232, 185, 35, 0.1)",
                            borderLeft: "3px solid var(--gold)",
                          }}
                        >
                          <p className="body-sub leading-relaxed line-clamp-2" style={{ color: "var(--warning-fg)" }}>
                            {c.selected_text}
                          </p>
                        </div>
                      )}
                      {c.description && <p className="body-sub leading-relaxed pl-1">{c.description}</p>}
                      <div className="flex items-center justify-between pt-1">
                        <span className="caption">
                          {new Date(c.created_at).toLocaleString("ko-KR", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <button
                          onClick={() => void handleDeleteCorrection(c.id)}
                          className="pixel-label"
                          style={{ color: "var(--danger-fg)" }}
                        >
                          삭제
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
