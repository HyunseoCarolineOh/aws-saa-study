export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "v1.3",
    date: "2026-06-28",
    changes: [
      "복습 탭으로 이름 변경 (구: 오답 탭)",
      "수정 요청 기능을 마이페이지로 이동",
      "문제 풀이 이어서 풀기 기능 추가",
      "마이페이지에 업데이트 로그 추가",
    ],
  },
  {
    version: "v1.2",
    date: "2026-06-10",
    changes: [
      "CLF-C02 AWS Cloud Practitioner 문제 추가",
      "시험 전환 기능 추가 (마이페이지)",
      "서비스별 문제 풀기 기능 추가",
    ],
  },
  {
    version: "v1.1",
    date: "2026-05-20",
    changes: [
      "SM-2 알고리즘 기반 복습 스케줄링 도입",
      "오답노트 기능 추가 (텍스트 드래그로 저장)",
      "문제 수정 요청 기능 추가",
    ],
  },
  {
    version: "v1.0",
    date: "2026-05-01",
    changes: [
      "AWS SAA-C03 문제 풀이 앱 최초 출시",
      "랜덤 풀기 / 모의고사 모드",
      "오답 복습 기능",
    ],
  },
];
