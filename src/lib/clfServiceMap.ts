export const CLF_CATEGORIES = [
  {
    category: "Cloud Concepts",
    services: [
      { name: "AWS Cloud", summary: "클라우드 컴퓨팅의 이점, 글로벌 인프라, 공동 책임 모델" },
      { name: "AWS Global Infrastructure", summary: "리전, 가용 영역, 엣지 로케이션, 로컬 존" },
      { name: "Shared Responsibility Model", summary: "AWS(클라우드의 보안) vs 고객(클라우드에서의 보안)" },
    ],
  },
  {
    category: "Security & Compliance",
    services: [
      { name: "IAM", summary: "사용자, 그룹, 역할, 정책으로 접근 제어 관리" },
      { name: "KMS", summary: "데이터 암호화 키 생성 및 관리" },
      { name: "CloudTrail", summary: "AWS 계정의 API 호출 로깅 및 감사" },
      { name: "Shield", summary: "DDoS 공격 방어 (Standard: 무료, Advanced: 유료)" },
      { name: "WAF", summary: "웹 애플리케이션 방화벽, HTTP/S 트래픽 필터링" },
      { name: "GuardDuty", summary: "지능형 위협 탐지 서비스" },
      { name: "Inspector", summary: "EC2/컨테이너 취약점 자동 스캔" },
      { name: "Macie", summary: "S3에서 민감 데이터(PII) 자동 탐지" },
      { name: "Cognito", summary: "웹/앱 사용자 인증 및 권한 부여" },
    ],
  },
  {
    category: "Technology",
    services: [
      { name: "EC2", summary: "가상 서버 (IaaS). 다양한 인스턴스 유형 선택 가능" },
      { name: "Lambda", summary: "서버리스 함수, 이벤트 기반 실행, 최대 15분" },
      { name: "S3", summary: "객체 스토리지. 정적 웹사이트 호스팅, 무제한 용량" },
      { name: "RDS", summary: "관리형 관계형 DB (MySQL, PostgreSQL, Oracle 등)" },
      { name: "DynamoDB", summary: "완전 관리형 NoSQL 데이터베이스, 서버리스" },
      { name: "VPC", summary: "AWS 리소스를 논리적으로 격리하는 가상 네트워크" },
      { name: "CloudFront", summary: "CDN(콘텐츠 전송 네트워크), 엣지 로케이션 캐싱" },
      { name: "Route 53", summary: "DNS 서비스 + 도메인 등록, 상태 확인" },
      { name: "ELB", summary: "트래픽을 여러 대상에 자동 분산하는 로드 밸런서" },
      { name: "Auto Scaling", summary: "수요에 따라 EC2 인스턴스 수를 자동 조정" },
      { name: "ECS", summary: "컨테이너 오케스트레이션 서비스, Docker 지원" },
      { name: "SQS", summary: "완전 관리형 메시지 큐, 서비스 간 비동기 통신" },
      { name: "SNS", summary: "완전 관리형 알림 서비스, 팬아웃 패턴" },
      { name: "CloudWatch", summary: "AWS 리소스 모니터링, 로그, 경보, 대시보드" },
    ],
  },
  {
    category: "Billing & Pricing",
    services: [
      { name: "Cost Explorer", summary: "AWS 비용 시각화 및 분석 도구" },
      { name: "AWS Budgets", summary: "비용/사용량 예산 설정 및 알림" },
      { name: "Trusted Advisor", summary: "비용 최적화, 보안, 성능, 내결함성 검사" },
      { name: "Pricing Calculator", summary: "AWS 서비스 사용 예상 비용 계산" },
      { name: "Support Plans", summary: "기본/개발자/비즈니스/엔터프라이즈 4단계" },
      { name: "Consolidated Billing", summary: "Organizations의 여러 계정 청구서 통합" },
    ],
  },
];

export const CLF_SERVICE_NAMES = CLF_CATEGORIES.flatMap((cat) =>
  cat.services.map((s) => s.name)
);

const CLF_SERVICE_ALIASES: Record<string, string[]> = {
  IAM: ["iam", "identity"],
  EC2: ["ec2", "elastic compute"],
  S3: ["s3", "simple storage"],
  RDS: ["rds", "relational database"],
  Lambda: ["lambda"],
  VPC: ["vpc", "virtual private cloud"],
  CloudFront: ["cloudfront"],
  "Route 53": ["route 53", "route53"],
  DynamoDB: ["dynamodb"],
  CloudTrail: ["cloudtrail"],
  CloudWatch: ["cloudwatch"],
  ELB: ["elb", "load balancer", "alb", "nlb"],
  SQS: ["sqs", "simple queue"],
  SNS: ["sns", "simple notification"],
  KMS: ["kms", "key management"],
  Shield: ["shield"],
  WAF: ["waf"],
  GuardDuty: ["guardduty"],
  "Cost Explorer": ["cost explorer"],
  "AWS Budgets": ["budgets"],
  "Trusted Advisor": ["trusted advisor"],
  Cognito: ["cognito"],
};

export function getClfDataServiceNames(conceptName: string): string[] {
  const aliases = CLF_SERVICE_ALIASES[conceptName];
  if (aliases) return [conceptName, ...aliases];
  return [conceptName, conceptName.toLowerCase()];
}
