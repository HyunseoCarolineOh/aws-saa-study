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
    showToast("오답노트에 저장했어요 🍡");
  }

  const isCorrect =
    submitted &&
    selectedAnswers.length === question.correct_answers.length &&
    selectedAnswers.every((a) => question.correct_answers.includes(a));

  const progressPct = ((questionIndex + 1) / totalQuestions) * 100;

  return (
    <div className={`max-w-lg mx-auto px-4 pt-4 pb-4 ${shakeOnWrong ? "animate-shake" : ""}`}>
      {/* 상단 HUD */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-display font-bold text-rose bg-rose/10 px-2.5 py-1 rounded-full border border-rose/30">
          Q {questionIndex + 1} / {totalQuestions}
        </span>
        <div className="flex-1 bg-muted-bg rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${progressPct}%`,
              background: "linear-gradient(90deg, #ffb4c6, #c8b4ff, #a8dcff)",
              boxShadow: "0 0 10px rgba(255,180,198,0.4)",
            }}
          />
        </div>
        <ComboCounter combo={combo} />
      </div>

      {/* 문제 카드 */}
      <div
        className="rounded-3xl p-5 mb-4 bubble-shadow"
        style={{
          background: "linear-gradient(135deg, rgba(37,32,58,0.9), rgba(46,40,73,0.9))",
          border: "1px solid rgba(200,180,255,0.22)",
        }}
      >
        {isMultiSelect && (
          <span
            className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-display font-bold mb-3"
            style={{
              background: "rgba(255,226,122,0.18)",
              color: "var(--warning-fg)",
              border: "1px solid rgba(255,226,122,0.45)",
            }}
          >
            ⚡ {selectCount}개 선택
          </span>
        )}
        <TextSelectionPopover questionId={question.id} sourceContext="question" onSaveRequest={handleSaveRequest}>
          <p className="text-sm leading-relaxed whitespace-pre-line">{question.question_text}</p>
        </TextSelectionPopover>
      </div>

      {/* 선택지 */}
      <div className="space-y-2.5 mb-4">
        {question.options.map((opt) => {
          const isSelected = selectedAnswers.includes(opt.label);
          const isCorrectOption = question.correct_answers.includes(opt.label);

          let cardStyle: React.CSSProperties = {
            background: "rgba(37,32,58,0.7)",
            border: "1.5px solid var(--border)",
          };
          let labelBg = "var(--muted-bg)";
          let labelColor = "var(--muted)";

          if (submitted) {
            if (isCorrectOption) {
              cardStyle = {
                background: "linear-gradient(135deg, rgba(180,242,225,0.18), rgba(180,242,225,0.06))",
                border: "1.5px solid rgba(180,242,225,0.6)",
                boxShadow: "0 0 20px rgba(180,242,225,0.22)",
              };
              labelBg = "var(--pastel-mint)";
              labelColor = "#1a2e26";
            } else if (isSelected && !isCorrectOption) {
              cardStyle = {
                background: "linear-gradient(135deg, rgba(255,159,181,0.18), rgba(255,159,181,0.06))",
                border: "1.5px solid rgba(255,159,181,0.6)",
              };
              labelBg = "var(--danger)";
              labelColor = "#2b1a20";
            }
          } else if (isSelected) {
            cardStyle = {
              background: "linear-gradient(135deg, rgba(255,180,198,0.18), rgba(200,180,255,0.12))",
              border: "1.5px solid rgba(255,180,198,0.55)",
              boxShadow: "0 0 18px rgba(255,180,198,0.25)",
            };
            labelBg = "var(--pastel-rose)";
            labelColor = "#2b1a20";
          }

          return (
            <button
              key={opt.label}
              onClick={() => handleSelect(opt.label)}
              disabled={submitted}
              className="w-full text-left rounded-3xl p-3.5 transition-all active:scale-[0.98]"
              style={cardStyle}
            >
              <div className="flex gap-3">
                <span
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-display font-black"
                  style={{ background: labelBg, color: labelColor }}
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
          className="w-full py-3.5 rounded-3xl font-display font-bold disabled:opacity-40 active:scale-[0.97] transition-all text-on-primary"
          style={{
            background: "linear-gradient(135deg, #ffb4c6 0%, #c8b4ff 100%)",
            boxShadow: "0 8px 24px rgba(255,180,198,0.35)",
          }}
        >
          제출하기 ✨
        </button>
      ) : (
        <div>
          {/* 결과 배너 */}
          <div
            className="text-center py-3.5 rounded-3xl mb-3 font-display font-bold animate-pop-in"
            style={
              isCorrect
                ? {
                    background: "linear-gradient(135deg, rgba(180,242,225,0.2), rgba(168,220,255,0.2))",
                    border: "1.5px solid rgba(180,242,225,0.5)",
                    color: "var(--success-fg)",
                  }
                : {
                    background: "linear-gradient(135deg, rgba(255,159,181,0.18), rgba(200,180,255,0.12))",
                    border: "1.5px solid rgba(255,159,181,0.5)",
                    color: "var(--danger-fg)",
                  }
            }
          >
            {isCorrect ? "✨ 맞췄어! 완벽해!" : `💥 아쉬워! 정답: ${question.correct_answers.join(", ")}`}
          </div>

          {/* 풀이 */}
          {(question.explanation || question.detailed_explanation) && (
            <div
              className="rounded-3xl mb-3 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(46,40,73,0.9), rgba(37,32,58,0.9))",
                border: "1px solid rgba(200,180,255,0.2)",
              }}
            >
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="w-full flex justify-between items-center p-3.5"
              >
                <span className="text-sm font-display font-bold text-lavender">📖 풀이 보기</span>
                <span className="text-xs text-muted">{showExplanation ? "접기" : "펼치기"}</span>
              </button>

              {showExplanation && (
                <div className="border-t border-border">
                  <div className="flex">
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

                  <div className="p-3.5">
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
                              <p className="mb-2">상세 풀이가 아직 없어요.</p>
                              {question.source_url && (
                                <a
                                  href={question.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-rose text-xs font-display font-bold"
                                >
                                  원본 블로그에서 확인 →
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
                            className="text-xs px-2.5 py-1 rounded-full font-display font-bold"
                            style={{
                              background: "rgba(168,220,255,0.16)",
                              color: "var(--info-fg)",
                              border: "1px solid rgba(168,220,255,0.4)",
                            }}
                          >
                            {svc}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {question.source_url && (
                    <div className="border-t border-border p-2">
                      <a
                        href={question.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center text-xs text-rose font-display font-bold py-1"
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
            className="w-full py-3.5 rounded-3xl font-display font-bold active:scale-[0.97] transition-all text-on-primary"
            style={{
              background: "linear-gradient(135deg, #c8b4ff 0%, #a8dcff 100%)",
              boxShadow: "0 8px 24px rgba(200,180,255,0.3)",
            }}
          >
            다음 퀘스트 ▶
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
          className="fixed bottom-20 left-1/2 -translate-x-1/2 text-sm px-4 py-2 rounded-full z-50 animate-fade-in whitespace-nowrap font-display font-bold text-on-primary"
          style={{
            background: "linear-gradient(135deg, #b4f2e1, #a8dcff)",
            boxShadow: "0 8px 24px rgba(180,242,225,0.4)",
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
      className="flex-1 py-2.5 text-xs font-display font-bold transition-colors relative"
      style={{
        color: active ? "var(--pastel-rose)" : disabled ? "rgba(181,170,212,0.4)" : "var(--muted)",
      }}
    >
      {children}
      {active && (
        <span
          className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full"
          style={{ background: "var(--pastel-rose)" }}
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
