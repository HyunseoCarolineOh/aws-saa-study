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
    showToast("오답노트에 저장했어요");
  }

  const isCorrect =
    submitted &&
    selectedAnswers.length === question.correct_answers.length &&
    selectedAnswers.every((a) => question.correct_answers.includes(a));

  const progressPct = ((questionIndex + 1) / totalQuestions) * 100;

  return (
    <div className={`max-w-lg mx-auto px-4 pt-4 pb-6 ${shakeOnWrong ? "animate-shake" : ""}`}>
      {/* HUD */}
      <div className="flex items-center gap-2.5 mb-4">
        <span
          className="pixel-badge"
          style={{
            background: "rgba(155, 188, 15, 0.16)",
            color: "var(--gb-green)",
            borderColor: "var(--gb-green)",
          }}
        >
          Q {questionIndex + 1} / {totalQuestions}
        </span>
        <div
          className="flex-1 h-2.5"
          style={{ background: "var(--gb-dark)", border: "2px solid var(--border)" }}
        >
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

      {/* 문제 윈도우 */}
      <article className="pixel-window p-5 mb-4">
        {isMultiSelect && (
          <span
            className="pixel-badge mb-3"
            style={{
              background: "var(--gold)",
              color: "var(--gb-dark)",
              borderColor: "var(--gb-dark)",
            }}
          >
            ⚡ {selectCount}개 선택
          </span>
        )}
        <TextSelectionPopover
          questionId={question.id}
          sourceContext="question"
          onSaveRequest={handleSaveRequest}
        >
          <p className="body-text whitespace-pre-line">{question.question_text}</p>
        </TextSelectionPopover>
      </article>

      {/* 선택지 */}
      <div className="space-y-2.5 mb-5">
        {question.options.map((opt) => {
          const isSelected = selectedAnswers.includes(opt.label);
          const isCorrectOption = question.correct_answers.includes(opt.label);

          let border = "2px solid var(--border)";
          let bg = "var(--card)";
          let shadow = "2px 2px 0 rgba(0, 0, 0, 0.35)";
          let labelBg = "var(--gb-dark)";
          let labelColor = "var(--muted)";

          if (submitted) {
            if (isCorrectOption) {
              border = "2px solid var(--gb-green)";
              bg = "rgba(155, 188, 15, 0.14)";
              shadow = "2px 2px 0 var(--gb-green)";
              labelBg = "var(--gb-green)";
              labelColor = "var(--gb-dark)";
            } else if (isSelected && !isCorrectOption) {
              border = "2px solid var(--blood)";
              bg = "rgba(184, 50, 50, 0.14)";
              shadow = "2px 2px 0 var(--blood)";
              labelBg = "var(--blood)";
              labelColor = "var(--parchment)";
            }
          } else if (isSelected) {
            border = "2px solid var(--mana)";
            bg = "rgba(91, 156, 216, 0.14)";
            shadow = "2px 2px 0 var(--mana)";
            labelBg = "var(--mana)";
            labelColor = "var(--gb-dark)";
          }

          return (
            <button
              key={opt.label}
              onClick={() => handleSelect(opt.label)}
              disabled={submitted}
              className="w-full text-left p-3.5 transition-transform active:translate-x-[1px] active:translate-y-[1px] disabled:cursor-default"
              style={{ background: bg, border, boxShadow: shadow, borderRadius: 0 }}
            >
              <div className="flex gap-3">
                <span
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center"
                  style={{
                    background: labelBg,
                    color: labelColor,
                    border: "2px solid var(--gb-dark)",
                    fontFamily: "var(--font-pixel)",
                    fontSize: 13,
                  }}
                >
                  {opt.label}
                </span>
                <span className="body-text flex-1 pt-0.5">{opt.text}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 액션 */}
      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={selectedAnswers.length === 0}
          className="pixel-btn pixel-btn-primary w-full py-3.5"
        >
          &gt; 정답 확인
        </button>
      ) : (
        <div>
          {/* 결과 배너 */}
          <div
            className="p-4 mb-3 text-center animate-pop-in"
            style={{
              background: isCorrect ? "rgba(155, 188, 15, 0.14)" : "rgba(184, 50, 50, 0.14)",
              border: `2px solid ${isCorrect ? "var(--gb-green)" : "var(--blood)"}`,
              boxShadow: `2px 2px 0 ${isCorrect ? "var(--gb-green)" : "var(--blood)"}`,
            }}
          >
            <p
              className="pixel-label mb-1"
              style={{ color: isCorrect ? "var(--gb-green)" : "var(--blood)" }}
            >
              {isCorrect ? "★ HIT! +1 EXP ★" : "× MISS ×"}
            </p>
            <p className="body-text" style={{ color: isCorrect ? "var(--success-fg)" : "var(--danger-fg)" }}>
              {isCorrect
                ? "정답이에요!"
                : `정답: ${question.correct_answers.join(", ")}`}
            </p>
          </div>

          {/* 풀이 */}
          {(question.explanation || question.detailed_explanation) && (
            <div className="pixel-panel mb-3 overflow-hidden" style={{ borderColor: "var(--accent-fg)" }}>
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="w-full flex justify-between items-center p-3.5"
              >
                <span className="section-title" style={{ color: "var(--accent-fg)" }}>
                  📖 풀이 보기
                </span>
                <span className="pixel-label text-muted">
                  {showExplanation ? "[ — ]" : "[ + ]"}
                </span>
              </button>

              {showExplanation && (
                <div style={{ borderTop: "2px solid var(--border)" }}>
                  {/* 탭 */}
                  <div className="flex" style={{ borderBottom: "2px solid var(--border)" }}>
                    <TabButton
                      active={explanationTab === "explanation"}
                      onClick={() => setExplanationTab("explanation")}
                    >
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

                  {/* 탭 콘텐츠 */}
                  <div className="p-4">
                    {explanationTab === "explanation" && (
                      <TextSelectionPopover
                        questionId={question.id}
                        sourceContext="explanation"
                        onSaveRequest={handleSaveRequest}
                      >
                        <div className="body-text whitespace-pre-line">
                          {question.explanation || "해설이 없어요."}
                        </div>
                      </TextSelectionPopover>
                    )}

                    {explanationTab === "detail" && (
                      <TextSelectionPopover
                        questionId={question.id}
                        sourceContext="detail"
                        onSaveRequest={handleSaveRequest}
                      >
                        <div className="body-text whitespace-pre-line">
                          {question.detailed_explanation || (
                            <div className="text-center body-sub py-4">
                              <p className="mb-2">상세 풀이가 아직 없어요</p>
                            </div>
                          )}
                        </div>
                      </TextSelectionPopover>
                    )}

                    {explanationTab === "services" && (
                      <div className="flex flex-wrap gap-2">
                        {question.related_services.map((svc) => (
                          <span
                            key={svc}
                            className="pixel-badge"
                            style={{
                              background: "rgba(91, 156, 216, 0.14)",
                              color: "var(--mana)",
                              borderColor: "var(--mana)",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {svc}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {question.saa_tip && explanationTab !== "services" && (
                    <div
                      className="px-4 py-3 body-sub"
                      style={{
                        borderTop: "2px dashed var(--border)",
                        background: "rgba(155, 188, 15, 0.06)",
                      }}
                    >
                      <p className="pixel-label mb-1" style={{ color: "var(--gb-green)" }}>
                        💡 SAA 시험 팁
                      </p>
                      <p className="whitespace-pre-line">{question.saa_tip}</p>
                    </div>
                  )}

                  {question.explanation_source && (
                    <p
                      className="text-center py-2 pixel-label text-muted"
                      style={{ borderTop: "2px dashed var(--border)", fontSize: "0.7rem" }}
                    >
                      ※ 본 해설은 AI({question.explanation_source})가 생성했습니다
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <button onClick={handleNext} className="pixel-btn pixel-btn-mana w-full py-3.5">
            &gt; 다음 문제 ►
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
          className="fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2.5 z-50 animate-fade-in whitespace-nowrap"
          style={{
            background: "var(--gb-dark)",
            color: "var(--gb-green)",
            border: "2px solid var(--gb-green)",
            boxShadow: "2px 2px 0 rgba(0, 0, 0, 0.6)",
            fontSize: 13,
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
      className="flex-1 py-3 text-center transition-colors"
      style={{
        background: active ? "rgba(155, 188, 15, 0.1)" : "transparent",
        color: active ? "var(--gb-green)" : disabled ? "rgba(160, 136, 104, 0.45)" : "var(--muted)",
        borderRight: "2px solid var(--border)",
        fontSize: 12.5,
        fontWeight: 600,
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
