"use client";

import { useState } from "react";

const AWS_SERVICES = [
  { category: "컴퓨팅", services: [
    { name: "EC2", summary: "가상 서버. 다양한 인스턴스 유형으로 컴퓨팅 용량 제공", compare: "Lambda, ECS, Lightsail" },
    { name: "Lambda", summary: "서버리스 함수. 이벤트 기반으로 코드를 실행, 최대 15분", compare: "EC2, Fargate" },
    { name: "ECS", summary: "컨테이너 오케스트레이션. Docker 컨테이너 관리", compare: "EKS, Lambda" },
    { name: "EKS", summary: "관리형 Kubernetes. 컨테이너 오케스트레이션", compare: "ECS" },
    { name: "Fargate", summary: "서버리스 컨테이너. ECS/EKS와 함께 사용, 인프라 관리 불필요", compare: "EC2" },
    { name: "Elastic Beanstalk", summary: "PaaS. 코드만 업로드하면 자동으로 인프라 프로비저닝", compare: "ECS, Lambda" },
    { name: "Batch", summary: "배치 컴퓨팅. 대규모 배치 작업 자동 관리", compare: "Lambda, Step Functions" },
  ]},
  { category: "스토리지", services: [
    { name: "S3", summary: "객체 스토리지. 무제한 용량, 11 9's 내구성", compare: "EBS, EFS" },
    { name: "EBS", summary: "블록 스토리지. EC2에 연결, 단일 AZ", compare: "S3, EFS" },
    { name: "EFS", summary: "파일 스토리지. 여러 EC2에서 공유, NFS 프로토콜", compare: "EBS, FSx" },
    { name: "FSx", summary: "관리형 파일 시스템. Windows(SMB) 또는 Lustre(HPC)", compare: "EFS" },
    { name: "Storage Gateway", summary: "온프레미스-AWS 하이브리드 스토리지 연결", compare: "DataSync, Snow Family" },
    { name: "Snow Family", summary: "대용량 데이터 물리 전송. Snowcone/Snowball/Snowmobile", compare: "DataSync, Storage Gateway" },
  ]},
  { category: "데이터베이스", services: [
    { name: "RDS", summary: "관리형 관계형 DB. MySQL, PostgreSQL, Oracle 등", compare: "Aurora, DynamoDB" },
    { name: "Aurora", summary: "AWS 클라우드 네이티브 관계형 DB. RDS 대비 5배 성능", compare: "RDS" },
    { name: "DynamoDB", summary: "서버리스 NoSQL. 밀리초 지연, 무한 확장", compare: "RDS, DocumentDB" },
    { name: "ElastiCache", summary: "인메모리 캐시. Redis 또는 Memcached", compare: "DynamoDB DAX" },
    { name: "Redshift", summary: "데이터 웨어하우스. OLAP, 페타바이트 규모 분석", compare: "Athena, RDS" },
    { name: "DocumentDB", summary: "MongoDB 호환 문서 DB", compare: "DynamoDB" },
    { name: "Neptune", summary: "그래프 데이터베이스. 관계 중심 데이터", compare: "DynamoDB" },
  ]},
  { category: "네트워킹", services: [
    { name: "VPC", summary: "가상 네트워크. 서브넷, 라우팅, 보안 그룹 관리", compare: "" },
    { name: "CloudFront", summary: "CDN. 전 세계 엣지 로케이션에서 콘텐츠 캐싱/배포", compare: "Global Accelerator" },
    { name: "Route 53", summary: "DNS 서비스. 도메인 등록, 라우팅 정책", compare: "" },
    { name: "Direct Connect", summary: "전용 네트워크 연결. 온프레미스-AWS 간 안정적 연결", compare: "VPN" },
    { name: "Global Accelerator", summary: "글로벌 네트워크 최적화. AWS 백본 네트워크 활용", compare: "CloudFront" },
    { name: "Transit Gateway", summary: "VPC 간 중앙 허브. 수천 개 VPC 연결", compare: "VPC Peering" },
    { name: "ALB", summary: "Application Load Balancer. HTTP/HTTPS, 경로 기반 라우팅", compare: "NLB, CLB" },
    { name: "NLB", summary: "Network Load Balancer. TCP/UDP, 초저지연, 고정 IP", compare: "ALB" },
  ]},
  { category: "보안", services: [
    { name: "IAM", summary: "ID/액세스 관리. 사용자, 역할, 정책", compare: "Cognito" },
    { name: "Cognito", summary: "사용자 인증. 앱 사용자 풀, 소셜 로그인", compare: "IAM" },
    { name: "KMS", summary: "키 관리. 암호화 키 생성/관리", compare: "CloudHSM" },
    { name: "WAF", summary: "웹 방화벽. SQL 인젝션, XSS 방어", compare: "Shield" },
    { name: "Shield", summary: "DDoS 보호. Standard(무료), Advanced(유료)", compare: "WAF" },
    { name: "GuardDuty", summary: "위협 탐지. ML 기반 이상 행동 감지", compare: "Inspector, Detective" },
    { name: "Secrets Manager", summary: "비밀 관리. DB 자격 증명 자동 로테이션", compare: "Parameter Store" },
    { name: "ACM", summary: "인증서 관리. SSL/TLS 인증서 무료 발급", compare: "" },
  ]},
  { category: "분석/통합", services: [
    { name: "Athena", summary: "서버리스 쿼리. S3 데이터를 SQL로 직접 분석", compare: "Redshift" },
    { name: "Kinesis", summary: "실시간 스트리밍. 데이터 수집/처리/분석", compare: "SQS, MSK" },
    { name: "Glue", summary: "서버리스 ETL. 데이터 카탈로그, 크롤러", compare: "EMR" },
    { name: "SQS", summary: "메시지 큐. 비동기 디커플링, Standard/FIFO", compare: "SNS, Kinesis" },
    { name: "SNS", summary: "푸시 알림/Pub-Sub. 팬아웃 패턴", compare: "SQS, EventBridge" },
    { name: "EventBridge", summary: "이벤트 버스. 이벤트 기반 아키텍처", compare: "SNS, SQS" },
    { name: "Step Functions", summary: "워크플로 오케스트레이션. 상태 머신 기반", compare: "SWF" },
    { name: "API Gateway", summary: "API 관리. REST/WebSocket API 생성/관리", compare: "ALB" },
  ]},
  { category: "관리/모니터링", services: [
    { name: "CloudWatch", summary: "모니터링. 지표, 로그, 알람", compare: "X-Ray" },
    { name: "CloudTrail", summary: "API 감사 로그. 누가 무엇을 했는지 기록", compare: "Config" },
    { name: "Config", summary: "리소스 구성 추적. 규정 준수 평가", compare: "CloudTrail" },
    { name: "Systems Manager", summary: "운영 관리. 패치, 파라미터 스토어, 세션 매니저", compare: "" },
    { name: "CloudFormation", summary: "IaC. JSON/YAML 템플릿으로 인프라 프로비저닝", compare: "Terraform" },
    { name: "Organizations", summary: "멀티 계정 관리. SCP, 통합 결제", compare: "" },
    { name: "Trusted Advisor", summary: "모범 사례 추천. 비용, 성능, 보안 최적화", compare: "" },
    { name: "Cost Explorer", summary: "비용 분석. 사용량 시각화, 예측", compare: "Budgets" },
  ]},
];

