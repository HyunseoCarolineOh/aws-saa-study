/**
 * 로컬 스토리지 기반 상태 관리
 * Supabase 연동 전까지 로컬에서 학습 데이터 관리
 */

import type { Attempt, ReviewSchedule, DailyStats, Question, ServiceStats } from "./types";
import { sm2, getQuality } from "./sm2";

const STORAGE_KEYS = {
  ATTEMPTS: "saa_attempts",
  REVIEW_SCHEDULE: "saa_review_schedule",
  DAILY_STATS: "saa_daily_stats",
  STUDY_START: "saa_study_start",
  QUIZ_PROGRESS: "saa_quiz_progress",
  SERVICE_QUIZ_PROGRESS: "saa_service_quiz_progress",
} as const;

// 퀴즈 진행 상태
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

// 풀이 기록
export function getAttempts(): Attempt[] {
  return getFromStorage(STORAGE_KEYS.ATTEMPTS, []);
}

export function addAttempt(attempt: Omit<Attempt, "id" | "attempted_at">): Attempt {
  const attempts = getAttempts();
  const newAttempt: Attempt = {
    ...attempt,
    id: crypto.randomUUID(),
    attempted_at: new Date().toISOString(),
  };
  attempts.push(newAttempt);
  setToStorage(STORAGE_KEYS.ATTEMPTS, attempts);

  // 오답이면 복습 스케줄 추가/업데이트
  updateReviewSchedule(attempt.question_id, attempt.is_correct, attempt.time_spent_seconds);

  // 일일 통계 업데이트
  updateDailyStats(attempt.is_correct);

  return newAttempt;
}

// 복습 스케줄 (SM-2)
export function getReviewSchedules(): ReviewSchedule[] {
  return getFromStorage(STORAGE_KEYS.REVIEW_SCHEDULE, []);
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
    // 처음 틀린 문제만 스케줄에 추가
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

  setToStorage(STORAGE_KEYS.REVIEW_SCHEDULE, schedules);
}

// 일일 통계
export function getDailyStats(): DailyStats[] {
  return getFromStorage(STORAGE_KEYS.DAILY_STATS, []);
}

export function getTodayStats(): DailyStats {
  const stats = getDailyStats();
  const today = new Date().toISOString().split("T")[0];
  return stats.find((s) => s.study_date === today) || {
    study_date: today,
    study_minutes: 0,
    questions_solved: 0,
    correct_count: 0,
  };
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

  setToStorage(STORAGE_KEYS.DAILY_STATS, stats);
}

// 퀴즈 진행 상태 관리
export function getQuizProgress(): QuizProgress | null {
  return getFromStorage<QuizProgress | null>(STORAGE_KEYS.QUIZ_PROGRESS, null);
}

export function saveQuizProgress(progress: QuizProgress) {
  setToStorage(STORAGE_KEYS.QUIZ_PROGRESS, progress);
}

export function clearQuizProgress() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.QUIZ_PROGRESS);
}

// 서비스 모드 퀴즈 진행 상태 관리
export function getServiceQuizProgress(): QuizProgress | null {
  return getFromStorage<QuizProgress | null>(STORAGE_KEYS.SERVICE_QUIZ_PROGRESS, null);
}

export function saveServiceQuizProgress(progress: QuizProgress) {
  setToStorage(STORAGE_KEYS.SERVICE_QUIZ_PROGRESS, progress);
}

export function clearServiceQuizProgress() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.SERVICE_QUIZ_PROGRESS);
}

// 오답 요약 (문제별 틀린 횟수, 마지막 시도)
export function getWrongAttemptsSummary(): { questionId: string; lastAttemptAt: string; attemptCount: number }[] {
  const attempts = getAttempts();
  const wrongMap = new Map<string, { lastAttemptAt: string; attemptCount: number }>();
  for (const a of attempts) {
    if (!a.is_correct) {
      const existing = wrongMap.get(a.question_id);
      wrongMap.set(a.question_id, {
        lastAttemptAt: a.attempted_at > (existing?.lastAttemptAt || "") ? a.attempted_at : existing?.lastAttemptAt || a.attempted_at,
        attemptCount: (existing?.attemptCount || 0) + 1,
      });
    }
  }
  return [...wrongMap.entries()].map(([questionId, data]) => ({ questionId, ...data }));
}

// 연속 학습일
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

// 서비스별 통계
export function getAllServiceStats(
  allQuestions: Question[],
  getNames: (conceptName: string) => string[],
  conceptServiceNames: string[]
): Map<string, ServiceStats> {
  const attempts = getAttempts();

  // 문제 ID → 최신 시도 매핑
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
