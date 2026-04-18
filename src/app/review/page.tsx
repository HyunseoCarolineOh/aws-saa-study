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

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <h1 className="text-xl font-bold mb-4">오답 관리</h1>

      {/* 탭 */}
      <div className="flex border-b border-border mb-4">
        <button
          onClick={() => setActiveTab("review")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "review" ? "text-primary border-b-2 border-primary" : "text-muted"
          }`}
        >
          오답 복습
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "notes" ? "text-primary border-b-2 border-primary" : "text-muted"
          }`}
        >
          오답노트 ({notes.length})
        </button>
        <button
          onClick={() => setActiveTab("corrections")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "corrections" ? "text-primary border-b-2 border-primary" : "text-muted"
          }`}
        >
          수정 요청{correctionsEnabled && corrections.length > 0 ? ` (${corrections.length})` : ""}
        </button>
      </div>

      {/* 오답 복습 탭 */}
      {activeTab === "review" && (
        <>
          <div className="bg-card rounded-xl border border-border p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-danger">{wrongCount}</p>
                <p className="text-xs text-muted">틀린 문제 수</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{reviewIds.length}</p>
                <p className="text-xs text-muted">오늘 복습할 문제</p>
              </div>
            </div>
          </div>

          {reviewIds.length > 0 ? (
            <Link
              href="/questions?mode=review"
              className="block w-full bg-primary text-on-primary text-center py-3 rounded-xl font-medium mb-6"
            >
              복습 시작 ({reviewIds.length}문제)
            </Link>
          ) : (
            <div className="text-center py-8 text-muted mb-6">
              <p className="text-lg mb-2">오늘 복습할 문제가 없습니다</p>
              <p className="text-sm">문제를 풀고 틀린 문제가 생기면 여기서 복습할 수 있습니다</p>
              <Link href="/questions" className="inline-block mt-4 text-primary font-medium text-sm">
                문제 풀러 가기 &rarr;
              </Link>
            </div>
          )}

          {!loading && wrongSummary.length > 0 && (
            <div>
              <h2 className="text-sm font-bold mb-3 text-muted">틀린 문제 목록</h2>
              <div className="space-y-2">
                {wrongSummary
                  .sort((a, b) => b.lastAttemptAt.localeCompare(a.lastAttemptAt))
                  .map((item) => {
                    const q = questionMap.get(item.questionId);
                    const isReviewDue = reviewIds.includes(item.questionId);
                    return (
                      <div
                        key={item.questionId}
                        className={`bg-card rounded-xl border p-3 ${
                          isReviewDue ? "border-accent bg-accent-bg" : "border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs text-foreground leading-relaxed line-clamp-2 flex-1">
                            {q ? q.question_text.slice(0, 100) + (q.question_text.length > 100 ? "..." : "") : item.questionId}
                          </p>
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span className="text-[10px] text-danger font-medium">{item.attemptCount}회 오답</span>
                            {isReviewDue && (
                              <span className="text-[10px] text-accent font-medium mt-0.5">복습 예정</span>
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

      {/* 오답노트 탭 */}
      {activeTab === "notes" && (
        <>
          {notes.length > 0 && (
            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="노트 검색..."
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </div>
          )}

          {filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-muted">
              {notes.length === 0 ? (
                <>
                  <div className="text-4xl mb-3">&#128221;</div>
                  <p className="text-lg mb-2">오답노트가 없습니다</p>
                  <p className="text-sm">문제 풀이 중 텍스트를 드래그하면<br />오답노트에 저장할 수 있습니다</p>
                  <Link href="/questions" className="inline-block mt-4 text-primary font-medium text-sm">
                    문제 풀러 가기 &rarr;
                  </Link>
                </>
              ) : (
                <p className="text-sm">검색 결과가 없습니다</p>
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
                  <div key={note.id} className="bg-card rounded-xl border border-border p-3 space-y-2">
                    {/* 선택된 텍스트 */}
                    <div className="bg-warning-bg border-l-4 border-warning px-3 py-2 rounded-r">
                      <p className="text-xs text-warning-fg leading-relaxed">{note.selectedText}</p>
                    </div>

                    {/* 메모 */}
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
                            취소
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="text-[10px] text-on-primary bg-primary px-2 py-1 rounded"
                          >
                            저장
                          </button>
                        </div>
                      </div>
                    ) : (
                      note.memo && (
                        <p className="text-xs text-muted leading-relaxed pl-1">{note.memo}</p>
                      )
                    )}

                    {/* 메타 정보 */}
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
                            <button
                              onClick={() => setEditingNote({ id: note.id, memo: note.memo })}
                              className="text-[10px] text-primary font-medium"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-[10px] text-danger-fg font-medium"
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

      {/* 수정 요청 탭 */}
      {activeTab === "corrections" && (
        <>
          {!correctionsEnabled ? (
            <div className="bg-warning-bg border border-warning-border text-warning-fg text-sm rounded-xl p-4">
              <p className="font-medium mb-1">Supabase 미설정</p>
              <p className="text-xs leading-relaxed">
                <code className="bg-card px-1 rounded">.env.local</code>에
                <code className="bg-card px-1 rounded ml-1">NEXT_PUBLIC_SUPABASE_URL</code>,
                <code className="bg-card px-1 rounded ml-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>를
                설정한 뒤 다시 로드하세요.
              </p>
            </div>
          ) : correctionsLoading ? (
            <p className="text-sm text-muted text-center py-8">불러오는 중...</p>
          ) : correctionsError ? (
            <div className="bg-danger-bg border border-danger-border text-danger-fg text-sm rounded-xl p-3">
              로드 실패: {correctionsError}
              <button
                onClick={() => void refreshCorrections()}
                className="block mt-2 text-xs underline"
              >
                다시 시도
              </button>
            </div>
          ) : corrections.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <p className="text-lg mb-2">처리할 수정 요청이 없습니다</p>
              <p className="text-sm">모바일에서 문제 풀이 중 ⚠ 버튼으로 신고할 수 있습니다</p>
            </div>
          ) : (
            <>
              <div className="bg-info-bg border border-info-border text-info-fg text-xs rounded-xl p-3 mb-3 leading-relaxed">
                터미널에서 Claude Code에게 <span className="font-mono bg-card px-1 rounded">수정 요청 처리해줘</span>라고 말하면
                아래 {corrections.length}건을 순서대로 처리합니다.
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
                            선지 {c.option_label}
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
                        <p className="text-xs text-muted italic">문제 데이터를 찾을 수 없습니다</p>
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
