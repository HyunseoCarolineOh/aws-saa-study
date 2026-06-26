"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ExamType, ExamContextValue } from "@/lib/types";
import { EXAM_CONFIGS } from "@/lib/examConfig";
import { setCurrentExamType } from "@/lib/store";

const STORAGE_KEY = "selected_exam_type";

const ExamContext = createContext<ExamContextValue | null>(null);

export function ExamProvider({ children }: { children: React.ReactNode }) {
  const [currentExam, setCurrentExam] = useState<ExamType>("SAA-C03");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ExamType | null;
    if (saved && (saved === "SAA-C03" || saved === "CLF-C02")) {
      setCurrentExam(saved);
      setCurrentExamType(saved);
    }
  }, []);

  function setExam(exam: ExamType) {
    setCurrentExam(exam);
    setCurrentExamType(exam);
    localStorage.setItem(STORAGE_KEY, exam);
  }

  return (
    <ExamContext.Provider
      value={{ currentExam, examConfig: EXAM_CONFIGS[currentExam], setExam }}
    >
      {children}
    </ExamContext.Provider>
  );
}

export function useExam() {
  const ctx = useContext(ExamContext);
  if (!ctx) throw new Error("useExam must be used within ExamProvider");
  return ctx;
}

export function hasSelectedExam(): boolean {
  if (typeof window === "undefined") return true;
  return !!localStorage.getItem(STORAGE_KEY);
}
