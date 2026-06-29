export interface Question {
  id: string;
  source: "nxtcloud" | "examtopics" | "clf";
  post_number?: number;
  question_number_in_post?: number;
  examtopics_number?: number;
  domain?: string;
  difficulty?: string;
  question_text: string;
  options: Option[];
  correct_answers: string[];
  marked_answer?: string[];
  explanation?: string;
  detailed_explanation?: string;
  discussion_summary?: string;
  related_services: string[];
  source_url?: string;
  week?: number;
}

export interface Option {
  label: string;
  text: string;
  isMostVoted?: boolean;
}

export interface Attempt {
  id: string;
  question_id: string;
  selected_answers: string[];
  is_correct: boolean;
  time_spent_seconds: number;
  attempted_at: string;
}

export interface ReviewSchedule {
  id: string;
  question_id: string;
  next_review_at: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
}

export interface DailyStats {
  study_date: string;
  study_minutes: number;
  questions_solved: number;
  correct_count: number;
}

export interface ServiceStats {
  serviceName: string;
  totalQuestions: number;
  solvedCount: number;
  correctCount: number;
  accuracy: number;
}

export interface StudyNote {
  id: string;
  questionId: string;
  selectedText: string;
  memo: string;
  sourceContext: 'question' | 'explanation' | 'detail';
  createdAt: string;
}

export type {
  CorrectionType,
  CorrectionScope,
  CorrectionRequest,
  CorrectionRequestInput,
} from "./corrections";

export type ExamType = "SAA-C03" | "CLF-C02";

export interface ExamConfig {
  type: ExamType;
  label: string;
  shortLabel: string;
  totalQuestions: number;
  examTimeMinutes: number;
  passingScore: number;
  domainWeights: Record<string, number>;
}

export interface ExamContextValue {
  currentExam: ExamType;
  examConfig: ExamConfig;
  setExam: (exam: ExamType) => void;
}

export type NicknameValidationError = 'too_short' | 'too_long' | 'invalid_chars' | 'already_taken';

export type NicknameValidation =
  | { isValid: true; error?: undefined }
  | { isValid: false; error: NicknameValidationError };

export interface MockExam {
  id: string;
  started_at: string;
  finished_at: string;
  question_ids: string[];
  answers: Record<number, string[]>;
  total_questions: number;
  correct_count: number;
  score: number;
  passed: boolean;
  domain_scores: Record<string, { correct: number; total: number }>;
}
