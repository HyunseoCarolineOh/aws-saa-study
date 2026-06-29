export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "v1.3",
    date: "2025.06.29",
    changes: [
      "CLF 개념 탭 상세 정보 추가 (설명/특징/시험팁)",
      "CLF 문제 100문제 한국어 번역 완료",
      "CLF 서비스 빈출도 배지 표시",
    ],
  },
  {
    version: "v1.2",
    date: "2025.06.29",
    changes: [
      "복습 탭에서 문제 바로가기 기능 추가",
      "모의고사 결과에서 오답 문제 바로가기",
      "데이터 동기화 연결",
    ],
  },
  {
    version: "v1.1",
    date: "2025.06",
    changes: [
      "SAA-C03 / CLF-C02 듀얼 시험 지원",
      "회원가입/로그인 기능",
      "오답노트 텍스트 드래그 저장",
    ],
  },
];
