"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ExamSelector from "@/components/ExamSelector";

const STORAGE_KEY = "selected_exam_type";

export default function ExamSelectPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) {
      router.replace("/questions");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-background">
      <ExamSelector mode="initial" onSelect={() => router.push("/questions")} />
    </div>
  );
}
