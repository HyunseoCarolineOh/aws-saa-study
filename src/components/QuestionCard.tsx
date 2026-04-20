"use client";

import { useState, useEffect, useRef } from "react";
import type { Question } from "@/lib/types";
import { addAttempt } from "@/lib/store";
import { celebrateCorrect } from "@/lib/celebrate";
import TextSelectionPopover from "./TextSelectionPopover";
import StudyNoteMemoSheet from "./StudyNoteMemoSheet";
import ComboCounter from "./game/ComboCounter";

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
  const [combo, setCombo] = useState(0);
  const [shakeOnWrong, setShakeOnWrong] = useState(false);
  const toastTimerRef = useRef<number | null>(null);
  const timerRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    setSelectedAnswers([]);
    setSubmitted(false);
    setShowExplanation(false);
    setExplanationTab("explanation");
    setMemoSheet(null);
    setShakeOnWrong(false);
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

  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => {
      timerRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted]);

  const expectedSelectCount = detectMultiSelectCount(question.question_text);
  const isMultiSelect = expectedSelectCount > 1 || question.correct_answers.length > 1;
  const selectCount = Math.max(expectedSelectCount, question.correct_answers.length);

  function handleSelect(label: string) {
    if (submitted) return;
    if (isMultiSelect) {
      setSelectedAnswers((prev) => {
        if (prev.includes(label)) return prev.filter((a) => a !== label);
        if (prev.length >= selectCount) return [...prev.slice(1), label];
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
      setCombo((c) => c + 1);
    } else {
      setCombo(0);
      setShakeOnWrong(true);
      setTimeout(() => setShakeOnWrong(false), 400);
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
    showToast("노트에 저장했어요! 🎀");
  }

  const isCorrect =
    submitted &&
    selectedAnswers.length === question.correct_answers.length &&
    selectedAnswers.every((a) => question.correct_answers.includes(a));

  const progressPct = ((questionIndex + 1) / totalQuestions) * 100;

  return (
    <div className={`max-w-lg mx-auto px-4 pt-4 pb-4 ${shakeOnWrong ? "animate-shake" : ""}`}>
      <div className="flex items-center gap-3 mb-4">
        <span
          className="text-xs font-black px-3 py-1.5 rounded-full text-on-primary"
          style={{
            background: "linear-gradient(135deg, #ff6b9d, #c86fff)",
            boxShadow: "0 4px 12px rgba(255, 107, 157, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
          }}
        >
          Q {questionIndex + 1} / {totalQuestions}
        </span>
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(15, 8, 35, 0.8)" }}>
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${progressPct}%`,
              background: "linear-gradient(90deg, #ff6b9d, #c86fff, #4adede)",
              boxShadow: "0 0 12px rgba(255, 107, 157, 0.5)",
            }}
          />
        </div>
        <ComboCounter combo={combo} />
      </div>

      <div className="jelly-card p-5 mb-4">
        {isMultiSelect && (
          <span
            className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-black mb-3 text-on-primary"
            style={{
              background: "linear-gradient(135deg, #ffe156, #ffa040)",
              boxShadow: "0 3px 10px rgba(255, 160, 64, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
            }}
          >
            ⚡ {selectCount}개 선택
          </span>
        )}
        <TextSelectionPopover questionId={question.id} sourceContext="question" onSaveRequest={handleSaveRequest}>
          <p className="text-sm leading-relaxed whitespace-pre-line">{question.question_text}</p>
        </TextSelectionPopover>
      </div>

      <div className="space-y-2.5 mb-4">
        {question.options.map((opt) => {
          const isSelected = selectedAnswers.includes(opt.label);
          const isCorrectOption = question.correct_answers.includes(opt.label);

          let btnStyle: React.CSSProperties = {
            background: "linear-gradient(145deg, rgba(26, 18, 56, 0.9), rgba(35, 24, 80, 0.9))",
            border: "1.5px solid rgba(255, 255, 255, 0.06)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          };
          let labelStyle: React.CSSProperties = {
            background: "rgba(255, 255, 255, 0.05)",
            color: "var(--muted)",
          };

          if (submitted) {
            if (isCorrectOption) {
              btnStyle = {
                background: "linear-gradient(135deg, rgba(123, 255, 154, 0.14), rgba(74, 222, 222, 0.1))",
                border: "1.5px solid rgba(123, 255, 154, 0.55)",
                boxShadow: "0 6px 20px rgba(123, 255, 154, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
              };
              labelStyle = {
                background: "linear-gradient(135deg, #7bff9a, #4adede)",
                color: "#0d0823",
                boxShadow: "0 3px 8px rgba(123, 255, 154, 0.4)",
              };
            } else if (isSelected && !isCorrectOption) {
              btnStyle = {
                background: "linear-gradient(135deg, rgba(255, 77, 143, 0.14), rgba(200, 111, 255, 0.1))",
                border: "1.5px solid rgba(255, 77, 143, 0.55)",
              };
              labelStyle = {
                background: "linear-gradient(135deg, #ff4d8f, #c86fff)",
                color: "#ffffff",
              };
            }
          } else if (isSelected) {
            btnStyle = {
              background: "linear-gradient(135deg, rgba(255, 107, 157, 0.16), rgba(200, 111, 255, 0.12))",
              border: "1.5px solid rgba(255, 107, 157, 0.55)",
              boxShadow: "0 6px 20px rgba(255, 107, 157, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
            };
            labelStyle = {
              background: "linear-gradient(135deg, #ff6b9d, #c86fff)",
              color: "#ffffff",
              boxShadow: "0 3px 8px rgba(255, 107, 157, 0.4)",
            };
          }

          return (
            <button
              key={opt.label}
              onClick={() => handleSelect(opt.label)}
              disabled={submitted}
              className="w-full text-left rounded-[20px] p-3.5 transition-all active:scale-[0.98]"
              style={btnStyle}
            >
              <div className="flex gap-3">
                <span
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
                  style={labelStyle}
                >
                  {opt.label}
                </span>
                <span className="text-sm leading-relaxed pt-1">{opt.text}</span>
              </div>
            </button>
          );
        })}
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={selectedAnswers.length === 0}
          className="w-full py-4 rounded-[20px] font-black text-base disabled:opacity-40 active:scale-[0.97] active:translate-y-1 transition-all text-on-primary"
          style={{
            background: "linear-gradient(135deg, #ff6b9d 0%, #c86fff 100%)",
            boxShadow:
              "0 12px 28px -4px rgba(255, 107, 157, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.15)",
          }}
        >
          제출! 🎯
        </button>
      ) : (
        <div>
          <div
            className="text-center py-4 rounded-[20px] mb-3 font-black animate-pop-in text-on-primary"
            style={
              isCorrect
                ? {
                    background: "linear-gradient(135deg, #7bff9a, #4adede)",
                    boxShadow:
                      "0 10px 26px -4px rgba(123, 255, 154, 0.45), inset 0 2px 0 rgba(255, 255, 255, 0.3)",
                    color: "#0d0823",
                  }
                : {
                    background: "linear-gradient(135deg, #ff4d8f, #c86fff)",
                    boxShadow:
                      "0 10px 26px -4px rgba(255, 77, 143, 0.45), inset 0 2px 0 rgba(255, 255, 255, 0.3)",
                  }
            }
          >
            {isCorrect ? `🎉 정답이에요! 대단해요!` : `💥 아쉬워요! 정답: ${question.correct_answers.join(", ")}`}
          </div>

          {(question.explanation || question.detailed_explanation) && (
            <div className="jelly-card mb-3 overflow-hidden">
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="w-full flex justify-between items-center p-4"
              >
                <span className="text-sm font-black text-jelly-purple">📖 풀이 보기</span>
                <span className="text-xs text-muted font-bold">{showExplanation ? "접기" : "펼치기"}</span>
              </button>

              {showExplanation && (
                <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
                  <div className="flex" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <TabButton active={explanationTab === "explanation"} onClick={() => setExplanationTab("explanation")}>
                      정답 해설
                    </TabButton>
                    <TabButton
                      active={explanationTab === "detail"}
                      onClick={() => setExplanationTab("detail")}
                      disabled={!question.detailed_explanation}
                    >
                      상세 풀이
                    </TabButton>
                    <TabButton
                      active={explanationTab === "services"}
                      onClick={() => setExplanationTab("services")}
                      disabled={question.related_services.length === 0}
                    >
                      관련 서비스
                    </TabButton>
                  </div>

                  <div className="p-4">
                    {explanationTab === "explanation" && (
                      <TextSelectionPopover questionId={question.id} sourceContext="explanation" onSaveRequest={handleSaveRequest}>
                        <div className="text-sm leading-relaxed whitespace-pre-line">
                          {question.explanation || "해설이 없습니다."}
                        </div>
                      </TextSelectionPopover>
                    )}

                    {explanationTab === "detail" && (
                      <TextSelectionPopover questionId={question.id} sourceContext="detail" onSaveRequest={handleSaveRequest}>
                        <div className="text-sm leading-relaxed whitespace-pre-line">
                          {question.detailed_explanation || (
                            <div className="text-center text-muted py-4">
                              <p className="mb-2">상세 풀이가 아직 없어요 🎀</p>
                              {question.source_url && (
                                <a
                                  href={question.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-jelly-pink text-xs font-black"
                                >
                                  원본에서 확인 →
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </TextSelectionPopover>
                    )}

                    {explanationTab === "services" && (
                      <div className="flex flex-wrap gap-1.5">
                        {question.related_services.map((svc) => (
                          <span
                            key={svc}
                            className="text-xs px-3 py-1 rounded-full font-black text-on-primary"
                            style={{
                              background: "linear-gradient(135deg, #4adede, #7b61ff)",
                              boxShadow: "0 3px 10px rgba(74, 222, 222, 0.35)",
                            }}
                          >
                            {svc}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {question.source_url && (
                    <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
                      <a
                        href={question.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center text-xs text-jelly-pink font-black py-2"
                      >
                        원본 풀이 보기 (Tistory) →
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleNext}
            className="w-full py-4 rounded-[20px] font-black text-base active:scale-[0.97] active:translate-y-1 transition-all text-on-primary"
            style={{
              background: "linear-gradient(135deg, #4adede 0%, #7b61ff 100%)",
              boxShadow:
                "0 12px 28px -4px rgba(74, 222, 222, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.15)",
            }}
          >
            다음 문제 ▶
          </button>
        </div>
      )}

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

      {toastMessage && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 text-sm px-4 py-2 rounded-full z-50 animate-fade-in whitespace-nowrap font-black text-on-primary"
          style={{
            background: "linear-gradient(135deg, #7bff9a, #4adede)",
            boxShadow: "0 10px 26px -4px rgba(123, 255, 154, 0.45), inset 0 2px 0 rgba(255, 255, 255, 0.3)",
            color: "#0d0823",
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex-1 py-3 text-xs font-black transition-colors relative"
      style={{
        color: active ? "var(--jelly-pink)" : disabled ? "rgba(168, 150, 216, 0.4)" : "var(--muted)",
      }}
    >
      {children}
      {active && (
        <span
          className="absolute bottom-0 left-1/3 right-1/3 h-0.5 rounded-full"
          style={{ background: "linear-gradient(90deg, #ff6b9d, #c86fff)" }}
        />
      )}
    </button>
  );
}

function detectMultiSelectCount(text: string): number {
  if (/3개를?\s*선택|세\s*가지를?\s*선택|choose\s*3|select\s*3/i.test(text)) return 3;
  if (/2개를?\s*선택|두\s*(?:개를?|가지를?)\s*선택|choose\s*2|select\s*2/i.test(text)) return 2;
  return 1;
}
