"use client";

import { useState, useEffect, useRef } from "react";
import type { Question } from "@/lib/types";
import { addAttempt } from "@/lib/store";

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
  const timerRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  // 문제 변경 시 리셋
  useEffect(() => {
    setSelectedAnswers([]);
    setSubmitted(false);
    setShowExplanation(false);
    startTimeRef.current = Date.now();
  }, [question.id]);

  // 타이머 업데이트
  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => {
      timerRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted]);

  const isMultiSelect = question.correct_answers.length > 1;

  function handleSelect(label: string) {
    if (submitted) return;
    if (isMultiSelect) {
      setSelectedAnswers((prev) =>
        prev.includes(label) ? prev.filter((a) => a !== label) : [...prev, label]
      );
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

    setSubmitted(true);
  }

  function handleNext() {
    onNext();
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
        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-primary rounded-full h-1.5 transition-all"
            style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* 문제 */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        {isMultiSelect && (
          <span className="inline-block text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded mb-2">
            복수 선택
          </span>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-line">{question.question_text}</p>
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
              borderColor = "border-green-500";
              bgColor = "bg-green-50";
            } else if (isSelected && !isCorrectOption) {
              borderColor = "border-red-500";
              bgColor = "bg-red-50";
            }
          } else if (isSelected) {
            borderColor = "border-primary";
            bgColor = "bg-blue-50";
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
                      ? "bg-green-500 text-white"
                      : submitted && isSelected && !isCorrectOption
                      ? "bg-red-500 text-white"
                      : isSelected
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600"
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
          className="w-full bg-primary text-white py-3 rounded-xl font-medium disabled:opacity-40 active:scale-[0.98] transition-all"
        >
          정답 확인
        </button>
      ) : (
        <div>
          {/* 결과 */}
          <div
            className={`text-center py-3 rounded-xl mb-3 font-medium ${
              isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {isCorrect ? "정답입니다!" : `오답입니다. 정답: ${question.correct_answers.join(", ")}`}
          </div>

          {/* 풀이 토글 */}
          {question.explanation && (
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="w-full text-left bg-gray-50 rounded-xl border border-border p-3 mb-3"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">풀이 보기</span>
                <span className="text-xs text-muted">{showExplanation ? "접기" : "펼치기"}</span>
              </div>
              {showExplanation && (
                <div className="mt-3 text-sm text-gray-700 leading-relaxed whitespace-pre-line border-t border-border pt-3">
                  {question.explanation}
                  {question.detailed_explanation && (
                    <div className="mt-3 pt-3 border-t border-border text-xs text-gray-600">
                      {question.detailed_explanation}
                    </div>
                  )}
                </div>
              )}
            </button>
          )}

          {/* 관련 서비스 */}
          {question.related_services.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {question.related_services.map((svc) => (
                <span key={svc} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                  {svc}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={handleNext}
            className="w-full bg-primary text-white py-3 rounded-xl font-medium active:scale-[0.98] transition-all"
          >
            다음 문제
          </button>
        </div>
      )}
    </div>
  );
}
