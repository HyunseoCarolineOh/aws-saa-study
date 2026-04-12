/**
 * 데이터의 서비스명과 개념 페이지 서비스명 간 매핑
 *
 * 데이터(JSON)에는 77개 고유 서비스명이 있고,
 * 개념 페이지에는 46개 서비스가 있다.
 * 일부 데이터 서비스명은 개념 페이지와 다른 이름을 사용한다.
 */

// 데이터 서비스명 → 개념 페이지 서비스명 (다를 때만 등록)
const DATA_TO_CONCEPT: Record<string, string> = {
  Snowball: "Snow Family",
  "Elastic Load Balancing": "ALB",
  "Parameter Store": "Systems Manager",
};

// 개념 페이지 서비스명 → 추가로 포함할 데이터 서비스명 목록
// (자기 자신은 자동 포함되므로 별칭만 등록)
const CONCEPT_ALIASES: Record<string, string[]> = {
  "Snow Family": ["Snowball"],
  ALB: ["Elastic Load Balancing"],
  "Systems Manager": ["Parameter Store"],
};

/**
 * 개념 페이지 서비스명으로 데이터에서 매칭할 서비스명 배열을 반환.
 * 예: getDataServiceNames("Snow Family") → ["Snow Family", "Snowball"]
 */
export function getDataServiceNames(conceptName: string): string[] {
  const aliases = CONCEPT_ALIASES[conceptName] || [];
  return [conceptName, ...aliases];
}

/**
 * 데이터 서비스명을 개념 페이지 서비스명으로 변환.
 * 매핑이 없으면 원래 이름 그대로 반환.
 */
export function toConceptName(dataServiceName: string): string {
  return DATA_TO_CONCEPT[dataServiceName] || dataServiceName;
}
