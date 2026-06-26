import { createClient } from "./supabase";
import { getAttempts, getCurrentExamType } from "./store";
import type { Attempt } from "./types";

async function retry<T>(fn: () => Promise<T>, times = 3): Promise<T> {
  for (let i = 0; i < times; i++) {
    try { return await fn(); } catch (e) { if (i === times - 1) throw e; }
  }
  throw new Error("unreachable");
}

export async function syncAttempts(userId: string): Promise<void> {
  const examType = getCurrentExamType();
  const attempts = getAttempts();
  if (attempts.length === 0) return;

  const supabase = createClient();
  const rows = attempts.map((a: Attempt) => ({
    id: a.id,
    user_id: userId,
    question_id: a.question_id,
    selected_answers: a.selected_answers,
    is_correct: a.is_correct,
    time_spent_seconds: a.time_spent_seconds,
    attempted_at: a.attempted_at,
    exam_type: examType,
  }));

  await retry(async () => {
    const { error } = await supabase.from("saa_attempts").upsert(rows, { onConflict: "id" });
    if (error) throw new Error(error.message);
  });
}

export async function fetchUserData(userId: string): Promise<Attempt[]> {
  const examType = getCurrentExamType();
  const supabase = createClient();

  return retry(async () => {
    const { data, error } = await supabase
      .from("saa_attempts")
      .select("id, question_id, selected_answers, is_correct, time_spent_seconds, attempted_at")
      .eq("user_id", userId)
      .eq("exam_type", examType)
      .order("attempted_at", { ascending: true });

    if (error) throw new Error(error.message);
    return ((data || []) as Attempt[]).map((row) => ({
      id: row.id,
      question_id: row.question_id,
      selected_answers: row.selected_answers,
      is_correct: row.is_correct,
      time_spent_seconds: row.time_spent_seconds,
      attempted_at: row.attempted_at,
    }));
  });
}