export default function ConceptsPage() {
  const [search, setSearch] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const filteredCategories = AWS_SERVICES.map((cat) => ({
    ...cat,
    services: cat.services.filter(
      (svc) =>
        svc.name.toLowerCase().includes(search.toLowerCase()) ||
        svc.summary.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.services.length > 0);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="text-xl font-bold mb-4">AWS 서비스 사전</h1>

      {/* 검색 */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="서비스명 또는 키워드 검색..."
        className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:border-primary"
      />

      {/* 카테고리별 서비스 */}
      <div className="space-y-3">
        {filteredCategories.map((cat) => (
          <div key={cat.category} className="bg-card rounded-xl border border-border overflow-hidden">
            <button
              onClick={() =>
                setExpandedCategory(expandedCategory === cat.category ? null : cat.category)
              }
              className="w-full flex justify-between items-center p-4 text-left"
            >
              <div>
                <span className="font-medium text-sm">{cat.category}</span>
                <span className="text-xs text-muted ml-2">{cat.services.length}개</span>
              </div>
              <span className="text-muted text-xs">
                {expandedCategory === cat.category ? "접기" : "펼치기"}
              </span>
            </button>
            {(expandedCategory === cat.category || search) && (
              <div className="border-t border-border">
                {cat.services.map((svc) => (
                  <div key={svc.name} className="px-4 py-3 border-b border-border last:border-b-0">
                    <div className="flex items-start justify-between">
                      <p className="font-semibold text-sm text-primary">{svc.name}</p>
                      {svc.compare && (
                        <span className="text-[10px] text-muted">vs {svc.compare}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{svc.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
