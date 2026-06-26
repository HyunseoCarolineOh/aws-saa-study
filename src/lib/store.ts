import type { Attempt, ReviewSchedule, DailyStats, Question, ServiceStats, StudyNote, MockExam, ExamType } from "./types";
import { sm2, getQuality } from "./sm2";

let currentExamType: ExamType = "SAA-C03";

export function setCurrentExamType(examType: ExamType) {
  currentExamType = examType;
}

export function getCurrentExamType(): ExamType {
  return currentExamType;
}

function getStorageKeys() {
  const prefix = currentExamType === "CLF-C02" ? "clf" : "saa";
  return {
    ATTEMPTS: `${prefix}_attempts`,
    REVIEW_SCHEDULE: `${prefix}_review_schedule`,
    DAILY_STATS: `${prefix}_daily_stats`,
    STUDY_START: `${prefix}_study_start`,
    QUIZ_PROGRESS: `${prefix}_quiz_progress`,
    SERVICE_QUIZ_PROGRESS: `${prefix}_service_quiz_progress`,
    STUDY_NOTES: `${prefix}_study_notes`,
    MOCK_EXAMS: `${prefix}_mock_exams`,
  };
}

export interface QuizProgress {
  questionIds: string[];
  currentIndex: number;
  mode: "normal" | "review" | "service";
  serviceName?: string;
}

function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setToStorage(key: string, data: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

export function getAttempts(): Attempt[] {
  return getFromStorage(getStorageKeys().ATTEMPTS, []);
}

export function getAttemptedQuestionIds(): Set<string> {
  const attempts = getAttempts();
  const ids = new Set<string>();
  for (const a of attempts) ids.add(a.question_id);
  return ids;
}

export function addAttempt(attempt: Omit<Attempt, "id" | "attempted_at">): Attempt {
  const attempts = getAttempts();
  const newAttempt: Attempt = {
    ...attempt,
    id: crypto.randomUUID(),
    attempted_at: new Date().toISOString(),
  };
  attempts.push(newAttempt);
  setToStorage(getStorageKeys().ATTEMPTS, attempts);
  updateReviewSchedule(attempt.question_id, attempt.is_correct, attempt.time_spent_seconds);
  updateDailyStats(attempt.is_correct);
  return newAttempt;
}

export function getReviewSchedules(): ReviewSchedule[] {
  return getFromStorage(getStorageKeys().REVIEW_SCHEDULE, []);
}

export function getTodayReviewQuestionIds(): string[] {
  const schedules = getReviewSchedules();
  const now = new Date().toISOString();
  return schedules
    .filter((s) => s.next_review_at <= now)
    .map((s) => s.question_id);
}

function updateReviewSchedule(questionId: string, isCorrect: boolean, timeSpent: number) {
  const schedules = getReviewSchedules();
  const existing = schedules.find((s) => s.question_id === questionId);
  const quality = getQuality(isCorrect, timeSpent);

  if (existing) {
    const result = sm2(quality, existing.repetitions, existing.ease_factor, existing.interval_days);
    existing.interval_days = result.interval;
    existing.ease_factor = result.easeFactor;
    existing.repetitions = result.repetitions;
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + result.interval);
    existing.next_review_at = nextDate.toISOString();
  } else if (!isCorrect) {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 1);
    schedules.push({
      id: crypto.randomUUID(),
      question_id: questionId,
      next_review_at: nextDate.toISOString(),
      interval_days: 1,
      ease_factor: 2.5,
      repetitions: 0,
    });
  }

  setToStorage(getStorageKeys().REVIEW_SCHEDULE, schedules);
}

export function getDailyStats(): DailyStats[] {
  return getFromStorage(getStorageKeys().DAILY_STATS, []);
}

export function getTodayStats(): DailyStats {
  const stats = getDailyStats();
  const today = new Date().toISOString().split("T")[0];
  return (
    stats.find((s) => s.study_date === today) || {
      study_date: today,
      study_minutes: 0,
      questions_solved: 0,
      correct_count: 0,
    }
  );
}

function updateDailyStats(isCorrect: boolean) {
  const stats = getDailyStats();
  const today = new Date().toISOString().split("T")[0];
  let todayStat = stats.find((s) => s.study_date === today);

  if (!todayStat) {
    todayStat = { study_date: today, study_minutes: 0, questions_solved: 0, correct_count: 0 };
    stats.push(todayStat);
  }

  todayStat.questions_solved += 1;
  if (isCorrect) todayStat.correct_count += 1;
  setToStorage(getStorageKeys().DAILY_STATS, stats);
}

export function getQuizProgress(): QuizProgress | null {
  return getFromStorage<QuizProgress | null>(getStorageKeys().QUIZ_PROGRESS, null);
}

export function saveQuizProgress(progress: QuizProgress) {
  setToStorage(getStorageKeys().QUIZ_PROGRESS, progress);
}

