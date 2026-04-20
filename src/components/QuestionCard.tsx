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
      setTimeout(() => setShakeOnWrong(false), 500);
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
    showToast("> SAVED!");
  }

  const isCorrect =
    submitted &&
    selectedAnswers.length === question.correct_answers.length &&
    selectedAnswers.every((a) => question.correct_answers.includes(a));

  const progressPct = ((questionIndex + 1) / totalQuestions) * 100;

  return (
    <div className={`max-w-lg mx-auto px-4 pt-4 pb-4 ${shakeOnWrong ? "animate-shake" : ""}`}>
      <div className="flex items-center gap-2 mb-4">
        <span
          className="text-[10px] font-display px-2 py-1"
          style={{
            background: "#0f380f",
            color: "#9bbc0f",
            border: "2px solid #9bbc0f",
          }}
        >
          Q{questionIndex + 1}/{totalQuestions}
        </span>
        <div className="flex-1 h-2" style={{ background: "#0f380f", border: "2px solid #5a4530" }}>
          <div
            className="h-full transition-[width] duration-300"
            style={{
              width: `${progressPct}%`,
              background: "linear-gradient(180deg, #d4e27a, #9bbc0f, #4a7a3c)",
            }}
          />
        </div>
        <ComboCounter combo={combo} />
      </div>

      <div className="p-4 mb-4 pixel-window">
        {isMultiSelect && (
          <span
            className="inline-block text-[10px] px-2 py-0.5 font-display mb-3"
            style={{
              background: "#e8b923",
              color: "#1a1410",
              border: "2px solid #1a1410",
            }}
          >
            ⚡ PICK {selectCount}
          </span>
        )}
        <TextSelectionPopover questionId={question.id} sourceContext="question" onSaveRequest={handleSaveRequest}>
          <p className="text-sm leading-relaxed whitespace-pre-line font-retro text-parchment">
            {question.question_text}
          </p>
        </TextSelectionPopover>
      </div>

      <div className="space-y-2 mb-4">
        {question.options.map((opt) => {
          const isSelected = selectedAnswers.includes(opt.label);
          const isCorrectOption = question.correct_answers.includes(opt.label);

          let btnStyle: React.CSSProperties = {
            background: "#2a1f17",
            border: "2px solid #5a4530",
            boxShadow: "2px 2px 0 rgba(0,0,0,0.4)",
          };
          let labelBg = "#0f380f";
          let labelColor = "#8a7050";

          if (submitted) {
            if (isCorrectOption) {
              btnStyle = {
                background: "rgba(155, 188, 15, 0.15)",
                border: "2px solid #9bbc0f",
                boxShadow: "2px 2px 0 #9bbc0f",
              };
              labelBg = "#9bbc0f";
              labelColor = "#0f380f";
            } else if (isSelected && !isCorrectOption) {
              btnStyle = {
                background: "rgba(184, 50, 50, 0.15)",
                border: "2px solid #b83232",
                boxShadow: "2px 2px 0 #b83232",
              };
              labelBg = "#b83232";
              labelColor = "#e6d3a3";
            }
          } else if (isSelected) {
            btnStyle = {
              background: "rgba(91, 156, 216, 0.15)",
              border: "2px solid #5b9cd8",
              boxShadow: "2px 2px 0 #5b9cd8",
            };
            labelBg = "#5b9cd8";
            labelColor = "#1a1410";
          }

          return (
            <button
              key={opt.label}
              onClick={() => handleSelect(opt.label)}
              disabled={submitted}
              className="w-full text-left p-3 transition-transform active:translate-x-[1px] active:translate-y-[1px]"
              style={btnStyle}
            >
              <div className="flex gap-3">
                <span
                  className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-sm font-display font-bold"
                  style={{ background: labelBg, color: labelColor, border: "2px solid #1a1410" }}
                >
                  {opt.label}
                </span>
                <span className="text-sm leading-relaxed font-retro pt-0.5">{opt.text}</span>
              </div>
            </button>
          );
        })}
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={selectedAnswers.length === 0}
          className="w-full py-3 font-display font-bold text-sm disabled:opacity-40 transition-transform pixel-button disabled:cursor-not-allowed"
          style={{ letterSpacing: "0.1em" }}
        >
          &gt; ATTACK!
        </button>
      ) : (
        <div>
          <div
            className="text-center py-3 mb-3 font-display font-bold animate-pop-in"
            style={
              isCorrect
                ? {
                    background: "rgba(155, 188, 15, 0.15)",
                    border: "2px solid #9bbc0f",
                    color: "#d4e27a",
                    boxShadow: "2px 2px 0 #9bbc0f",
                  }
                : {
                    background: "rgba(184, 50, 50, 0.15)",
                    border: "2px solid #b83232",
                    color: "#e86060",
                    boxShadow: "2px 2px 0 #b83232",
                  }
            }
          >
            {isCorrect ? `★ HIT! +1 EXP ★` : `× MISS! ANS: ${question.correct_answers.join(",")}`}
          </div>

          {(question.explanation || question.detailed_explanation) && (
            <div className="mb-3 pixel-panel overflow-hidden" style={{ borderColor: "#c4a4e0" }}>
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="w-full flex justify-between items-center p-3"
              >
                <span className="text-[11px] font-display text-accent-fg">▼ INTEL BOOK</span>
                <span className="text-[10px] text-muted font-display">{showExplanation ? "[-]" : "[+]"}</span>
              </button>

              {showExplanation && (
                <div style={{ borderTop: "2px solid var(--border)" }}>
                  <div className="flex" style={{ borderBottom: "2px solid var(--border)" }}>
                    <TabButton active={explanationTab === "explanation"} onClick={() => setExplanationTab("explanation")}>
                      ANS
                    </TabButton>
                    <TabButton
                      active={explanationTab === "detail"}
                      onClick={() => setExplanationTab("detail")}
                      disabled={!question.detailed_explanation}
                    >
                      MORE
                    </TabButton>
                    <TabButton
                      active={explanationTab === "services"}
                      onClick={() => setExplanationTab("services")}
                      disabled={question.related_services.length === 0}
                    >
                      ITEMS
                    </TabButton>
                  </div>

                  <div className="p-3">
                    {explanationTab === "explanation" && (
                      <TextSelectionPopover questionId={question.id} sourceContext="explanation" onSaveRequest={handleSaveRequest}>
                        <div className="text-sm leading-relaxed whitespace-pre-line font-retro">
                          {question.explanation || "NO DATA"}
                        </div>
                      </TextSelectionPopover>
                    )}

                    {explanationTab === "detail" && (
                      <TextSelectionPopover questionId={question.id} sourceContext="detail" onSaveRequest={handleSaveRequest}>
                        <div className="text-sm leading-relaxed whitespace-pre-line font-retro">
                          {question.detailed_explanation || (
                            <div className="text-center text-muted py-4 font-display text-xs">
                              <p className="mb-2">&gt; NO DATA</p>
                              {question.source_url && (
                                <a href={question.source_url} target="_blank" rel="noopener noreferrer" className="text-gb-green">
                                  SOURCE ►
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
                            className="text-[10px] px-2 py-0.5 font-display"
                            style={{
                              background: "#0f380f",
                              color: "#8fc0e8",
                              border: "2px solid #5b9cd8",
                            }}
                          >
                            {svc}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {question.source_url && (
                    <div style={{ borderTop: "2px dashed var(--border)" }}>
                      <a
                        href={question.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center text-[11px] text-gb-green font-display py-2"
                      >
                        &gt; SOURCE (TISTORY) ►
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleNext}
            className="w-full py-3 font-display font-bold text-sm pixel-button"
            style={{
              letterSpacing: "0.1em",
              background: "#5b9cd8",
              borderColor: "#1a1410",
              color: "#e6d3a3",
              boxShadow: "2px 2px 0 #1a1410",
            }}
          >
            &gt; NEXT ►
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
          className="fixed bottom-20 left-1/2 -translate-x-1/2 text-xs px-3 py-2 z-50 animate-fade-in whitespace-nowrap font-display"
          style={{
            background: "#0f380f",
            color: "#9bbc0f",
            border: "2px solid #9bbc0f",
            boxShadow: "2px 2px 0 rgba(0,0,0,0.6)",
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
      className="flex-1 py-2 text-[10px] font-display transition-colors"
      style={{
        color: active ? "#9bbc0f" : disabled ? "rgba(138, 112, 80, 0.4)" : "var(--muted)",
        background: active ? "rgba(155, 188, 15, 0.15)" : "transparent",
        borderRight: "2px solid var(--border)",
      }}
    >
      {children}
    </button>
  );
}

function detectMultiSelectCount(text: string): number {
  if (/3개를?\s*선택|세\s*가지를?\s*선택|choose\s*3|select\s*3/i.test(text)) return 3;
  if (/2개를?\s*선택|두\s*(?:개를?|가지를?)\s*선택|choose\s*2|select\s*2/i.test(text)) return 2;
  return 1;
}
