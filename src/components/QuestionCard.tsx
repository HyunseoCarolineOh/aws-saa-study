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
    showToast("> NOTE SAVED");
  }

  const isCorrect =
    submitted &&
    selectedAnswers.length === question.correct_answers.length &&
    selectedAnswers.every((a) => question.correct_answers.includes(a));

  const progressPct = ((questionIndex + 1) / totalQuestions) * 100;

  return (
    <div className={`max-w-lg mx-auto px-4 pt-4 pb-4 ${shakeOnWrong ? "animate-shake" : ""}`}>
      {/* HUD */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className="text-[10px] font-display px-2.5 py-1 tracking-widest"
          style={{
            background: "rgba(255, 46, 136, 0.14)",
            color: "var(--neon-pink)",
            border: "1px solid rgba(255, 46, 136, 0.45)",
            textShadow: "0 0 6px rgba(255, 46, 136, 0.6)",
          }}
        >
          Q {questionIndex + 1}/{totalQuestions}
        </span>
        <div className="flex-1 h-2 overflow-hidden" style={{ background: "rgba(10, 5, 20, 0.9)", border: "1px solid rgba(0, 240, 255, 0.4)" }}>
          <div
            className="h-full transition-[width] duration-500"
            style={{
              width: `${progressPct}%`,
              background: "linear-gradient(90deg, #ff2e88, #a855ff, #00f0ff)",
              boxShadow: "0 0 10px rgba(255, 46, 136, 0.5)",
            }}
          />
        </div>
        <ComboCounter combo={combo} />
      </div>

      {/* 문제 */}
      <div
        className="p-5 mb-4"
        style={{
          background: "rgba(18, 7, 38, 0.9)",
          border: "1.5px solid rgba(0, 240, 255, 0.3)",
          boxShadow: "0 0 18px rgba(0, 240, 255, 0.1), inset 0 0 20px rgba(0, 0, 0, 0.4)",
        }}
      >
        {isMultiSelect && (
          <span
            className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 font-display mb-3 tracking-widest"
            style={{
              background: "rgba(255, 238, 0, 0.14)",
              color: "var(--warning-fg)",
              border: "1px solid rgba(255, 238, 0, 0.45)",
              textShadow: "0 0 6px rgba(255, 238, 0, 0.5)",
            }}
          >
            ⚡ ×{selectCount} SELECT
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

          let btnStyle: React.CSSProperties = {
            background: "rgba(18, 7, 38, 0.8)",
            border: "1.5px solid var(--border)",
          };
          let labelBg = "transparent";
          let labelColor = "#8a6fb8";
          let labelBorder = "var(--border)";

          if (submitted) {
            if (isCorrectOption) {
              btnStyle = {
                background: "rgba(180, 255, 57, 0.1)",
                border: "1.5px solid rgba(180, 255, 57, 0.6)",
                boxShadow: "0 0 18px rgba(180, 255, 57, 0.3)",
              };
              labelBg = "#b4ff39";
              labelColor = "#0a0514";
              labelBorder = "#b4ff39";
            } else if (isSelected && !isCorrectOption) {
              btnStyle = {
                background: "rgba(255, 46, 136, 0.1)",
                border: "1.5px solid rgba(255, 46, 136, 0.6)",
                boxShadow: "0 0 18px rgba(255, 46, 136, 0.3)",
              };
              labelBg = "#ff2e88";
              labelColor = "#0a0514";
              labelBorder = "#ff2e88";
            }
          } else if (isSelected) {
            btnStyle = {
              background: "rgba(0, 240, 255, 0.1)",
              border: "1.5px solid rgba(0, 240, 255, 0.6)",
              boxShadow: "0 0 18px rgba(0, 240, 255, 0.3)",
            };
            labelBg = "#00f0ff";
            labelColor = "#0a0514";
            labelBorder = "#00f0ff";
          }

          return (
            <button
              key={opt.label}
              onClick={() => handleSelect(opt.label)}
              disabled={submitted}
              className="w-full text-left p-3.5 transition-all active:scale-[0.99]"
              style={btnStyle}
            >
              <div className="flex gap-3">
                <span
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-sm font-display font-bold"
                  style={{ background: labelBg, color: labelColor, border: `1.5px solid ${labelBorder}` }}
                >
                  {opt.label}
                </span>
                <span className="text-sm leading-relaxed pt-1">{opt.text}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 제출/다음 */}
      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={selectedAnswers.length === 0}
          className="w-full py-3.5 font-display font-bold tracking-widest disabled:opacity-40 active:scale-[0.97] transition-all text-on-primary"
          style={{
            background: "linear-gradient(135deg, #ff2e88 0%, #a855ff 100%)",
            color: "#0a0514",
            boxShadow: "0 0 24px rgba(255, 46, 136, 0.6)",
          }}
        >
          &gt; FIRE!
        </button>
      ) : (
        <div>
          <div
            className="text-center py-3.5 mb-3 font-display font-bold tracking-widest animate-pop-in"
            style={
              isCorrect
                ? {
                    background: "rgba(180, 255, 57, 0.12)",
                    border: "1.5px solid rgba(180, 255, 57, 0.5)",
                    color: "#d4ff7a",
                    textShadow: "0 0 10px rgba(180, 255, 57, 0.7)",
                    boxShadow: "0 0 20px rgba(180, 255, 57, 0.2)",
                  }
                : {
                    background: "rgba(255, 46, 136, 0.12)",
                    border: "1.5px solid rgba(255, 46, 136, 0.5)",
                    color: "#ff7ab0",
                    textShadow: "0 0 10px rgba(255, 46, 136, 0.7)",
                  }
            }
          >
            {isCorrect ? `HIT!! +1` : `MISS! ANS: ${question.correct_answers.join(",")}`}
          </div>

          {(question.explanation || question.detailed_explanation) && (
            <div
              className="mb-3 overflow-hidden"
              style={{
                background: "rgba(28, 14, 56, 0.9)",
                border: "1px solid rgba(168, 85, 255, 0.35)",
              }}
            >
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="w-full flex justify-between items-center p-3.5"
              >
                <span className="text-xs font-display tracking-widest text-accent-fg">&gt; INTEL LOG</span>
                <span className="text-[10px] text-muted font-display">{showExplanation ? "[-]" : "[+]"}</span>
              </button>

              {showExplanation && (
                <div style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="flex">
                    <TabButton active={explanationTab === "explanation"} onClick={() => setExplanationTab("explanation")}>
                      ANSWER
                    </TabButton>
                    <TabButton
                      active={explanationTab === "detail"}
                      onClick={() => setExplanationTab("detail")}
                      disabled={!question.detailed_explanation}
                    >
                      DETAIL
                    </TabButton>
                    <TabButton
                      active={explanationTab === "services"}
                      onClick={() => setExplanationTab("services")}
                      disabled={question.related_services.length === 0}
                    >
                      LINKS
                    </TabButton>
                  </div>

                  <div className="p-3.5">
                    {explanationTab === "explanation" && (
                      <TextSelectionPopover questionId={question.id} sourceContext="explanation" onSaveRequest={handleSaveRequest}>
                        <div className="text-sm leading-relaxed whitespace-pre-line">
                          {question.explanation || "NO DATA"}
                        </div>
                      </TextSelectionPopover>
                    )}

                    {explanationTab === "detail" && (
                      <TextSelectionPopover questionId={question.id} sourceContext="detail" onSaveRequest={handleSaveRequest}>
                        <div className="text-sm leading-relaxed whitespace-pre-line">
                          {question.detailed_explanation || (
                            <div className="text-center text-muted py-4 font-display text-xs">
                              <p className="mb-2">&gt; NO DETAIL DATA</p>
                              {question.source_url && (
                                <a
                                  href={question.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-neon-pink tracking-widest"
                                >
                                  SOURCE →
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
                            className="text-[11px] px-2.5 py-1 font-display tracking-widest"
                            style={{
                              background: "rgba(0, 240, 255, 0.12)",
                              color: "var(--info-fg)",
                              border: "1px solid rgba(0, 240, 255, 0.4)",
                            }}
                          >
                            {svc}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {question.source_url && (
                    <div style={{ borderTop: "1px solid var(--border)" }}>
                      <a
                        href={question.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center text-xs text-neon-pink font-display tracking-widest py-2"
                      >
                        &gt; SOURCE (TISTORY) →
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleNext}
            className="w-full py-3.5 font-display font-bold tracking-widest active:scale-[0.97] transition-all"
            style={{
              background: "linear-gradient(135deg, #00f0ff 0%, #a855ff 100%)",
              color: "#0a0514",
              boxShadow: "0 0 20px rgba(0, 240, 255, 0.5)",
            }}
          >
            &gt; NEXT ▶
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
          className="fixed bottom-20 left-1/2 -translate-x-1/2 text-xs px-4 py-2 z-50 animate-fade-in whitespace-nowrap font-display tracking-widest"
          style={{
            background: "rgba(10, 5, 20, 0.95)",
            color: "#b4ff39",
            border: "1px solid rgba(180, 255, 57, 0.5)",
            boxShadow: "0 0 18px rgba(180, 255, 57, 0.4)",
            textShadow: "0 0 6px rgba(180, 255, 57, 0.6)",
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
      className="flex-1 py-2.5 text-[10px] font-display tracking-widest transition-colors relative"
      style={{
        color: active ? "var(--neon-pink)" : disabled ? "rgba(138, 111, 184, 0.4)" : "var(--muted)",
        textShadow: active ? "0 0 6px rgba(255, 46, 136, 0.6)" : "none",
      }}
    >
      {children}
      {active && <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5" style={{ background: "var(--neon-pink)", boxShadow: "0 0 6px rgba(255, 46, 136, 0.8)" }} />}
    </button>
  );
}

function detectMultiSelectCount(text: string): number {
  if (/3개를?\s*선택|세\s*가지를?\s*선택|choose\s*3|select\s*3/i.test(text)) return 3;
  if (/2개를?\s*선택|두\s*(?:개를?|가지를?)\s*선택|choose\s*2|select\s*2/i.test(text)) return 2;
  return 1;
}
