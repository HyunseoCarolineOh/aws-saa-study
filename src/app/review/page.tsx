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
  wrong_question: "bg-danger-bg text-danger-fg border border-danger-border",
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
      setCorrectionsError(e instanceof Error ? e.message : "濡쒕뱶 ?ㅽ뙣");
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
    if (!confirm("???섏젙 ?붿껌????젣?좉퉴??")) return;
    try {
      await deleteCorrection(id);
      setCorrections((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "??젣 ?ㅽ뙣");
    }
  }

  function refreshNotes() {
    setNotes(getStudyNotes());
  }

  function handleDeleteNote(id: string) {
    if (!confirm("???ㅻ떟?명듃瑜???젣?좉퉴??")) return;
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

  // 寃???꾪꽣
  const filteredNotes = notes
    .filter((n) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return n.selectedText.toLowerCase().includes(q) || n.memo.toLowerCase().includes(q);
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <h1 className="text-xl font-bold mb-4">?ㅻ떟 愿由?/h1>

      {/* ??*/}
      <div className="flex border-b border-border mb-4">
        <button
          onClick={() => setActiveTab("review")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "review" ? "text-primary border-b-2 border-primary" : "text-muted"
          }`}
        >
          ?ㅻ떟 蹂듭뒿
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "notes" ? "text-primary border-b-2 border-primary" : "text-muted"
          }`}
        >
          ?ㅻ떟?명듃 ({notes.length})
        </button>
        <button
          onClick={() => setActiveTab("corrections")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "corrections" ? "text-primary border-b-2 border-primary" : "text-muted"
          }`}
        >
          ?섏젙 ?붿껌{correctionsEnabled && corrections.length > 0 ? ` (${corrections.length})` : ""}
        </button>
      </div>

      {/* ?ㅻ떟 蹂듭뒿 ??*/}
      {activeTab === "review" && (
        <>
          <div className="bg-card rounded-xl border border-border p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-danger">{wrongCount}</p>
                <p className="text-xs text-muted">?由?臾몄젣 ??/p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{reviewIds.length}</p>
                <p className="text-xs text-muted">?ㅻ뒛 蹂듭뒿??臾몄젣</p>
              </div>
            </div>
          </div>

          {reviewIds.length > 0 ? (
            <Link
              href="/questions?mode=review"
              className="block w-full bg-primary text-on-primary text-center py-3 rounded-xl font-medium mb-6"
            >
              蹂듭뒿 ?쒖옉 ({reviewIds.length}臾몄젣)
            </Link>
          ) : (
            <div className="text-center py-8 text-muted mb-6">
              <p className="text-lg mb-2">?ㅻ뒛 蹂듭뒿??臾몄젣媛 ?놁뒿?덈떎</p>
              <p className="text-sm">臾몄젣瑜??怨??由?臾몄젣媛 ?앷린硫??ш린??蹂듭뒿?????덉뒿?덈떎</p>
              <Link href="/questions" className="inline-block mt-4 text-primary font-medium text-sm">
                臾몄젣 ???媛湲?&rarr;
              </Link>
            </div>
          )}

          {!loading && wrongSummary.length > 0 && (
            <div>
              <h2 className="text-sm font-bold mb-3 text-muted">?由?臾몄젣 紐⑸줉</h2>
              <div className="space-y-2">
                {wrongSummary
                  .sort((a, b) => b.lastAttemptAt.localeCompare(a.lastAttemptAt))
                  .map((item) => {
                    const q = questionMap.get(item.questionId);
                    const isReviewDue = reviewIds.includes(item.questionId);
                    return (
                      <Link
                        key={item.questionId}
                        href={`/questions?id=${item.questionId}`}
                        className={`block bg-card rounded-xl border p-3 ${
                          isReviewDue ? "border-accent bg-accent-bg" : "border-border"
                        } active:scale-[0.98] transition-transform`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs text-foreground leading-relaxed line-clamp-2 flex-1">
                            {q ? q.question_text.slice(0, 100) + (q.question_text.length > 100 ? "..." : "") : item.questionId}
                          </p>
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span className="text-[10px] text-danger font-medium">{item.attemptCount}???ㅻ떟</span>
                            {isReviewDue && (
                              <span className="text-[10px] text-accent font-medium mt-0.5">蹂듭뒿 ?덉젙</span>
                            )}
                            <span className="text-[10px] text-primary mt-1">諛붾줈媛湲?&rarr;</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ?ㅻ떟?명듃 ??*/}
      {activeTab === "notes" && (
        <>
          {notes.length > 0 && (
            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="?명듃 寃??.."
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </div>
          )}

          {filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-muted">
              {notes.length === 0 ? (
                <>
                  <div className="text-4xl mb-3">&#128221;</div>
                  <p className="text-lg mb-2">?ㅻ떟?명듃媛 ?놁뒿?덈떎</p>
                  <p className="text-sm">臾몄젣 ???以??띿뒪?몃? ?쒕옒洹명븯硫?br />?ㅻ떟?명듃????ν븷 ???덉뒿?덈떎</p>
                  <Link href="/questions" className="inline-block mt-4 text-primary font-medium text-sm">
                    臾몄젣 ???媛湲?&rarr;
                  </Link>
                </>
              ) : (
                <p className="text-sm">寃??寃곌낵媛 ?놁뒿?덈떎</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map((note) => {
                const q = questionMap.get(note.questionId);
                const isEditing = editingNote?.id === note.id;
                const sourceLabel =
                  note.sourceContext === "question" ? "臾몄젣" : note.sourceContext === "explanation" ? "?댁꽕" : "?곸꽭 ???;

                return (
                  <div key={note.id} className="bg-card rounded-xl border border-border p-3 space-y-2">
                    {/* ?좏깮???띿뒪??*/}
                    <div className="bg-warning-bg border-l-4 border-warning px-3 py-2 rounded-r">
                      <p className="text-xs text-warning-fg leading-relaxed">{note.selectedText}</p>
                    </div>

                    {/* 硫붾え */}
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingNote.memo}
                          onChange={(e) => setEditingNote({ ...editingNote, memo: e.target.value })}
                          className="w-full border border-border rounded-lg px-2.5 py-2 text-xs leading-relaxed resize-none focus:outline-none focus:border-primary"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingNote(null)}
                            className="text-[10px] text-muted px-2 py-1 border border-border rounded"
                          >
                            痍⑥냼
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="text-[10px] text-on-primary bg-primary px-2 py-1 rounded"
                          >
                            ???
                          </button>
                        </div>
                      </div>
                    ) : (
                      note.memo && (
                        <p className="text-xs text-muted leading-relaxed pl-1">{note.memo}</p>
                      )
                    )}

                    {/* 硫뷀? ?뺣낫 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-[10px] text-muted bg-muted-bg px-1.5 py-0.5 rounded flex-shrink-0">
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
                            <Link
                              href={`/questions?id=${note.questionId}`}
                              className="text-[10px] text-primary font-medium"
                            >
                              臾몄젣蹂닿린
                            </Link>
                            <button
                              onClick={() => setEditingNote({ id: note.id, memo: note.memo })}
                              className="text-[10px] text-primary font-medium"
                            >
                              ?섏젙
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-[10px] text-danger-fg font-medium"
                            >
                              ??젣
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

      {/* ?섏젙 ?붿껌 ??*/}
      {activeTab === "corrections" && (
        <>
          {!correctionsEnabled ? (
            <div className="bg-warning-bg border border-warning-border text-warning-fg text-sm rounded-xl p-4">
              <p className="font-medium mb-1">Supabase 誘몄꽕??/p>
              <p className="text-xs leading-relaxed">
                <code className="bg-card px-1 rounded">.env.local</code>??
                <code className="bg-card px-1 rounded ml-1">NEXT_PUBLIC_SUPABASE_URL</code>,
                <code className="bg-card px-1 rounded ml-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>瑜?
                ?ㅼ젙?????ㅼ떆 濡쒕뱶?섏꽭??
              </p>
            </div>
          ) : correctionsLoading ? (
            <p className="text-sm text-muted text-center py-8">遺덈윭?ㅻ뒗 以?..</p>
          ) : correctionsError ? (
            <div className="bg-danger-bg border border-danger-border text-danger-fg text-sm rounded-xl p-3">
              濡쒕뱶 ?ㅽ뙣: {correctionsError}
              <button
                onClick={() => void refreshCorrections()}
                className="block mt-2 text-xs underline"
              >
                ?ㅼ떆 ?쒕룄
              </button>
            </div>
          ) : corrections.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <p className="text-lg mb-2">泥섎━???섏젙 ?붿껌???놁뒿?덈떎</p>
              <p className="text-sm">紐⑤컮?쇱뿉??臾몄젣 ???以???踰꾪듉?쇰줈 ?좉퀬?????덉뒿?덈떎</p>
            </div>
          ) : (
            <>
              <div className="bg-info-bg border border-info-border text-info-fg text-xs rounded-xl p-3 mb-3 leading-relaxed">
                ?곕??먯뿉??Claude Code?먭쾶 <span className="font-mono bg-card px-1 rounded">?섏젙 ?붿껌 泥섎━?댁쨾</span>?쇨퀬 留먰븯硫?
                ?꾨옒 {corrections.length}嫄댁쓣 ?쒖꽌?濡?泥섎━?⑸땲??
              </div>
              <div className="space-y-3">
                {corrections.map((c) => {
                  const q = questionMap.get(c.question_id);
                  return (
                    <div key={c.id} className="bg-card rounded-xl border border-border p-3 space-y-2">
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${TYPE_BADGE_CLASS[c.report_type]}`}>
                          {CORRECTION_TYPE_LABELS[c.report_type]}
                        </span>
                        {c.option_label && (
                          <span className="text-[10px] text-muted bg-muted-bg px-1.5 py-0.5 rounded">
                            ?좎? {c.option_label}
                          </span>
                        )}
                        <span className="text-[10px] text-muted bg-muted-bg px-1.5 py-0.5 rounded font-mono">
                          {c.question_id}
                        </span>
                      </div>
                      {q ? (
                        <p className="text-xs text-foreground leading-relaxed line-clamp-2">
                          {q.question_text.slice(0, 120)}
                          {q.question_text.length > 120 ? "..." : ""}
                        </p>
                      ) : (
                        <p className="text-xs text-muted italic">臾몄젣 ?곗씠?곕? 李얠쓣 ???놁뒿?덈떎</p>
                      )}
                      {c.selected_text && (
                        <div className="bg-warning-bg border-l-4 border-warning px-2 py-1 rounded-r">
                          <p className="text-[11px] text-warning-fg leading-relaxed line-clamp-2">{c.selected_text}</p>
                        </div>
                      )}
                      {c.description && (
                        <p className="text-xs text-muted leading-relaxed pl-1">{c.description}</p>
                      )}
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
                          className="text-[10px] text-danger-fg font-medium"
                        >
                          ??젣
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
