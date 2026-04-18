"use client";

import { useState, useEffect, useRef } from "react";
import type { Question } from "@/lib/types";
import { addAttempt } from "@/lib/store";
import { celebrateCorrect } from "@/lib/celebrate";
import TextSelectionPopover from "./TextSelectionPopover";
import StudyNoteMemoSheet from "./StudyNoteMemoSheet";

interface QuestionCardProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  onNext: () => void;
}

export default function QuestionCard({
  question,
  questionIndex,
  totalQuestions,
  onNext,
}: QuestionCardProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanationTab, setExplanationTab] = useState<"explanation" | "detail" | "services">("explanation");
  const [memoSheet, setMemoSheet] = useState<{
    selectedText: string;
    sourceContext: "question" | "explanation" | "detail";
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const timerRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  // 문제 변경 시 리셋
  useEffect(() => {
    setSelectedAnswers([]);
    setSubmitted(false);
    setShowExplanation(false);
    setExplanationTab("explanation");
    setMemoSheet(null);
    startTimeRef.current = Date.now();
  }, [question.id]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  function showToast(msg: string) {
    setToastMessage(msg);
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(null), 2000);
  }

  // 타이머 업데이트
  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => {
      timerRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted]);

  // 문제 텍스트에서 복수선택 감지
  const expectedSelectCount = detectMultiSelectCount(question.question_text);
  const isMultiSelect = expectedSelectCount > 1 || question.correct_answers.length > 1;
  const selectCount = Math.max(expectedSelectCount, question.correct_answers.length);

  function handleSelect(label: string) {
    if (submitted) return;
    if (isMultiSelect) {
      setSelectedAnswers((prev) => {
        if (prev.includes(label)) {
          return prev.filter((a) => a !== label);
        }
        // 선택 개수 제한
        if (prev.length >= selectCount) {
          return [...prev.slice(1), label];
        }
        return [...prev, label];
      });
    } else {
      setSelectedAnswers([label]);
    }
  }

  function handleSubmit() {
    if (selectedAnswers.length === 0) return;
    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const isCorrect =
      selectedAnswers.length === question.correct_answers.length &&
      selectedAnswers.every((a) => question.correct_answers.includes(a));

    addAttempt({
      question_id: question.id,
      selected_answers: selectedAnswers,
      is_correct: isCorrect,
      time_spent_seconds: timeSpent,
    });

    if (isCorrect) {
      void celebrateCorrect();
    }

    setSubmitted(true);
  }

  function handleNext() {
    onNext();
  }

  function handleSaveRequest(selectedText: string, sourceContext: "question" | "explanation" | "detail") {
    setMemoSheet({ selectedText, sourceContext });
  }

  function handleNoteSaved() {
    setMemoSheet(null);
    showToast("오답노트에 저장되었습니다");
  }

  const isCorrect =
    submitted &&
    selectedAnswers.length === question.correct_answers.length &&
    selectedAnswers.every((a) => question.correct_answers.includes(a));

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-4">
      {/* 진행 바 */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-muted font-medium">
          {questionIndex + 1} / {totalQuestions}
        </span>
        <div className="flex-1 bg-border rounded-full h-1.5">
          <div
            className="bg-primary rounded-full h-1.5 transition-all"
            style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* 문제 */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        {isMultiSelect && (
          <span className="inline-block text-xs bg-warning-bg text-warning-fg border border-warning-border px-2 py-0.5 rounded mb-2">
            {selectCount}개 선택
          </span>
        )}
        <TextSelectionPopover questionId={question.id} sourceContext="question" onSaveRequest={handleSaveRequest}>
          <p className="text-sm leading-relaxed whitespace-pre-line">{question.question_text}</p>
        </TextSelectionPopover>
      </div>

      {/* 선택지 */}
      <div className="space-y-2 mb-4">
        {question.options.map((opt) => {
          const isSelected = selectedAnswers.includes(opt.label);
          const isCorrectOption = question.correct_answers.includes(opt.label);
          let borderColor = "border-border";
          let bgColor = "bg-card";

          if (submitted) {
            if (isCorrectOption) {
              borderColor = "border-success";
              bgColor = "bg-success-bg";
            } else if (isSelected && !isCorrectOption) {
              borderColor = "border-danger";
              bgColor = "bg-danger-bg";
            }
          } else if (isSelected) {
            borderColor = "border-primary";
            bgColor = "bg-info-bg";
          }

          return (
            <button
              key={opt.label}
              onClick={() => handleSelect(opt.label)}
              disabled={submitted}
              className={`w-full text-left ${bgColor} rounded-xl border-2 ${borderColor} p-3 transition-all active:scale-[0.99]`}
            >
              <div className="flex gap-3">
                <span
                  className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                    submitted && isCorrectOption
                      ? "bg-success text-on-primary"
                      : submitted && isSelected && !isCorrectOption
                      ? "bg-danger text-on-primary"
                      : isSelected
                      ? "bg-primary text-on-primary"
                      : "bg-muted-bg text-muted"
                  }`}
                >
                  {opt.label}
                </span>
                <span className="text-sm leading-relaxed">{opt.text}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 제출/다음 버튼 */}
      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={selectedAnswers.length === 0}
          className="w-full bg-primary text-on-primary py-3 rounded-xl font-medium disabled:opacity-40 active:scale-[0.98] transition-all"
        >
          정답 확인
        </button>
      ) : (
        <div>
          {/* 결과 */}
          <div
            className={`text-center py-3 rounded-xl mb-3 font-medium ${
              isCorrect ? "bg-success-bg text-success-fg border border-success-border" : "bg-danger-bg text-danger-fg border border-danger-border"
            }`}
          >
            {isCorrect ? "정답입니다!" : `오답입니다. 정답: ${question.correct_answers.join(", ")}`}
          </div>

          {/* 풀이 해설 */}
          {(question.explanation || question.detailed_explanation) && (
            <div className="bg-card-elevated rounded-xl border border-border mb-3 overflow-hidden">
              {/* 토글 헤더 */}
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="w-full flex justify-between items-center p-3"
              >
                <span className="text-sm font-medium">풀이 보기</span>
                <span className="text-xs text-muted">{showExplanation ? "접기" : "펼치기"}</span>
              </button>

              {showExplanation && (
                <div className="border-t border-border">
                  {/* 탭 */}
                  <div className="flex border-b border-border">
                    <button
                      onClick={() => setExplanationTab("explanation")}
                      className={`flex-1 py-2 text-xs font-medium transition-colors ${
                        explanationTab === "explanation"
                          ? "text-primary border-b-2 border-primary"
                          : "text-muted"
                      }`}
                    >
                      정답 해설
                    </button>
                    <button
                      onClick={() => setExplanationTab("detail")}
                      disabled={!question.detailed_explanation}
                      className={`flex-1 py-2 text-xs font-medium transition-colors ${
                        explanationTab === "detail"
                          ? "text-primary border-b-2 border-primary"
                          : !question.detailed_explanation
                          ? "text-muted opacity-50"
                          : "text-muted"
                      }`}
                    >
                      상세 풀이
                    </button>
                    <button
                      onClick={() => setExplanationTab("services")}
                      disabled={question.related_services.length === 0}
                      className={`flex-1 py-2 text-xs font-medium transition-colors ${
                        explanationTab === "services"
                          ? "text-primary border-b-2 border-primary"
                          : question.related_services.length === 0
                          ? "text-muted opacity-50"
                          : "text-muted"
                      }`}
                    >
                      관련 서비스
                    </button>
                  </div>

                  {/* 탭 콘텐츠 */}
                  <div className="p-3">
                    {explanationTab === "explanation" && (
                      <TextSelectionPopover questionId={question.id} sourceContext="explanation" onSaveRequest={handleSaveRequest}>
                        <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                          {question.explanation || "해설이 없습니다."}
                        </div>
                      </TextSelectionPopover>
                    )}

                    {explanationTab === "detail" && (
                      <TextSelectionPopover questionId={question.id} sourceContext="detail" onSaveRequest={handleSaveRequest}>
                        <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                          {question.detailed_explanation || (
                            <div className="text-center text-muted py-4">
                              <p className="mb-2">상세 풀이가 아직 없습니다.</p>
                              {question.source_url && (
                                <a
                                  href={question.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary text-xs font-medium"
                                >
                                  원본 블로그에서 확인 &rarr;
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </TextSelectionPopover>
                    )}

                    {explanationTab === "services" && (
                      <div className="space-y-2">
                        {question.related_services.map((svc) => (
                          <div key={svc} className="flex items-center gap-2">
                            <span className="text-xs bg-info-bg text-info-fg border border-info-border px-2 py-0.5 rounded font-medium">
                              {svc}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 원본 링크 */}
                  {question.source_url && (
                    <div className="border-t border-border p-2">
                      <a
                        href={question.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center text-xs text-primary font-medium py-1"
                      >
                        원본 풀이 보기 (Tistory) &rarr;
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleNext}
            className="w-full bg-primary text-on-primary py-3 rounded-xl font-medium active:scale-[0.98] transition-all"
          >
            다음 문제
          </button>
        </div>
      )}

      {/* 오답노트 메모 시트 */}
      {memoSheet && (
        <StudyNoteMemoSheet
          isOpen
          selectedText={memoSheet.selectedText}
          questionId={question.id}
          sourceContext={memoSheet.sourceContext}
          onClose={() => setMemoSheet(null)}
          onSaved={handleNoteSaved}
        />
      )}

      {/* 알림 토스트 */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-success text-on-primary text-sm px-4 py-2 rounded-xl shadow-lg z-50 animate-fade-in whitespace-nowrap">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

function detectMultiSelectCount(text: string): number {
  if (/3개를?\s*선택|세\s*가지를?\s*선택|choose\s*3|select\s*3/i.test(text)) return 3;
  if (/2개를?\s*선택|두\s*(?:개를?|가지를?)\s*선택|choose\s*2|select\s*2/i.test(text)) return 2;
  return 1;
}
