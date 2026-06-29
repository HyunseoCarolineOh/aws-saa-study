import { createBrowserClient } from './supabase';
import type { NicknameValidation } from './types';

const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]{2,12}$/;

/**
 * 닉네임 유효성 검증 (형식 검사만, 중복은 별도)
 * - too_short: 2자 미만
 * - too_long: 12자 초과
 * - invalid_chars: 허용되지 않은 문자 포함
 */
export function validateNickname(nickname: string): NicknameValidation {
  if (nickname.length < 2) {
    return { isValid: false, error: 'too_short' };
  }
  if (nickname.length > 12) {
    return { isValid: false, error: 'too_long' };
  }
  if (!NICKNAME_REGEX.test(nickname)) {
    return { isValid: false, error: 'invalid_chars' };
  }
  return { isValid: true };
}

/**
 * 닉네임 중복 확인 (Supabase profiles 테이블 조회)
 * Returns true if the nickname is available (not taken)
 */
export async function checkNicknameAvailability(nickname: string): Promise<boolean> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('nickname', nickname)
    .maybeSingle();

  if (error) {
    console.error('닉네임 중복 확인 실패:', error);
    return false; // 에러 시 안전하게 사용 불가로 처리
  }

  return data === null; // null means no match found = available
}

/**
 * 닉네임 저장 (프로필 생성 또는 업데이트)
 */
export async function saveNickname(nickname: string): Promise<{ success: boolean; error?: string }> {
  const validation = validateNickname(nickname);
  if (!validation.isValid) {
    const errorMessages: Record<string, string> = {
      too_short: '닉네임은 2자 이상이어야 합니다',
      too_long: '닉네임은 12자 이하여야 합니다',
      invalid_chars: '한글, 영문, 숫자만 사용 가능합니다',
      already_taken: '이미 사용 중인 닉네임입니다',
    };
    return { success: false, error: errorMessages[validation.error!] };
  }

  const isAvailable = await checkNicknameAvailability(nickname);
  if (!isAvailable) {
    return { success: false, error: '이미 사용 중인 닉네임입니다' };
  }

  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요합니다' };
  }

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      nickname,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    if (error.code === '23505') { // unique constraint violation
      return { success: false, error: '이미 사용 중인 닉네임입니다' };
    }
    return { success: false, error: '저장에 실패했습니다' };
  }

  return { success: true };
}
