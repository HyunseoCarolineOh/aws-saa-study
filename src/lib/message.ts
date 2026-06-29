import { createBrowserClient } from './supabase';

/**
 * 메시지 유효성 검증
 * 빈 문자열이거나 공백 문자(spaces, tabs, newlines, zero-width spaces)만 포함하면 거부
 */
export function validateMessage(content: string): boolean {
  // Remove all types of whitespace including zero-width spaces
  const trimmed = content.replace(/[\s\u200B\u200C\u200D\uFEFF]/g, '');
  return trimmed.length > 0;
}

/**
 * 개발자에게 메시지 전송
 * - Validates content
 * - Inserts into Supabase 'messages' table
 * - Returns success/error result
 */
export async function sendMessage(content: string): Promise<{ success: boolean; error?: string }> {
  if (!validateMessage(content)) {
    return { success: false, error: '메시지를 입력해주세요' };
  }

  if (content.length > 500) {
    return { success: false, error: '메시지는 500자 이내로 입력해주세요' };
  }

  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요합니다' };
  }

  const { error } = await supabase.from('messages').insert({
    user_id: user.id,
    content: content.trim(),
    sent_at: new Date().toISOString(),
  });

  if (error) {
    return { success: false, error: '전송에 실패했습니다. 다시 시도해주세요.' };
  }

  return { success: true };
}