export function clearQuizProgress() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getStorageKeys().QUIZ_PROGRESS);
}

export function getServiceQuizProgress(): QuizProgress | null {
  return getFromStorage<QuizProgress | null>(getStorageKeys().SERVICE_QUIZ_PROGRESS, null);
}

export function saveServiceQuizProgress(progress: QuizProgress) {
  setToStorage(getStorageKeys().SERVICE_QUIZ_PROGRESS, progress);
}

export function clearServiceQuizProgress() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getStorageKeys().SERVICE_QUIZ_PROGRESS);
}

export function getWrongAttemptsSummary(): { questionId: string; lastAttemptAt: string; attemptCount: number }[] {
  const attempts = getAttempts();
  const wrongMap = new Map<string, { lastAttemptAt: string; attemptCount: number }>();
  for (const a of attempts) {
    if (!a.is_correct) {
      const existing = wrongMap.get(a.question_id);
      wrongMap.set(a.question_id, {
        lastAttemptAt:
          a.attempted_at > (existing?.lastAttemptAt || "")
            ? a.attempted_at
            : existing?.lastAttemptAt || a.attempted_at,
        attemptCount: (existing?.attemptCount || 0) + 1,
      });
    }
  }
  return [...wrongMap.entries()].map(([questionId, data]) => ({ questionId, ...data }));
}

export function getStreak(): number {
  const stats = getDailyStats();
  if (stats.length === 0) return 0;

  const sorted = [...stats].sort((a, b) => b.study_date.localeCompare(a.study_date));
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().split("T")[0];

    if (sorted[i].study_date === expectedStr && sorted[i].questions_solved > 0) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function getAllServiceStats(
  allQuestions: Question[],
  getNames: (conceptName: string) => string[],
  conceptServiceNames: string[]
): Map<string, ServiceStats> {
  const attempts = getAttempts();
  const latestAttempts = new Map<string, Attempt>();
  for (const a of attempts) {
    const existing = latestAttempts.get(a.question_id);
    if (!existing || a.attempted_at > existing.attempted_at) {
      latestAttempts.set(a.question_id, a);
    }
  }

  const result = new Map<string, ServiceStats>();

  for (const conceptName of conceptServiceNames) {
    const dataNames = getNames(conceptName);
    const serviceQuestions = allQuestions.filter((q) =>
      q.related_services.some((s) => dataNames.includes(s))
    );

    let solvedCount = 0;
    let correctCount = 0;
    for (const q of serviceQuestions) {
      const attempt = latestAttempts.get(q.id);
      if (attempt) {
        solvedCount++;
        if (attempt.is_correct) correctCount++;
      }
    }

    result.set(conceptName, {
      serviceName: conceptName,
      totalQuestions: serviceQuestions.length,
      solvedCount,
      correctCount,
      accuracy: solvedCount > 0 ? Math.round((correctCount / solvedCount) * 100) : 0,
    });
  }

  return result;
}

export function getStudyNotes(): StudyNote[] {
  return getFromStorage(getStorageKeys().STUDY_NOTES, []);
}

export function getStudyNotesByQuestion(questionId: string): StudyNote[] {
  return getStudyNotes().filter((n) => n.questionId === questionId);
}

export function addStudyNote(note: Omit<StudyNote, "id" | "createdAt">): StudyNote {
  const notes = getStudyNotes();
  const newNote: StudyNote = {
    ...note,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  notes.push(newNote);
  setToStorage(getStorageKeys().STUDY_NOTES, notes);
  return newNote;
}

export function updateStudyNoteMemo(id: string, memo: string): boolean {
  const notes = getStudyNotes();
  const note = notes.find((n) => n.id === id);
  if (!note) return false;
  note.memo = memo;
  setToStorage(getStorageKeys().STUDY_NOTES, notes);
  return true;
}

export function deleteStudyNote(id: string): boolean {
  const notes = getStudyNotes();
  const filtered = notes.filter((n) => n.id !== id);
  if (filtered.length === notes.length) return false;
  setToStorage(getStorageKeys().STUDY_NOTES, filtered);
  return true;
}

export function getMockExamResults(): MockExam[] {
  return getFromStorage(getStorageKeys().MOCK_EXAMS, []);
}

export function saveMockExamResult(result: MockExam): void {
  const exams = getMockExamResults();
  exams.push(result);
  setToStorage(getStorageKeys().MOCK_EXAMS, exams);
}

export function buildPrioritizedOrder(
  allQuestions: Question[],
  filter?: (q: Question) => boolean
): string[] {
  const filtered = filter ? allQuestions.filter(filter) : allQuestions;
  const attempted = getAttemptedQuestionIds();
  const unattempted = filtered.filter((q) => !attempted.has(q.id)).map((q) => q.id);
  const attemptedIds = filtered.filter((q) => attempted.has(q.id)).map((q) => q.id);
  return [...unattempted, ...attemptedIds];
}
