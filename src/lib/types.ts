export interface Question {
  id: string;
  source: "nxtcloud" | "examtopics";
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

export interface MockExam {
  id: string;
  started_at: string;
  finished_at?: string;
  total_score?: number;
  domain_scores?: Record<string, number>;
  question_ids: string[];
}
