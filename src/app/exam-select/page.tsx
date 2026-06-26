"use client";

import { useEffect, useState } from "react";
import ExamSelector from "@/components/ExamSelector";

const STORAGE_KEY = "selected_exam_type";

export default function ExamSelectPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) {
      window.location.replace("/questions");
    } else {
      setReady(true);
    }
  }, []);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-background">
      <ExamSelector mode="initial" onSelect={() => { window.location.href = "/questions"; }} />
    </div>
  );
}
