/**
 * SM-2 간격 반복 알고리즘
 * 오답노트 복습 스케줄에 사용
 */

export interface SM2Result {
  interval: number; // days
  easeFactor: number;
  repetitions: number;
}

/**
 * SM-2 알고리즘으로 다음 복습 간격 계산
 * @param quality 0-5 (0: 완전히 틀림, 5: 완벽하게 맞춤)
 * @param repetitions 현재까지 반복 횟수
 * @param easeFactor 현재 난이도 계수 (기본 2.5)
 * @param interval 현재 간격 (일)
 */
export function sm2(
  quality: number,
  repetitions: number,
  easeFactor: number,
  interval: number
): SM2Result {
  // quality가 3 미만이면 처음부터 다시
  if (quality < 3) {
    return {
      interval: 1,
      easeFactor,
      repetitions: 0,
    };
  }

  let newInterval: number;
  if (repetitions === 0) {
    newInterval = 1;
  } else if (repetitions === 1) {
    newInterval = 6;
  } else {
    newInterval = Math.round(interval * easeFactor);
  }

  const newEaseFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  return {
    interval: newInterval,
    easeFactor: newEaseFactor,
    repetitions: repetitions + 1,
  };
}

/**
 * 문제 풀이 결과를 SM-2 quality로 변환
 * @param isCorrect 정답 여부
 * @param timeSpentSeconds 풀이 시간
 */
export function getQuality(isCorrect: boolean, timeSpentSeconds: number): number {
  if (!isCorrect) return 1; // 틀림
  if (timeSpentSeconds <= 30) return 5; // 빠르게 맞춤
  if (timeSpentSeconds <= 60) return 4; // 적당히 맞춤
  if (timeSpentSeconds <= 120) return 3; // 느리게 맞춤
  return 3; // 매우 느리게 맞춤
}
