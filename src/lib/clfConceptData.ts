/**
 * CLF-C02 개념 탭 상세 데이터
 * SAA concepts/page.tsx의 AWS_SERVICES와 동일한 구조를 사용하여
 * CLF 시험 범위에 맞는 상세 정보를 제공한다.
 */

export interface ClfConceptService {
  name: string;
  summary: string;
  compare: string;
  description?: string;
  keyFeatures?: string[];
  useCases?: string[];
  examTips?: string[];
  pricing?: string;
  frequency?: number;
}

export interface ClfConceptCategory {
  category: string;
  services: ClfConceptService[];
}

export const CLF_CONCEPT_DATA: ClfConceptCategory[] = [
  {
    category: "Cloud Concepts",
    services: [
      {
        name: "EC2",
        summary: "가상 서버. 클라우드에서 컴퓨팅 용량 제공",
        compare: "Lambda, Lightsail",
        frequency: 9,
        description: "Amazon EC2는 클라우드에서 크기 조정이 가능한 가상 서버를 제공하는 핵심 컴퓨팅 서비스입니다. 다양한 인스턴스 유형과 구매 옵션(온디맨드, 예약, 스팟)을 통해 워크로드에 최적화된 컴퓨팅 환경을 구성할 수 있습니다.",
        keyFeatures: [
          "다양한 인스턴스 유형: 범용, 컴퓨팅 최적화, 메모리 최적화 등",
          "구매 옵션: 온디맨드(시간당), 예약(1/3년 할인), 스팟(최대 90% 할인, 중단 가능)",
          "Auto Scaling으로 수요에 따라 자동 확장/축소",
          "EBS 볼륨을 연결하여 영구 스토리지 사용",
        ],
        examTips: [
          "'가상 서버' / '인스턴스' = EC2",
          "온디맨드: 단기·예측 불가, 예약: 장기·안정, 스팟: 중단 가능·최저가",
          "EC2 vs Lambda: 장시간 실행(EC2) vs 짧은 이벤트 처리(Lambda)",
        ],
        pricing: "온디맨드(초/시간 단위), 예약(최대 72% 할인), 스팟(최대 90% 할인)",
      },
      {
        name: "S3",
        summary: "객체 스토리지. 무제한 용량, 높은 내구성",
        compare: "EBS, EFS",
        frequency: 4,
        description: "Amazon S3는 어디서든 원하는 양의 데이터를 저장하고 검색할 수 있는 객체 스토리지 서비스입니다. 99.999999999%(11 9's)의 내구성을 제공하며, 다양한 스토리지 클래스로 비용을 최적화할 수 있습니다.",
        keyFeatures: [
          "무제한 스토리지 용량, 단일 객체 최대 5TB",
          "스토리지 클래스: Standard, IA(비정기 접근), Glacier(아카이브)",
          "버전 관리로 실수 삭제 방지",
          "정적 웹사이트 호스팅 가능",
        ],
        examTips: [
          "'객체 스토리지' / '파일 저장' / '무제한' = S3",
          "자주 접근 = Standard, 가끔 = IA, 장기 보관 = Glacier",
          "S3 vs EBS: 객체(S3) vs 블록(EBS, EC2에 연결)",
        ],
        pricing: "저장 용량 + 요청 수 + 데이터 전송 비용",
      },
      {
        name: "RDS",
        summary: "관리형 관계형 DB. MySQL, PostgreSQL 등",
        compare: "DynamoDB, Aurora",
        description: "Amazon RDS는 클라우드에서 관계형 데이터베이스를 쉽게 설정, 운영, 확장할 수 있는 관리형 서비스입니다. MySQL, PostgreSQL, MariaDB, Oracle, SQL Server를 지원하며, 백업, 패치, 장애 조치를 자동 관리합니다.",
        keyFeatures: [
          "자동 백업, 소프트웨어 패치, 장애 조치",
          "Multi-AZ 배포로 고가용성 확보",
          "읽기 전용 복제본으로 읽기 성능 확장",
          "OS에 직접 접근 불가 (완전 관리형)",
        ],
        examTips: [
          "'관리형 관계형 DB' / '자동 백업' = RDS",
          "RDS vs DynamoDB: 관계형 SQL(RDS) vs NoSQL 키-값(DynamoDB)",
          "RDS vs EC2에 DB 설치: 관리 부담 줄임(RDS) vs 완전 제어(EC2)",
        ],
        pricing: "인스턴스 유형 + 스토리지 + I/O 비용",
      },
      {
        name: "Lambda",
        summary: "서버리스 함수. 이벤트 기반 코드 실행",
        compare: "EC2, Fargate",
        description: "AWS Lambda는 서버를 관리하지 않고 코드를 실행하는 서버리스 컴퓨팅 서비스입니다. 이벤트(S3 업로드, API 요청 등)에 의해 자동 트리거되며, 실행한 만큼만 비용을 지불합니다.",
        keyFeatures: [
          "서버 프로비저닝/관리 불필요 (서버리스)",
          "이벤트 기반 자동 실행",
          "실행 시간에 대해서만 과금 (유휴 시 무료)",
          "최대 실행 시간: 15분",
        ],
        examTips: [
          "'서버리스' / '서버 관리 없이' / '이벤트 기반' = Lambda",
          "Lambda vs EC2: 짧은 작업·자동 스케일(Lambda) vs 장시간·상시 실행(EC2)",
          "사용한 만큼만 과금 — 요청 수 + 실행 시간(ms)",
        ],
        pricing: "요청 수 + 실행 시간(GB-초). 프리 티어: 월 100만 요청 무료",
      },
    ],
  },
  {
    category: "Security and Compliance",
    services: [
      {
        name: "IAM",
        summary: "ID/액세스 관리. 사용자, 역할, 정책",
        compare: "Cognito",
        frequency: 3,
        description: "AWS IAM은 AWS 리소스에 대한 액세스를 안전하게 관리하는 서비스입니다. 사용자, 그룹, 역할을 생성하고 세밀한 권한 정책을 부여하여 최소 권한 원칙을 실현합니다.",
        keyFeatures: [
          "사용자(User), 그룹(Group), 역할(Role)로 접근 관리",
          "정책(Policy)으로 세밀한 권한 제어 (JSON 기반)",
          "MFA(다중 인증)로 추가 보안",
          "IAM은 무료 서비스",
        ],
        examTips: [
          "'누가 무엇을 할 수 있는지 제어' = IAM",
          "루트 계정은 일상 작업에 사용 금지 — IAM 사용자 생성 필수",
          "EC2에서 다른 서비스 접근 = IAM 역할 (액세스 키 X)",
          "최소 권한 원칙: 필요한 권한만 부여",
        ],
        pricing: "무료",
      },
      {
        name: "CloudTrail",
        summary: "API 감사 로그. 누가 무엇을 했는지 기록",
        compare: "CloudWatch",
        description: "AWS CloudTrail은 AWS 계정의 모든 API 호출을 기록하는 감사 서비스입니다. 누가, 언제, 어떤 작업을 했는지 추적하여 보안 분석과 규정 준수에 활용합니다.",
        keyFeatures: [
          "모든 AWS API 호출 자동 기록",
          "콘솔/CLI/SDK 모든 접근 방식 추적",
          "S3에 로그 저장, 90일 무료 조회",
        ],
        examTips: [
          "'누가 무엇을 했는지' / '감사 로그' = CloudTrail",
          "CloudTrail vs CloudWatch: API 감사(Trail) vs 성능 모니터링(Watch)",
        ],
        pricing: "관리 이벤트 기본 무료. S3 저장 비용 별도",
      },
      {
        name: "CloudWatch",
        summary: "모니터링. 지표, 로그, 알람",
        compare: "CloudTrail",
        description: "Amazon CloudWatch는 AWS 리소스와 애플리케이션을 실시간으로 모니터링하는 서비스입니다. CPU 사용률 같은 지표를 수집하고, 임계값 초과 시 알람을 보냅니다.",
        keyFeatures: [
          "AWS 리소스 지표(CPU, 네트워크 등) 자동 수집",
          "알람: 임계값 초과 시 SNS 알림 또는 Auto Scaling 트리거",
          "로그 수집 및 검색 (CloudWatch Logs)",
          "대시보드로 시각화",
        ],
        examTips: [
          "'모니터링' / '알람' / '지표' = CloudWatch",
          "CloudWatch vs CloudTrail: 성능·리소스 모니터링 vs API 호출 기록",
          "EC2 메모리 사용량은 기본 지표 아님 → Agent 필요",
        ],
        pricing: "기본 모니터링 무료. 세부 모니터링·사용자 지정 지표에 비용",
      },
      {
        name: "Shield",
        summary: "DDoS 보호. Standard(무료), Advanced(유료)",
        compare: "WAF",
        description: "AWS Shield는 DDoS 공격으로부터 애플리케이션을 보호하는 서비스입니다. Standard는 모든 AWS 고객에게 무료로 제공되며, Advanced는 더 정교한 공격에 대응합니다.",
        keyFeatures: [
          "Shield Standard: 모든 계정 자동 적용, 무료",
          "Shield Advanced: 24/7 전문가 대응, 비용 보호",
          "L3/L4(네트워크/전송 계층) DDoS 완화",
        ],
        examTips: [
          "'DDoS 보호' = Shield",
          "Shield Standard는 무료·자동 — 별도 설정 불필요",
          "Shield vs WAF: 네트워크 DDoS(Shield) vs 웹 앱 공격(WAF)",
        ],
        pricing: "Standard: 무료. Advanced: 월 $3,000 + 데이터 전송",
      },
      {
        name: "WAF",
        summary: "웹 방화벽. SQL 인젝션, XSS 방어",
        compare: "Shield",
        description: "AWS WAF는 웹 애플리케이션을 SQL 인젝션, XSS 같은 일반적인 웹 공격으로부터 보호하는 방화벽입니다. CloudFront나 ALB에 연결하여 사용합니다.",
        keyFeatures: [
          "HTTP/HTTPS(L7) 트래픽 필터링",
          "SQL 인젝션, XSS 등 공격 패턴 차단",
          "IP/지역 기반 접근 제어",
          "관리형 규칙 그룹 제공 (OWASP Top 10 등)",
        ],
        examTips: [
          "'웹 공격 방어' / 'SQL 인젝션' / 'XSS' = WAF",
          "WAF vs Shield: 웹 앱 공격(WAF, L7) vs DDoS(Shield, L3/L4)",
        ],
        pricing: "규칙 수 + 요청 수 기반 과금",
      },
      {
        name: "KMS",
        summary: "키 관리. 암호화 키 생성/관리",
        compare: "",
        description: "AWS KMS는 데이터 암호화에 사용하는 암호화 키를 생성하고 관리하는 서비스입니다. S3, EBS, RDS 등 대부분의 AWS 서비스와 통합됩니다.",
        keyFeatures: [
          "암호화 키 생성, 로테이션, 비활성화 관리",
          "AWS 서비스 통합: S3 SSE-KMS, EBS 암호화 등",
          "CloudTrail로 키 사용 이력 감사",
        ],
        examTips: [
          "'암호화' / '키 관리' = KMS",
          "AWS 관리형 키 vs 고객 관리형 키 구분",
          "데이터 암호화가 필요할 때 = KMS와 통합",
        ],
        pricing: "키당 월 $1 + API 호출 건당 과금",
      },
      {
        name: "GuardDuty",
        summary: "위협 탐지. ML 기반 이상 행동 감지",
        compare: "",
        description: "Amazon GuardDuty는 AWS 계정에서 악의적 활동과 이상 행동을 자동으로 탐지하는 위협 탐지 서비스입니다. 별도 설정 없이 활성화만 하면 됩니다.",
        keyFeatures: [
          "ML과 위협 인텔리전스 기반 자동 탐지",
          "에이전트 설치 불필요 — 로그 기반 분석",
          "VPC Flow Logs, DNS 로그, CloudTrail 이벤트 분석",
        ],
        examTips: [
          "'위협 탐지' / '이상 행동 감지' / 'ML 기반 보안' = GuardDuty",
          "활성화만 하면 동작 — 별도 구성 불필요",
        ],
        pricing: "분석한 로그 양 기반 과금. 30일 무료 평가판",
      },
    ],
  },
  {
    category: "Cloud Technology and Services",
    services: [
      {
        name: "VPC",
        summary: "가상 네트워크. 격리된 네트워크 환경 구성",
        compare: "",
        frequency: 2,
        description: "Amazon VPC는 AWS 클라우드에서 논리적으로 격리된 가상 네트워크를 정의하는 서비스입니다. 퍼블릭/프라이빗 서브넷으로 리소스를 분리하고 보안 그룹으로 접근을 제어합니다.",
        keyFeatures: [
          "퍼블릭 서브넷(인터넷 접근) / 프라이빗 서브넷(격리)",
          "보안 그룹: 인스턴스 수준 방화벽 (허용 규칙만)",
          "NACL: 서브넷 수준 방화벽 (허용+거부)",
          "인터넷 게이트웨이, NAT 게이트웨이로 연결 관리",
        ],
        examTips: [
          "'격리된 네트워크' / '서브넷' = VPC",
          "보안 그룹(Stateful, 허용만) vs NACL(Stateless, 허용+거부)",
          "프라이빗 서브넷에서 인터넷 → NAT Gateway",
        ],
        pricing: "VPC 자체 무료. NAT Gateway, VPN에 비용",
      },
      {
        name: "CloudFront",
        summary: "CDN. 전 세계 엣지에서 콘텐츠 캐싱",
        compare: "",
        description: "Amazon CloudFront는 전 세계 엣지 로케이션에서 콘텐츠를 캐싱하여 사용자에게 빠르게 전달하는 CDN 서비스입니다.",
        keyFeatures: [
          "전 세계 400+ 엣지 로케이션",
          "정적/동적 콘텐츠 모두 가속",
          "DDoS 방어 기본 통합 (Shield Standard)",
          "S3, ALB 등과 연동",
        ],
        examTips: [
          "'전 세계 사용자에게 빠른 콘텐츠 전달' / 'CDN' = CloudFront",
          "엣지 로케이션 = 사용자와 가까운 캐시 서버",
        ],
        pricing: "데이터 전송 + 요청 수 기반",
      },
      {
        name: "Route 53",
        summary: "DNS 서비스. 도메인 관리",
        compare: "",
        description: "Amazon Route 53은 도메인 등록과 DNS 라우팅을 제공하는 서비스입니다. 도메인 이름을 IP 주소로 변환합니다.",
        keyFeatures: [
          "도메인 등록 및 관리",
          "DNS 라우팅 (도메인 → IP 변환)",
          "헬스 체크 및 장애 조치 라우팅",
        ],
        examTips: [
          "'DNS' / '도메인' = Route 53",
          "이름의 유래: TCP/UDP 포트 53번 (DNS 포트)",
        ],
        pricing: "호스팅 영역당 $0.50/월 + 쿼리 수",
      },
      {
        name: "ELB",
        summary: "로드 밸런서. 트래픽 분산",
        compare: "",
        frequency: 2,
        description: "Elastic Load Balancing은 수신 트래픽을 여러 대상(EC2, 컨테이너 등)에 자동으로 분산하는 서비스입니다. 고가용성과 내결함성을 제공합니다.",
        keyFeatures: [
          "ALB(HTTP/HTTPS, L7), NLB(TCP/UDP, L4) 유형",
          "여러 AZ에 걸쳐 트래픽 분산 → 고가용성",
          "Auto Scaling과 연동하여 자동 확장",
          "헬스 체크로 비정상 대상 자동 제외",
        ],
        examTips: [
          "'트래픽 분산' / '로드 밸런서' = ELB",
          "ELB + Auto Scaling = 고가용성 + 자동 확장의 대표 조합",
        ],
        pricing: "시간당 + 처리한 트래픽 양",
      },
      {
        name: "Auto Scaling",
        summary: "자동 확장/축소. 수요에 따라 인스턴스 조정",
        compare: "",
        frequency: 2,
        description: "Amazon EC2 Auto Scaling은 수요에 따라 EC2 인스턴스 수를 자동으로 늘리거나 줄이는 서비스입니다. 성능을 유지하면서 비용을 최적화합니다.",
        keyFeatures: [
          "최소/최대/원하는 인스턴스 수 설정",
          "CPU 사용률 등 지표 기반 자동 조정",
          "ELB와 연동하여 트래픽 분산",
        ],
        examTips: [
          "'자동으로 서버 늘리기/줄이기' = Auto Scaling",
          "Auto Scaling 자체는 무료 — EC2 비용만 발생",
          "탄력성(Elasticity)의 핵심 서비스",
        ],
        pricing: "무료 (실행되는 EC2 인스턴스 비용만)",
      },
      {
        name: "EBS",
        summary: "블록 스토리지. EC2에 연결하는 가상 디스크",
        compare: "S3, EFS",
        frequency: 2,
        description: "Amazon EBS는 EC2 인스턴스에 연결하여 사용하는 블록 수준 스토리지입니다. 하드디스크나 SSD처럼 동작하며, 인스턴스와 독립적으로 존재합니다.",
        keyFeatures: [
          "EC2에 연결하는 가상 하드디스크",
          "SSD(gp3, io2)와 HDD(st1, sc1) 유형",
          "스냅샷으로 백업 가능 (S3에 저장)",
          "단일 AZ에서만 접근 가능",
        ],
        examTips: [
          "'EC2용 디스크' / '블록 스토리지' = EBS",
          "EBS vs S3: 블록(EC2 연결) vs 객체(독립 저장)",
          "EBS vs EFS: 단일 AZ(EBS) vs 여러 AZ에서 공유(EFS)",
        ],
        pricing: "프로비저닝한 용량(GB/월) 기반",
      },
      {
        name: "EFS",
        summary: "파일 스토리지. 여러 EC2에서 공유",
        compare: "EBS, S3",
        description: "Amazon EFS는 여러 EC2 인스턴스에서 동시에 접근할 수 있는 완전관리형 파일 시스템입니다. 자동으로 용량이 확장/축소됩니다.",
        keyFeatures: [
          "여러 EC2에서 동시 마운트 가능 (NFS)",
          "자동 확장 — 프로비저닝 불필요",
          "여러 AZ에 걸쳐 데이터 복제",
          "Linux 전용",
        ],
        examTips: [
          "'여러 인스턴스에서 파일 공유' = EFS",
          "EFS vs EBS: 공유 가능(EFS) vs 단일 인스턴스(EBS)",
        ],
        pricing: "사용한 용량만큼 과금",
      },
      {
        name: "DynamoDB",
        summary: "NoSQL 데이터베이스. 빠른 키-값 저장",
        compare: "RDS",
        description: "Amazon DynamoDB는 어떤 규모에서도 빠른 성능을 제공하는 완전관리형 NoSQL 데이터베이스입니다. 서버리스로 운영되며, 키-값 및 문서 데이터 모델을 지원합니다.",
        keyFeatures: [
          "한 자릿수 밀리초 응답 시간",
          "서버리스 — 용량 자동 관리",
          "키-값 및 문서 데이터 모델",
          "글로벌 테이블로 다중 리전 복제 가능",
        ],
        examTips: [
          "'NoSQL' / '키-값' / '서버리스 DB' = DynamoDB",
          "DynamoDB vs RDS: NoSQL·비관계형 vs SQL·관계형",
          "유연한 스키마 — 테이블마다 다른 속성 가능",
        ],
        pricing: "읽기/쓰기 요청 단위 또는 프로비저닝 용량",
      },
      {
        name: "SNS",
        summary: "알림 서비스. Pub/Sub 메시징",
        compare: "SQS",
        description: "Amazon SNS는 하나의 메시지를 여러 구독자에게 동시에 전달하는 Pub/Sub 메시징 서비스입니다. 이메일, SMS, Lambda, SQS 등으로 전송할 수 있습니다.",
        keyFeatures: [
          "Pub/Sub 모델: 하나의 메시지 → 여러 구독자",
          "구독자: 이메일, SMS, HTTP, Lambda, SQS",
          "팬아웃 패턴에 적합",
        ],
        examTips: [
          "'하나의 메시지를 여러 곳에 전달' / '알림' = SNS",
          "SNS vs SQS: 팬아웃·알림(SNS) vs 큐·순차 처리(SQS)",
        ],
        pricing: "요청 수 + 전송 건당 과금",
      },
      {
        name: "SQS",
        summary: "메시지 큐. 비동기 디커플링",
        compare: "SNS",
        description: "Amazon SQS는 마이크로서비스 간 비동기 통신을 위한 완전관리형 메시지 대기열 서비스입니다. 발신자와 수신자를 분리(디커플링)하여 시스템 안정성을 높입니다.",
        keyFeatures: [
          "메시지를 큐에 저장, 소비자가 꺼내 처리",
          "Standard 큐(순서 보장 X, 무제한) vs FIFO 큐(순서 보장)",
          "시스템 간 디커플링으로 장애 전파 방지",
        ],
        examTips: [
          "'디커플링' / '비동기 처리' / '메시지 큐' = SQS",
          "SQS vs SNS: 큐·폴링(SQS) vs 푸시·팬아웃(SNS)",
        ],
        pricing: "요청 수 기반. 프리 티어: 월 100만 요청",
      },
      {
        name: "API Gateway",
        summary: "API 관리. REST/HTTP API 생성",
        compare: "",
        description: "Amazon API Gateway는 REST, HTTP, WebSocket API를 생성·관리하는 완전관리형 서비스입니다. Lambda와 함께 서버리스 백엔드를 구축하는 데 자주 사용됩니다.",
        keyFeatures: [
          "REST API 및 WebSocket API 지원",
          "Lambda와 통합하여 서버리스 API 구축",
          "요청 제한(throttling), 캐싱 기능",
          "API 키, 사용량 계획으로 접근 제어",
        ],
        examTips: [
          "'API 생성·관리' / 'Lambda 앞단' = API Gateway",
          "API Gateway + Lambda = 서버리스 API의 대표 조합",
        ],
        pricing: "API 호출 수 + 데이터 전송 비용",
      },
    ],
  },
  {
    category: "Billing, Pricing and Support",
    services: [
      {
        name: "Cost Explorer",
        summary: "비용 분석. 사용량 시각화",
        compare: "Budgets",
        description: "AWS Cost Explorer는 AWS 비용과 사용량을 시각화하고 분석하는 도구입니다. 어떤 서비스에 얼마를 썼는지 파악하고, 향후 비용을 예측할 수 있습니다.",
        keyFeatures: [
          "서비스별/계정별/태그별 비용 분석",
          "과거 사용량 기반 비용 예측",
          "예약 인스턴스 권장 구매안 제공",
        ],
        examTips: [
          "'비용 분석' / '얼마 썼는지 확인' = Cost Explorer",
          "Cost Explorer vs Budgets: 분석·시각화 vs 예산 초과 알림",
        ],
        pricing: "무료",
      },
      {
        name: "Budgets",
        summary: "예산 관리. 초과 시 알림",
        compare: "Cost Explorer",
        description: "AWS Budgets는 사용자 정의 예산을 설정하고, 비용이나 사용량이 임계값을 초과하면 알림을 보내는 서비스입니다.",
        keyFeatures: [
          "비용/사용량/예약 커버리지별 예산 설정",
          "임계값 초과 시 이메일/SNS 알림",
          "예산 초과 시 자동 조치(Budget Actions) 설정 가능",
        ],
        examTips: [
          "'예산 설정' / '비용 초과 알림' = Budgets",
          "Budgets vs Cost Explorer: 알림·제한 vs 분석·시각화",
        ],
        pricing: "처음 2개 예산 무료, 이후 예산당 비용",
      },
      {
        name: "Pricing Calculator",
        summary: "비용 견적. 서비스 요금 사전 예측",
        compare: "",
        description: "AWS Pricing Calculator는 AWS 서비스 사용 비용을 사전에 예측하고 견적을 생성하는 무료 도구입니다.",
        keyFeatures: [
          "서비스별 예상 월 비용 계산",
          "여러 서비스 조합 견적 생성",
          "견적 저장 및 공유 가능",
        ],
        examTips: [
          "'사전 비용 예측' / '견적' = Pricing Calculator",
          "실제 사용 전 비용을 추정할 때 사용",
        ],
        pricing: "무료 도구",
      },
      {
        name: "Trusted Advisor",
        summary: "모범 사례 추천. 비용, 성능, 보안 점검",
        compare: "",
        description: "AWS Trusted Advisor는 AWS 환경을 비용, 성능, 보안, 내결함성, 서비스 한도 5개 축으로 점검하고 개선을 권고하는 서비스입니다.",
        keyFeatures: [
          "5개 카테고리: 비용/성능/보안/내결함성/서비스 한도",
          "기본 플랜: 핵심 보안 + 서비스 한도 체크만",
          "Business 이상 플랜: 전체 체크 활성화",
        ],
        examTips: [
          "'모범 사례 권고' / '비용 절감 추천' = Trusted Advisor",
          "전체 체크는 Business Support 이상 필요",
          "무료 체크: S3 버킷 권한, 보안 그룹, 서비스 한도 등",
        ],
        pricing: "Support 플랜에 포함",
      },
      {
        name: "Organizations",
        summary: "멀티 계정 관리. 통합 결제",
        compare: "",
        description: "AWS Organizations는 여러 AWS 계정을 중앙에서 관리하고 통합 결제를 제공하는 서비스입니다. 볼륨 할인 혜택을 받을 수 있습니다.",
        keyFeatures: [
          "여러 계정을 하나의 조직으로 묶어 관리",
          "통합 결제(Consolidated Billing)로 볼륨 할인",
          "SCP(서비스 제어 정책)로 계정별 권한 제한",
        ],
        examTips: [
          "'멀티 계정 관리' / '통합 결제' = Organizations",
          "통합 결제 → 볼륨 할인 + 예약 인스턴스 공유",
          "SCP = 계정의 최대 허용 범위 제한",
        ],
        pricing: "무료",
      },
      {
        name: "Support Plans",
        summary: "기술 지원 플랜. Basic/Developer/Business/Enterprise",
        compare: "",
        description: "AWS Support Plans는 기술 지원 수준을 결정하는 플랜입니다. Basic(무료)부터 Enterprise(전담 TAM)까지 4단계로 제공됩니다.",
        keyFeatures: [
          "Basic: 무료, 문서/포럼 접근만",
          "Developer: 업무 시간 이메일 지원",
          "Business: 24/7 전화/채팅, 1시간 긴급 응답, 전체 Trusted Advisor",
          "Enterprise: 전담 TAM(Technical Account Manager), 15분 긴급 응답",
        ],
        examTips: [
          "'24/7 기술 지원' = Business 이상",
          "'전담 TAM' = Enterprise",
          "'전체 Trusted Advisor 체크' = Business 이상",
          "Basic은 과금/계정 문의만 가능 — 기술 지원 X",
        ],
        pricing: "Basic: 무료, Developer: $29~/월, Business: $100~/월, Enterprise: $15,000~/월",
      },
      {
        name: "Free Tier",
        summary: "무료 체험. 항시 무료/12개월 무료/평가판",
        compare: "",
        description: "AWS Free Tier는 AWS 서비스를 무료로 체험할 수 있는 프로그램입니다. 3가지 유형이 있습니다.",
        keyFeatures: [
          "항시 무료: Lambda 100만 요청/월, DynamoDB 25GB 등 (계속 무료)",
          "12개월 무료: EC2 t2.micro 750시간/월, S3 5GB 등 (가입 후 1년)",
          "평가판: 특정 서비스 단기 무료 체험",
        ],
        examTips: [
          "Free Tier 3가지 유형 구분이 시험에 출제됨",
          "항시 무료(Always Free) vs 12개월 무료 vs 단기 평가판",
          "EC2 t2.micro 750시간 = 12개월 무료 (항시 무료 아님!)",
          "Lambda 100만 요청 = 항시 무료",
        ],
        pricing: "무료 (한도 초과 시 과금 주의)",
      },
    ],
  },
];
