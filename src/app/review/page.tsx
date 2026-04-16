"use client";

import { useState, useEffect } from "react";
import { getTodayReviewQuestionIds, getWrongAttemptsSummary, getStudyNotes, updateStudyNoteMemo, deleteStudyNote } from "@/lib/store";
import type { Question, StudyNote } from "@/lib/types";
import Link from "next/link";

export default function ReviewPage() {
  const [activeTab, setActiveTab] = useState<"review" | "notes">("review");
  const [reviewIds, setReviewIds] = useState<string[]>([]);
  const [wrongSummary, setWrongSummary] = useState<{ questionId: string; lastAttemptAt: string; attemptCount: number }[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNote, setEditingNote] = useState<{ id: string; memo: string } | null>(null);

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
      </div>

      {/* 오답 복습 탭 */}
      {activeTab === "review" && (
        <>
          <div className="bg-card rounded-xl border border-border p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-red-500">{wrongCount}</p>
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
              className="block w-full bg-primary text-white text-center py-3 rounded-xl font-medium mb-6"
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
                          isReviewDue ? "border-orange-300 bg-orange-50" : "border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs text-gray-700 leading-relaxed line-clamp-2 flex-1">
                            {q ? q.question_text.slice(0, 100) + (q.question_text.length > 100 ? "..." : "") : item.questionId}
                          </p>
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span className="text-[10px] text-red-500 font-medium">{item.attemptCount}회 오답</span>
                            {isReviewDue && (
                              <span className="text-[10px] text-orange-600 font-medium mt-0.5">복습 예정</span>
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
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 px-3 py-2 rounded-r">
                      <p className="text-xs text-gray-700 leading-relaxed">{note.selectedText}</p>
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
                            className="text-[10px] text-white bg-primary px-2 py-1 rounded"
                          >
                            저장
                          </button>
                        </div>
                      </div>
                    ) : (
                      note.memo && (
                        <p className="text-xs text-gray-600 leading-relaxed pl-1">{note.memo}</p>
                      )
                    )}

                    {/* 메타 정보 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-[10px] text-muted bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
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
                              className="text-[10px] text-red-400 font-medium"
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
    </div>
  );
}
