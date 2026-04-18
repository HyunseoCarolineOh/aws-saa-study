import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type CorrectionType =
  | "translation_needed"
  | "wrong_explanation"
  | "invalid_choice"
  | "wrong_answer"
  | "service_type_change";

export type CorrectionScope = "question" | "option" | "explanation" | "detail";

export const CORRECTION_TYPE_LABELS: Record<CorrectionType, string> = {
  translation_needed: "번역 필요 (영어)",
  wrong_explanation: "해설이 다른 문제 것",
  invalid_choice: "선지 내용 오류",
  wrong_answer: "정답 표시 오류",
  service_type_change: "서비스 유형 변경",
};

export const CORRECTION_SCOPE_LABELS: Record<CorrectionScope, string> = {
  question: "문제",
  option: "선지",
  explanation: "해설",
  detail: "상세 풀이",
};

export interface CorrectionRequestInput {
  question_source: "nxtcloud" | "examtopics";
  question_id: string;
  report_type: CorrectionType;
  scope: CorrectionScope;
  option_label?: string | null;
  selected_text?: string | null;
  description?: string | null;
}

export interface CorrectionRequest extends CorrectionRequestInput {
  id: number;
  created_at: string;
  user_agent: string | null;
}

const TABLE = "saa_correction_requests";

function getSupabaseConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function isCorrectionsEnabled(): boolean {
  return getSupabaseConfig() !== null;
}

let cachedClient: SupabaseClient | null = null;
function getClient(): SupabaseClient {
  if (cachedClient) return cachedClient;
  const cfg = getSupabaseConfig();
  if (!cfg) throw new Error("Supabase 설정이 필요합니다");
  cachedClient = createClient(cfg.url, cfg.key);
  return cachedClient;
}

export function inferSource(questionId: string): "nxtcloud" | "examtopics" {
  if (questionId.startsWith("et-")) return "examtopics";
  return "nxtcloud";
}

export async function submitCorrection(input: CorrectionRequestInput): Promise<void> {
  const client = getClient();
  const payload = {
    ...input,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
  };
  const { error } = await client.from(TABLE).insert(payload);
  if (error) throw error;
}

export async function listPendingCorrections(): Promise<CorrectionRequest[]> {
  const client = getClient();
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CorrectionRequest[];
}

export async function deleteCorrection(id: number): Promise<void> {
  const client = getClient();
  const { error } = await client.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
