"use client";

import { useEffect, useState } from "react";
import ExamSelector from "./ExamSelector";

const STORAGE_KEY = "selected_exam_type";

export default function ExamGate({ children }: { children: React.ReactNode }) {
  const [hasExam, setHasExam] = useState<boolean | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    setHasExam(!!saved);
  }, []);

  if (hasExam === null) return null;
  if (!hasExam) return <ExamSelector mode="initial" />;
  return <>{children}</>;
}
