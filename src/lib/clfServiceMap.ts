export const CLF_CATEGORIES = [
  {
    category: "Cloud Concepts",
    services: [
      { name: "AWS Cloud", summary: "클라우드 컴퓨팅의 이점, 글로벌 인프라, 공동 책임 모델", compare: "", description: "AWS 클라우드는 인터넷을 통해 IT 리소스를 온디맨드로 제공하는 플랫폼입니다. 초기 투자 없이 필요한 만큼만 사용하고 전 세계 인프라를 활용할 수 있습니다.", keyFeatures: ["6가지 이점: 자본비용→변동비용, 규모의 경제, 용량 추측 불필요, 속도/민첩성, 데이터센터 비용 제거, 글로벌 배포", "배포 모델: 퍼블릭(AWS), 프라이빗(온프레미스), 하이브리드", "서비스 모델: IaaS(EC2), PaaS(Elastic Beanstalk), SaaS(Gmail 등)"], examTips: ["클라우드 6가지 이점 암기 필수 — 매우 빈출", "'초기 비용 없이 사용한 만큼 지불' = 클라우드 핵심 가치", "IaaS vs PaaS vs SaaS 구분 문제 자주 출제"] },
      { name: "AWS Global Infrastructure", summary: "리전, 가용 영역, 엣지 로케이션, 로컬 존", compare: "", description: "AWS 글로벌 인프라는 리전(Region), 가용 영역(AZ), 엣지 로케이션으로 구성됩니다. 리전은 지리적 영역이고, 각 리전에는 2개 이상의 격리된 가용 영역이 있습니다.", keyFeatures: ["리전: 지리적으로 분리된 영역 (예: 서울, 도쿄, 버지니아)", "가용 영역(AZ): 리전 내 격리된 데이터센터 그룹", "엣지 로케이션: CloudFront CDN 캐시 서버 (400+개)"], examTips: ["리전 선택 기준: 규정 준수, 지연 시간, 서비스 가용성, 비용", "AZ 장애는 다른 AZ에 영향 없음 (장애 격리 설계)", "개수: 엣지 로케이션 > AZ > 리전"] },
      { name: "Shared Responsibility Model", summary: "AWS(클라우드의 보안) vs 고객(클라우드에서의 보안)", compare: "", description: "공동 책임 모델은 AWS와 고객 간 보안 책임을 구분합니다. AWS는 클라우드 자체의 보안을, 고객은 클라우드 안의 보안을 담당합니다.", keyFeatures: ["AWS 책임: 물리 인프라, 하드웨어, 네트워크, 하이퍼바이저", "고객 책임: 데이터 암호화, IAM, OS 패치(EC2), 방화벽", "관리형 서비스(RDS 등)일수록 AWS 책임 범위 확대"], examTips: ["매우 빈출! AWS vs 고객 책임 구분 문제", "EC2 OS 패치 = 고객, RDS OS 패치 = AWS", "데이터 암호화 = 항상 고객 책임"] },
    ],
  },
  {
    category: "Security & Compliance",
    services: [
      { name: "IAM", summary: "사용자, 그룹, 역할, 정책으로 접근 제어 관리", compare: "Cognito", frequency: 3, description: "AWS IAM은 AWS 리소스에 대한 접근을 안전하게 관리하는 서비스입니다. 사용자, 그룹, 역할을 생성하고 정책으로 세밀한 권한을 제어합니다.", keyFeatures: ["사용자(User), 그룹(Group), 역할(Role)로 접근 관리", "정책(Policy): JSON 기반 세밀한 권한 제어", "MFA(다중 인증)로 추가 보안", "IAM은 무료 서비스"], examTips: ["루트 계정 일상 사용 금지 — IAM 사용자 생성 필수", "EC2에서 다른 서비스 접근 = IAM 역할 (액세스 키 X)", "최소 권한 원칙 항상 적용"] },
      { name: "KMS", summary: "데이터 암호화 키 생성 및 관리", compare: "", description: "AWS KMS는 데이터 암호화에 사용하는 키를 생성하고 관리하는 서비스입니다. S3, EBS, RDS 등 대부분의 AWS 서비스와 통합됩니다.", keyFeatures: ["암호화 키 생성, 로테이션, 관리", "AWS 서비스 통합: S3/EBS/RDS 암호화", "CloudTrail로 키 사용 이력 감사"], examTips: ["'암호화' / '키 관리' = KMS", "AWS 관리형 키 vs 고객 관리형 키 구분"] },
      { name: "CloudTrail", summary: "AWS 계정의 API 호출 로깅 및 감사", compare: "CloudWatch", description: "AWS CloudTrail은 AWS 계정의 모든 API 호출을 기록하는 감사 서비스입니다. 누가, 언제, 어떤 작업을 했는지 추적합니다.", keyFeatures: ["모든 AWS API 호출 자동 기록", "콘솔/CLI/SDK 접근 방식 모두 추적", "90일 무료 이벤트 조회"], examTips: ["'누가 무엇을 했는지' / '감사' = CloudTrail", "CloudTrail vs CloudWatch: API 감사 vs 성능 모니터링"] },
      { name: "Shield", summary: "DDoS 공격 방어 (Standard: 무료, Advanced: 유료)", compare: "WAF", description: "AWS Shield는 DDoS 공격으로부터 애플리케이션을 보호합니다. Standard는 모든 고객에게 자동 무료 제공됩니다.", keyFeatures: ["Standard: 자동 적용, 무료, L3/L4 DDoS 완화", "Advanced: 24/7 전문가 대응, 비용 보호"], examTips: ["'DDoS 보호' = Shield", "Standard = 무료·자동, Advanced = 유료", "Shield(DDoS) vs WAF(웹 앱 공격) 구분"] },
      { name: "WAF", summary: "웹 애플리케이션 방화벽, HTTP/S 트래픽 필터링", compare: "Shield", description: "AWS WAF는 웹 앱을 SQL 인젝션, XSS 같은 공격으로부터 보호하는 방화벽입니다.", keyFeatures: ["HTTP/HTTPS(L7) 트래픽 필터링", "SQL 인젝션, XSS 패턴 차단", "IP/지역 기반 접근 제어"], examTips: ["'웹 공격' / 'SQL 인젝션' / 'XSS' = WAF", "WAF(L7 웹) vs Shield(L3/L4 DDoS) 구분"] },
      { name: "GuardDuty", summary: "지능형 위협 탐지 서비스", compare: "", description: "Amazon GuardDuty는 ML 기반으로 AWS 계정의 악의적 활동과 이상 행동을 자동 탐지합니다.", keyFeatures: ["ML + 위협 인텔리전스 기반 탐지", "에이전트 설치 불필요", "VPC Flow Logs, DNS, CloudTrail 분석"], examTips: ["'위협 탐지' / '이상 행동' = GuardDuty", "활성화만 하면 동작"] },
      { name: "Inspector", summary: "EC2/컨테이너 취약점 자동 스캔", compare: "GuardDuty", description: "Amazon Inspector는 EC2와 컨테이너의 소프트웨어 취약점을 자동으로 스캔합니다.", keyFeatures: ["CVE 기반 취약점 자동 탐지", "EC2, ECR, Lambda 스캔", "위험도 점수로 우선순위 지정"], examTips: ["'취약점 스캔' / 'CVE' = Inspector", "Inspector(취약점) vs GuardDuty(위협 행동) 구분"] },
      { name: "Macie", summary: "S3에서 민감 데이터(PII) 자동 탐지", compare: "", description: "Amazon Macie는 ML을 사용하여 S3에 저장된 민감 데이터를 자동으로 발견합니다.", keyFeatures: ["S3 버킷의 민감 데이터 자동 탐지", "PII, 금융 정보 등 패턴 인식"], examTips: ["'S3 민감 데이터 탐지' / 'PII' = Macie"] },
      { name: "Cognito", summary: "웹/앱 사용자 인증 및 권한 부여", compare: "IAM", description: "Amazon Cognito는 웹/모바일 앱의 사용자 인증을 제공합니다. 소셜 로그인도 지원합니다.", keyFeatures: ["User Pool: 회원가입/로그인/MFA 관리", "Identity Pool: AWS 리소스 접근 권한 부여", "소셜 로그인 + SAML/OIDC 연동"], examTips: ["'앱 사용자 인증' = Cognito, 'AWS 리소스 접근' = IAM", "Cognito = 외부 사용자, IAM = AWS 내부 관리"] },
    ],
  },
  {
    category: "Technology",
    services: [
      { name: "EC2", summary: "가상 서버 (IaaS). 다양한 인스턴스 유형 선택 가능", compare: "Lambda", frequency: 9, description: "Amazon EC2는 클라우드에서 가상 서버를 제공하는 핵심 컴퓨팅 서비스입니다.", keyFeatures: ["다양한 인스턴스 유형: 범용, 컴퓨팅 최적화, 메모리 최적화", "구매 옵션: 온디맨드, 예약(1/3년), 스팟(최대 90% 할인)", "Auto Scaling으로 자동 확장/축소"], examTips: ["온디맨드: 단기, 예약: 장기, 스팟: 중단 가능·최저가", "EC2 vs Lambda: 장시간(EC2) vs 짧은 이벤트(Lambda)", "'가상 서버' / '인스턴스' = EC2"], pricing: "온디맨드(초/시간), 예약(최대 72%), 스팟(최대 90%)" },
      { name: "Lambda", summary: "서버리스 함수, 이벤트 기반 실행, 최대 15분", compare: "EC2", description: "AWS Lambda는 서버 없이 코드를 실행하는 서버리스 서비스입니다.", keyFeatures: ["서버 관리 불필요 (서버리스)", "이벤트 기반 자동 실행", "실행 시간만 과금, 최대 15분"], examTips: ["'서버리스' / '서버 관리 없이' = Lambda", "Lambda vs EC2: 짧은 작업 vs 장시간"], pricing: "요청 수 + 실행시간. 월 100만 요청 무료" },
      { name: "S3", summary: "객체 스토리지. 정적 웹사이트 호스팅, 무제한 용량", compare: "EBS", frequency: 4, description: "Amazon S3는 무제한 용량의 객체 스토리지입니다. 11 9's 내구성을 제공합니다.", keyFeatures: ["무제한 저장, 단일 객체 최대 5TB", "스토리지 클래스: Standard, IA, Glacier", "정적 웹사이트 호스팅, 버전 관리"], examTips: ["'객체 스토리지' / '무제한' = S3", "자주=Standard, 가끔=IA, 장기=Glacier", "S3(객체) vs EBS(블록) 구분"], pricing: "저장 용량 + 요청 수 + 전송" },
      { name: "RDS", summary: "관리형 관계형 DB (MySQL, PostgreSQL, Oracle 등)", compare: "DynamoDB", description: "Amazon RDS는 관계형 DB를 쉽게 운영할 수 있는 관리형 서비스입니다.", keyFeatures: ["자동 백업, 패치, 장애 조치", "Multi-AZ로 고가용성", "읽기 전용 복제본"], examTips: ["'관리형 관계형 DB' = RDS", "RDS(SQL) vs DynamoDB(NoSQL) 구분"], pricing: "인스턴스 + 스토리지" },
      { name: "DynamoDB", summary: "완전 관리형 NoSQL 데이터베이스, 서버리스", compare: "RDS", description: "Amazon DynamoDB는 밀리초 응답의 서버리스 NoSQL DB입니다.", keyFeatures: ["밀리초 응답, 서버리스", "키-값 및 문서 데이터 모델", "용량 자동 관리"], examTips: ["'NoSQL' / '키-값' = DynamoDB", "DynamoDB(NoSQL) vs RDS(SQL) 구분"], pricing: "읽기/쓰기 요청 단위" },
      { name: "VPC", summary: "AWS 리소스를 논리적으로 격리하는 가상 네트워크", compare: "", frequency: 2, description: "Amazon VPC는 논리적으로 격리된 가상 네트워크를 정의합니다.", keyFeatures: ["퍼블릭/프라이빗 서브넷", "보안 그룹 + NACL", "인터넷/NAT 게이트웨이"], examTips: ["'격리된 네트워크' = VPC", "보안 그룹(Stateful) vs NACL(Stateless)", "프라이빗→인터넷 = NAT Gateway"], pricing: "VPC 무료, NAT에 비용" },
      { name: "CloudFront", summary: "CDN(콘텐츠 전송 네트워크), 엣지 로케이션 캐싱", compare: "", description: "Amazon CloudFront는 전 세계 엣지에서 콘텐츠를 캐싱하여 빠르게 전달합니다.", keyFeatures: ["400+ 엣지 로케이션", "정적/동적 콘텐츠 가속", "DDoS 방어 기본 통합"], examTips: ["'CDN' / '빠른 콘텐츠 전달' = CloudFront"] },
      { name: "Route 53", summary: "DNS 서비스 + 도메인 등록, 상태 확인", compare: "", description: "Amazon Route 53은 도메인 등록과 DNS 라우팅을 제공합니다.", keyFeatures: ["도메인 등록/관리", "DNS 라우팅 + 헬스 체크"], examTips: ["'DNS' / '도메인' = Route 53"] },
      { name: "ELB", summary: "트래픽을 여러 대상에 자동 분산하는 로드 밸런서", compare: "", frequency: 2, description: "ELB는 수신 트래픽을 여러 대상에 자동 분산합니다.", keyFeatures: ["ALB(HTTP/S), NLB(TCP/UDP)", "여러 AZ 분산 → 고가용성", "헬스 체크"], examTips: ["'트래픽 분산' = ELB", "ELB + Auto Scaling = 고가용성"] },
      { name: "Auto Scaling", summary: "수요에 따라 EC2 인스턴스 수를 자동 조정", compare: "", frequency: 2, description: "EC2 Auto Scaling은 수요에 따라 인스턴스를 자동 조정합니다.", keyFeatures: ["최소/최대/원하는 수 설정", "지표 기반 자동 조정", "ELB 연동"], examTips: ["'자동 확장' = Auto Scaling", "Auto Scaling 자체 무료"], pricing: "무료 (EC2 비용만)" },
      { name: "ECS", summary: "컨테이너 오케스트레이션 서비스, Docker 지원", compare: "Lambda", description: "Amazon ECS는 Docker 컨테이너를 실행·관리합니다.", keyFeatures: ["Docker 컨테이너 관리", "EC2 또는 Fargate(서버리스)"], examTips: ["'컨테이너' + '서버리스' = ECS + Fargate"] },
      { name: "SQS", summary: "완전 관리형 메시지 큐, 서비스 간 비동기 통신", compare: "SNS", description: "Amazon SQS는 서비스 간 비동기 통신을 위한 메시지 큐입니다.", keyFeatures: ["메시지 큐, 소비자가 처리", "Standard vs FIFO", "디커플링"], examTips: ["'디커플링' / '큐' = SQS", "SQS(큐) vs SNS(팬아웃) 구분"], pricing: "요청 수. 월 100만 무료" },
      { name: "SNS", summary: "완전 관리형 알림 서비스, 팬아웃 패턴", compare: "SQS", description: "Amazon SNS는 하나의 메시지를 여러 구독자에게 전달합니다.", keyFeatures: ["Pub/Sub 모델", "이메일, SMS, Lambda, SQS 구독"], examTips: ["'팬아웃' / '알림' = SNS", "SNS(푸시) vs SQS(폴링) 구분"] },
      { name: "CloudWatch", summary: "AWS 리소스 모니터링, 로그, 경보, 대시보드", compare: "CloudTrail", description: "Amazon CloudWatch는 AWS 리소스를 실시간 모니터링합니다.", keyFeatures: ["지표 수집, 알람, 로그", "임계값 초과 시 알림/Auto Scaling 트리거"], examTips: ["'모니터링' / '알람' = CloudWatch", "CloudWatch(성능) vs CloudTrail(감사) 구분"] },
    ],
  },
  {
    category: "Billing & Pricing",
    services: [
      { name: "Cost Explorer", summary: "AWS 비용 시각화 및 분석 도구", compare: "AWS Budgets", description: "비용과 사용량을 시각화하고 분석합니다.", keyFeatures: ["서비스별 비용 분석", "비용 예측", "RI 권장 구매안"], examTips: ["'비용 분석' = Cost Explorer", "Cost Explorer(분석) vs Budgets(알림)"] },
      { name: "AWS Budgets", summary: "비용/사용량 예산 설정 및 알림", compare: "Cost Explorer", description: "예산을 설정하고 초과 시 알림을 보냅니다.", keyFeatures: ["예산 설정 + 알림", "자동 조치 가능"], examTips: ["'예산 초과 알림' = Budgets"] },
      { name: "Trusted Advisor", summary: "비용 최적화, 보안, 성능, 내결함성 검사", compare: "", description: "AWS 환경을 5개 축으로 점검하고 모범 사례를 권고합니다.", keyFeatures: ["5개 카테고리 점검", "기본: 핵심 보안 + 한도만", "Business 이상: 전체"], examTips: ["'모범 사례 권고' = Trusted Advisor", "전체 체크 = Business 이상"] },
      { name: "Pricing Calculator", summary: "AWS 서비스 사용 예상 비용 계산", compare: "", description: "서비스 비용을 사전에 예측하는 무료 도구입니다.", keyFeatures: ["월 예상 비용 계산", "견적 저장/공유"], examTips: ["'사전 비용 견적' = Pricing Calculator"] },
      { name: "Support Plans", summary: "기본/개발자/비즈니스/엔터프라이즈 4단계", compare: "", description: "기술 지원 수준을 결정하는 플랜입니다.", keyFeatures: ["Basic: 무료, 문서만", "Developer: 이메일", "Business: 24/7, 전체 TA", "Enterprise: TAM, 15분 응답"], examTips: ["'24/7 지원' = Business 이상", "'전담 TAM' = Enterprise"], pricing: "Basic 무료 ~ Enterprise $15,000+" },
      { name: "Consolidated Billing", summary: "Organizations의 여러 계정 청구서 통합", compare: "", description: "여러 계정 청구를 통합하여 볼륨 할인 혜택을 받습니다.", keyFeatures: ["청구서 통합", "볼륨 할인 + RI 공유"], examTips: ["'통합 결제' / '볼륨 할인' = Consolidated Billing"] },
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
