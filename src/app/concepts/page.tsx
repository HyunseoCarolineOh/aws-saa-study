"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Question, ServiceStats } from "@/lib/types";
import { getAllServiceStats } from "@/lib/store";
import { getDataServiceNames } from "@/lib/serviceMap";

interface AWSService {
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

interface AWSCategory {
  category: string;
  services: AWSService[];
}

// 빈출 상위 20개 서비스에 상세 정보 포함
const AWS_SERVICES: AWSCategory[] = [
  { category: "컴퓨팅", services: [
    {
      name: "EC2",
      summary: "가상 서버. 다양한 인스턴스 유형으로 컴퓨팅 용량 제공",
      compare: "Lambda, ECS, Lightsail",
      frequency: 243,
      description: "Amazon EC2는 클라우드에서 크기 조정이 가능한 컴퓨팅 용량을 제공하는 핵심 서비스입니다. 다양한 인스턴스 패밀리(범용 M, 컴퓨팅 최적화 C, 메모리 최적화 R, 스토리지 최적화 I/D, 가속 컴퓨팅 P/G)를 제공하며, 워크로드 특성에 따라 적합한 유형을 선택해야 합니다. 온디맨드, 예약, 스팟, 전용 호스트 등 다양한 구매 옵션이 있습니다.",
      keyFeatures: [
        "인스턴스 패밀리: 범용(M/T), 컴퓨팅(C), 메모리(R/X), 스토리지(I/D), GPU(P/G)",
        "구매 옵션: 온디맨드, 예약(1/3년), 스팟(최대 90% 할인), Savings Plans",
        "Auto Scaling 그룹으로 자동 확장/축소 가능",
        "배치 그룹: 클러스터(저지연), 분산(고가용성), 파티션(대규모 분산시스템)",
        "인스턴스 스토어(임시) vs EBS(영구) 스토리지 선택",
      ],
      useCases: [
        "웹/앱 서버 호스팅 (ALB + Auto Scaling 조합)",
        "HPC(고성능 컴퓨팅) — 클러스터 배치 그룹 + EFA",
        "개발/테스트 환경 — 스팟 인스턴스로 비용 절감",
        "데이터베이스 서버 — 메모리 최적화 인스턴스(R 시리즈)",
      ],
      examTips: [
        "인스턴스 스토어는 임시 저장소 — 재부팅 시 데이터 유지, 중지/종료 시 삭제",
        "스팟 인스턴스는 중단 가능성이 있어 상태 비저장(stateless) 워크로드에 적합",
        "'최소 비용'이 키워드면 스팟 > 예약 > 온디맨드 순으로 고려",
        "전용 호스트/전용 인스턴스는 라이선스 규정 준수 문제에 사용",
      ],
      pricing: "온디맨드(시간/초 단위), 예약(최대 72% 할인), 스팟(최대 90% 할인, 중단 가능), Savings Plans(유연한 할인)",
    },
    {
      name: "Lambda",
      summary: "서버리스 함수. 이벤트 기반으로 코드를 실행, 최대 15분",
      compare: "EC2, Fargate",
      frequency: 147,
      description: "AWS Lambda는 서버를 프로비저닝하거나 관리하지 않고도 코드를 실행할 수 있는 서버리스 컴퓨팅 서비스입니다. 이벤트(S3 업로드, API Gateway 요청, DynamoDB 변경 등)에 의해 트리거되며, 실행 시간에 대해서만 요금이 부과됩니다. 최대 실행 시간은 15분이며, 메모리는 128MB~10GB까지 설정 가능합니다.",
      keyFeatures: [
        "최대 실행 시간: 15분 (초과 시 Step Functions나 ECS/Fargate 고려)",
        "동시 실행 수: 리전당 기본 1,000개 (증가 요청 가능)",
        "VPC 내부/외부 모두 배포 가능 (VPC 연결 시 ENI 사용)",
        "레이어(Layer)로 공통 라이브러리 공유 가능",
        "프로비저닝된 동시성으로 콜드 스타트 최소화",
      ],
      useCases: [
        "API Gateway + Lambda로 서버리스 REST API 구축",
        "S3 이벤트 트리거 — 이미지 리사이즈, 파일 처리",
        "DynamoDB Streams + Lambda로 실시간 데이터 변환",
        "CloudWatch Events/EventBridge로 정기 작업(cron) 실행",
      ],
      examTips: [
        "'서버리스' + '이벤트 기반' + '최소 운영 오버헤드' = Lambda",
        "15분 제한 초과하는 장시간 작업 → Fargate 또는 EC2",
        "콜드 스타트 문제 → 프로비저닝된 동시성 사용",
        "데이터베이스 연결 관리 → RDS Proxy 사용",
      ],
      pricing: "요청 수 + 실행 시간(GB-초) 기반 과금. 프리 티어: 월 100만 요청 + 40만 GB-초 무료",
    },
    {
      name: "ECS",
      summary: "컨테이너 오케스트레이션. Docker 컨테이너 관리",
      compare: "EKS, Lambda",
      frequency: 33,
      description: "Amazon ECS는 Docker 컨테이너를 실행, 중지, 관리할 수 있는 완전관리형 컨테이너 오케스트레이션 서비스입니다. EC2 인스턴스(EC2 시작 유형) 또는 서버리스(Fargate 시작 유형)로 실행할 수 있습니다.",
      keyFeatures: [
        "EC2 시작 유형: 직접 인스턴스 관리, 세밀한 제어 가능",
        "Fargate 시작 유형: 서버리스, 인프라 관리 불필요",
        "태스크 정의(Task Definition)로 컨테이너 구성 정의",
        "ALB와 통합하여 동적 포트 매핑 지원",
      ],
      useCases: [
        "마이크로서비스 아키텍처 구현",
        "장시간 실행되는 컨테이너 워크로드 (Lambda 15분 제한 초과)",
      ],
      examTips: [
        "'컨테이너' + '인프라 관리 불필요' = ECS + Fargate",
        "'컨테이너' + '세밀한 인스턴스 제어' = ECS + EC2 시작 유형",
        "Lambda 15분 제한 초과 + 서버리스 → Fargate",
      ],
      pricing: "Fargate: vCPU/메모리 사용량 기반. EC2 시작 유형: 기반 EC2 인스턴스 비용만",
    },
    { name: "EKS", summary: "관리형 Kubernetes. 컨테이너 오케스트레이션", compare: "ECS" },
    { name: "Fargate", summary: "서버리스 컨테이너. ECS/EKS와 함께 사용, 인프라 관리 불필요", compare: "EC2" },
    { name: "Elastic Beanstalk", summary: "PaaS. 코드만 업로드하면 자동으로 인프라 프로비저닝", compare: "ECS, Lambda" },
    { name: "Batch", summary: "배치 컴퓨팅. 대규모 배치 작업 자동 관리", compare: "Lambda, Step Functions" },
  ]},
  { category: "스토리지", services: [
    {
      name: "S3",
      summary: "객체 스토리지. 무제한 용량, 11 9's 내구성",
      compare: "EBS, EFS",
      frequency: 211,
      description: "Amazon S3는 업계 최고의 확장성, 데이터 가용성, 보안 및 성능을 제공하는 객체 스토리지 서비스입니다. 99.999999999%(11 9's)의 내구성을 설계 목표로 하며, 다양한 스토리지 클래스를 통해 비용을 최적화할 수 있습니다. 정적 웹 호스팅, 데이터 레이크, 백업/아카이브 등 다양한 용도로 사용됩니다.",
      keyFeatures: [
        "스토리지 클래스: Standard, IA(Infrequent Access), One Zone-IA, Glacier Instant/Flexible/Deep Archive, Intelligent-Tiering",
        "버전 관리: 객체의 모든 버전을 보존, 실수 삭제 방지",
        "수명 주기 정책: 자동으로 스토리지 클래스 전환/만료 설정",
        "S3 Transfer Acceleration: CloudFront 엣지 로케이션 활용한 빠른 업로드",
        "Cross-Region Replication(CRR)/Same-Region Replication(SRR)",
        "서버 측 암호화: SSE-S3, SSE-KMS, SSE-C",
      ],
      useCases: [
        "정적 웹사이트 호스팅 (CloudFront와 조합)",
        "데이터 레이크 — Athena로 직접 SQL 분석",
        "백업/아카이브 — Glacier로 장기 저장 (비용 최소화)",
        "로그 저장소 — CloudTrail, VPC Flow Logs, ALB 로그",
      ],
      examTips: [
        "'자주 액세스' = Standard, '가끔 액세스' = IA, '아카이브' = Glacier",
        "Glacier Instant Retrieval: 밀리초 검색, Flexible: 분~시간, Deep Archive: 12~48시간",
        "S3 Intelligent-Tiering: 액세스 패턴 모를 때 자동 최적화",
        "S3 이벤트 알림: Lambda, SQS, SNS, EventBridge로 트리거 가능",
        "멀티파트 업로드: 100MB 이상 파일 권장, 5GB 이상 필수",
        "VPC 내부에서 S3 접근: 게이트웨이 VPC 엔드포인트 (무료)",
      ],
      pricing: "스토리지 용량 + 요청 수 + 데이터 전송 비용. 스토리지 클래스별로 GB당 단가 다름",
    },
    {
      name: "EBS",
      summary: "블록 스토리지. EC2에 연결, 단일 AZ",
      compare: "S3, EFS",
      frequency: 47,
      description: "Amazon EBS는 EC2 인스턴스에 연결하여 사용하는 고성능 블록 스토리지입니다. 단일 AZ 내에서만 사용 가능하며, 스냅샷을 통해 다른 AZ나 리전으로 복사할 수 있습니다. 볼륨 유형에 따라 IOPS와 처리량이 다릅니다.",
      keyFeatures: [
        "gp3/gp2(범용 SSD): 대부분의 워크로드에 적합",
        "io2/io1(프로비저닝된 IOPS SSD): 고성능 DB(최대 64,000 IOPS)",
        "st1(처리량 최적화 HDD): 빅데이터, 로그 처리",
        "sc1(Cold HDD): 아카이브, 가장 저렴",
        "스냅샷: 증분 백업, S3에 저장, 리전 간 복사 가능",
        "Multi-Attach: io1/io2만 지원, 동일 AZ 내 최대 16개 인스턴스 공유",
      ],
      useCases: [
        "데이터베이스 스토리지 (io2로 고성능 보장)",
        "부트 볼륨 (gp3 기본)",
        "빅데이터/로그 처리 (st1 처리량 최적화)",
      ],
      examTips: [
        "EBS는 단일 AZ — 다중 AZ 공유 필요 시 EFS 선택",
        "IOPS 요구사항이 높으면 io2, 일반적이면 gp3",
        "인스턴스 스토어 vs EBS: 임시 vs 영구, 성능 vs 내구성",
        "'암호화된 스냅샷을 다른 리전에 복사' = 리전 간 DR 패턴",
      ],
      pricing: "볼륨 유형별 GB당 + 프로비저닝된 IOPS당 과금. 스냅샷은 S3 저장 비용",
    },
    {
      name: "EFS",
      summary: "파일 스토리지. 여러 EC2에서 공유, NFS 프로토콜",
      compare: "EBS, FSx",
      frequency: 33,
      description: "Amazon EFS는 여러 EC2 인스턴스에서 동시에 액세스 가능한 완전관리형 NFS 파일 시스템입니다. 자동으로 확장/축소되며, 여러 AZ에 걸쳐 데이터를 복제하여 높은 가용성과 내구성을 제공합니다. Linux 전용입니다.",
      keyFeatures: [
        "자동 확장: 파일 추가/삭제 시 자동으로 크기 조정",
        "다중 AZ 접근: 여러 AZ의 EC2에서 동시 마운트 가능",
        "성능 모드: 범용(기본), 최대 I/O(고도 병렬)",
        "스토리지 클래스: Standard, IA(Infrequent Access)",
        "수명 주기 관리: 자동으로 IA로 전환하여 비용 절감",
      ],
      useCases: [
        "여러 EC2 인스턴스 간 파일 공유 (웹 서버 콘텐츠)",
        "빅데이터/분석 워크로드 (높은 처리량 필요)",
        "컨테이너 스토리지 (ECS/EKS에서 공유 볼륨)",
      ],
      examTips: [
        "'여러 EC2에서 공유' = EFS (EBS는 단일 AZ, 단일 인스턴스)",
        "'NFS' 또는 'POSIX' 키워드 = EFS",
        "'Windows 파일 공유' 또는 'SMB' = FSx for Windows",
        "Linux 전용 — Windows는 FSx 사용",
      ],
      pricing: "사용한 스토리지 양만 과금 (프로비저닝 불필요). IA 클래스는 더 저렴",
    },
    { name: "FSx", summary: "관리형 파일 시스템. Windows(SMB) 또는 Lustre(HPC)", compare: "EFS" },
    { name: "Storage Gateway", summary: "온프레미스-AWS 하이브리드 스토리지 연결", compare: "DataSync, Snow Family" },
    { name: "Snow Family", summary: "대용량 데이터 물리 전송. Snowcone/Snowball/Snowmobile", compare: "DataSync, Storage Gateway" },
  ]},
  { category: "데이터베이스", services: [
    {
      name: "RDS",
      summary: "관리형 관계형 DB. MySQL, PostgreSQL, Oracle 등",
      compare: "Aurora, DynamoDB",
      frequency: 102,
      description: "Amazon RDS는 클라우드에서 관계형 데이터베이스를 쉽게 설정, 운영, 확장할 수 있는 관리형 서비스입니다. MySQL, PostgreSQL, MariaDB, Oracle, SQL Server, Aurora를 지원하며, 자동 백업, 패치, 장애 조치를 제공합니다.",
      keyFeatures: [
        "Multi-AZ 배포: 동기식 복제, 자동 장애 조치 (고가용성)",
        "읽기 전용 복제본: 비동기 복제, 읽기 성능 확장 (최대 15개, Aurora)",
        "자동 백업: 최대 35일 보존, 특정 시점 복원(PITR) 가능",
        "스토리지 자동 확장: 설정된 임계값 초과 시 자동 증가",
        "IAM DB 인증: 토큰 기반 인증 (MySQL, PostgreSQL)",
        "RDS Proxy: Lambda 등의 연결 풀링, 장애 조치 시간 단축",
      ],
      useCases: [
        "트랜잭션 처리(OLTP) 워크로드",
        "읽기 전용 복제본으로 읽기 부하 분산",
        "Multi-AZ + 읽기 복제본 조합으로 고가용성 + 고성능",
      ],
      examTips: [
        "Multi-AZ = 고가용성(HA), 읽기 복제본 = 성능 확장",
        "'자동 장애 조치' 키워드 = Multi-AZ 배포",
        "교차 리전 읽기 복제본 = DR + 전 세계 읽기 성능",
        "RDS는 관리형이므로 OS 접근 불가 — OS 접근 필요 시 EC2에 직접 DB 설치",
        "암호화: 생성 시에만 활성화 가능. 기존 DB 암호화하려면 스냅샷 → 암호화된 복사본 → 복원",
      ],
      pricing: "인스턴스 유형 + 스토리지 + I/O + 백업 + 데이터 전송 비용",
    },
    {
      name: "Aurora",
      summary: "AWS 클라우드 네이티브 관계형 DB. RDS 대비 5배 성능",
      compare: "RDS",
      frequency: 45,
      description: "Amazon Aurora는 MySQL 및 PostgreSQL과 호환되는 고성능 관계형 데이터베이스입니다. 상용 DB 수준의 성능과 가용성을 제공하면서 비용은 1/10 수준입니다. 3개 AZ에 6개 복사본으로 자동 복제되며, 최대 15개의 읽기 복제본을 지원합니다.",
      keyFeatures: [
        "자동 3개 AZ 복제 (6개 복사본): 2개까지 손실 허용(쓰기), 3개까지(읽기)",
        "Aurora Serverless: 자동 확장/축소, 간헐적 워크로드에 적합",
        "Aurora Global Database: 1초 미만 교차 리전 복제, DR용",
        "Aurora 읽기 복제본: 최대 15개, 자동 장애 조치 우선순위 설정",
        "자동 스토리지 확장: 10GB~128TB까지 자동 증가",
      ],
      useCases: [
        "고성능 OLTP (MySQL/PostgreSQL 대비 5배 빠른 처리)",
        "글로벌 분산 데이터베이스 (Aurora Global Database)",
        "간헐적 워크로드 (Aurora Serverless로 비용 최적화)",
      ],
      examTips: [
        "'MySQL/PostgreSQL 호환' + '고성능' + '고가용성' = Aurora",
        "Aurora Serverless: '예측 불가능한 워크로드' 또는 '간헐적 사용'",
        "Aurora Global Database: '교차 리전 DR' 또는 '전 세계 저지연 읽기'",
        "RDS와 비교: Aurora가 더 비싸지만 성능/가용성 우수",
      ],
      pricing: "인스턴스 + I/O 요청 + 스토리지 과금. Serverless는 ACU(Aurora Capacity Unit) 기반",
    },
    {
      name: "DynamoDB",
      summary: "서버리스 NoSQL. 밀리초 지연, 무한 확장",
      compare: "RDS, DocumentDB",
      frequency: 82,
      description: "Amazon DynamoDB는 어떤 규모에서도 한 자릿수 밀리초 성능을 제공하는 완전관리형 서버리스 NoSQL 데이터베이스입니다. 키-값 및 문서 데이터 모델을 지원하며, 자동으로 테이블을 확장/축소합니다.",
      keyFeatures: [
        "온디맨드/프로비저닝된 용량 모드: 트래픽 예측 가능 여부에 따라 선택",
        "DynamoDB Streams: 테이블 변경 사항 실시간 캡처 (Lambda 트리거)",
        "Global Tables: 다중 리전 복제, 다중 리전 활성-활성",
        "DAX(DynamoDB Accelerator): 인메모리 캐시, 마이크로초 응답",
        "TTL(Time to Live): 자동 항목 만료 삭제",
        "PITR(Point-in-Time Recovery): 최대 35일 내 특정 시점 복원",
      ],
      useCases: [
        "세션 관리, 사용자 프로필 저장 (키-값 조회)",
        "IoT 데이터 수집 (대규모 쓰기 처리)",
        "게임 리더보드 (빠른 읽기/쓰기)",
        "이벤트 기반 아키텍처 (DynamoDB Streams + Lambda)",
      ],
      examTips: [
        "'서버리스' + 'NoSQL' + '밀리초 지연' = DynamoDB",
        "'세션 관리' 또는 '키-값 저장소' = DynamoDB",
        "DAX: DynamoDB 앞에 캐시 레이어, ElastiCache와 구분",
        "Global Tables: '다중 리전 활성-활성' 패턴",
        "트랜잭션 지원: DynamoDB Transactions (ACID)",
      ],
      pricing: "온디맨드: 읽기/쓰기 요청 단위 과금. 프로비저닝: RCU/WCU 단위 예약",
    },
    {
      name: "ElastiCache",
      summary: "인메모리 캐시. Redis 또는 Memcached",
      compare: "DynamoDB DAX",
      frequency: 36,
      description: "Amazon ElastiCache는 Redis 또는 Memcached와 호환되는 완전관리형 인메모리 캐싱 서비스입니다. 데이터베이스 부하를 줄이고 애플리케이션 성능을 향상시킵니다.",
      keyFeatures: [
        "Redis: 복제, 클러스터 모드, 지속성, Pub/Sub 지원",
        "Memcached: 단순 캐싱, 멀티스레드, 수평 확장",
        "Redis용 Global Datastore: 교차 리전 복제",
      ],
      useCases: [
        "DB 쿼리 결과 캐싱으로 읽기 부하 감소",
        "세션 스토어 (Redis의 지속성 활용)",
        "실시간 리더보드/카운터 (Redis Sorted Sets)",
      ],
      examTips: [
        "'인메모리 캐시' + '지속성 필요' = ElastiCache for Redis",
        "'단순 캐싱' + '멀티스레드' = Memcached",
        "DynamoDB DAX는 DynamoDB 전용 캐시, ElastiCache는 범용",
      ],
      pricing: "노드 유형 + 노드 수 기반 과금",
    },
    { name: "Redshift", summary: "데이터 웨어하우스. OLAP, 페타바이트 규모 분석", compare: "Athena, RDS" },
    { name: "DocumentDB", summary: "MongoDB 호환 문서 DB", compare: "DynamoDB" },
    { name: "Neptune", summary: "그래프 데이터베이스. 관계 중심 데이터", compare: "DynamoDB" },
  ]},
  { category: "네트워킹", services: [
    {
      name: "VPC",
      summary: "가상 네트워크. 서브넷, 라우팅, 보안 그룹 관리",
      compare: "",
      frequency: 67,
      description: "Amazon VPC는 AWS 클라우드에서 논리적으로 격리된 가상 네트워크를 정의할 수 있게 해줍니다. IP 주소 범위 선택, 서브넷 생성, 라우팅 테이블 및 네트워크 게이트웨이 구성을 완전히 제어할 수 있습니다.",
      keyFeatures: [
        "퍼블릭/프라이빗 서브넷: 인터넷 접근 여부로 구분",
        "NAT Gateway: 프라이빗 서브넷에서 인터넷 아웃바운드 허용",
        "보안 그룹(Stateful) vs NACL(Stateless): 인스턴스 vs 서브넷 수준 방화벽",
        "VPC 엔드포인트: 게이트웨이(S3, DynamoDB) / 인터페이스(기타 서비스)",
        "VPC Peering: 두 VPC 간 프라이빗 연결 (전이적 라우팅 불가)",
        "VPC Flow Logs: 네트워크 트래픽 캡처 (CloudWatch/S3에 저장)",
      ],
      useCases: [
        "멀티 티어 아키텍처 (퍼블릭/프라이빗 서브넷 분리)",
        "VPC 엔드포인트로 프라이빗 서비스 접근 (인터넷 우회)",
        "하이브리드 클라우드 (VPN/Direct Connect 연결)",
      ],
      examTips: [
        "'인터넷 없이 S3 접근' = S3 게이트웨이 VPC 엔드포인트",
        "'프라이빗 서브넷에서 인터넷 접근' = NAT Gateway",
        "보안 그룹은 허용만, NACL은 허용+거부 가능",
        "VPC Peering은 전이적 라우팅 불가 — 허브 구조 필요 시 Transit Gateway",
      ],
      pricing: "VPC 자체는 무료. NAT Gateway, VPC 엔드포인트(인터페이스), 데이터 전송에 비용",
    },
    {
      name: "CloudFront",
      summary: "CDN. 전 세계 엣지 로케이션에서 콘텐츠 캐싱/배포",
      compare: "Global Accelerator",
      frequency: 55,
      description: "Amazon CloudFront는 전 세계 엣지 로케이션 네트워크를 통해 콘텐츠를 빠르게 배포하는 CDN 서비스입니다. S3, EC2, ALB, Lambda@Edge 등과 통합되어 정적/동적 콘텐츠를 캐싱합니다.",
      keyFeatures: [
        "전 세계 400+ 엣지 로케이션에서 콘텐츠 캐싱",
        "OAC(Origin Access Control): S3 버킷 직접 접근 차단, CloudFront만 허용",
        "Lambda@Edge / CloudFront Functions: 엣지에서 코드 실행",
        "SSL/TLS 암호화: ACM 인증서 무료 사용",
        "지역 제한(Geo Restriction): 특정 국가 차단/허용",
        "캐시 무효화(Invalidation): 특정 파일 캐시 강제 삭제",
      ],
      useCases: [
        "정적 웹사이트 배포 (S3 + CloudFront)",
        "동적 콘텐츠 가속 (ALB 오리진)",
        "DDoS 방어 (Shield Standard 기본 통합)",
      ],
      examTips: [
        "'전 세계 사용자' + '지연 시간 감소' = CloudFront",
        "S3 + CloudFront: OAC로 S3 직접 접근 차단",
        "CloudFront vs Global Accelerator: 캐싱 vs TCP/UDP 최적화",
        "'HTTPS 강제' = CloudFront의 Viewer Protocol Policy",
      ],
      pricing: "데이터 전송(엣지→사용자) + HTTP/HTTPS 요청 수 + 무효화 요청",
    },
    {
      name: "ALB",
      summary: "Application Load Balancer. HTTP/HTTPS, 경로 기반 라우팅",
      compare: "NLB, CLB",
      frequency: 44,
      description: "Application Load Balancer는 HTTP/HTTPS 트래픽을 위한 7계층(애플리케이션) 로드 밸런서입니다. URL 경로, 호스트 헤더, HTTP 메서드 등에 기반한 세밀한 라우팅을 지원합니다.",
      keyFeatures: [
        "경로 기반 라우팅: /api/* → 서비스A, /web/* → 서비스B",
        "호스트 기반 라우팅: api.example.com vs web.example.com",
        "타겟 그룹: EC2, IP, Lambda 함수를 타겟으로 설정 가능",
        "WebSocket/HTTP/2 지원",
        "SSL 종료(Offloading): ACM 인증서로 HTTPS 처리",
        "고정 응답, 리다이렉트 규칙 설정 가능",
      ],
      useCases: [
        "마이크로서비스 라우팅 (경로/호스트 기반)",
        "컨테이너 서비스 앞단 (ECS 동적 포트 매핑)",
        "서버리스 API (타겟으로 Lambda 연결)",
      ],
      examTips: [
        "HTTP/HTTPS 트래픽 = ALB, TCP/UDP = NLB",
        "'고정 IP 필요' = NLB (ALB는 고정 IP 불가, 도메인만)",
        "'초저지연' = NLB, '경로 기반 라우팅' = ALB",
        "ALB + WAF 조합으로 웹 방화벽 적용 가능",
      ],
      pricing: "시간당 + LCU(Load Balancer Capacity Unit) 사용량 기반",
    },
    { name: "Route 53", summary: "DNS 서비스. 도메인 등록, 라우팅 정책", compare: "", frequency: 31 },
    { name: "Direct Connect", summary: "전용 네트워크 연결. 온프레미스-AWS 간 안정적 연결", compare: "VPN" },
    { name: "Global Accelerator", summary: "글로벌 네트워크 최적화. AWS 백본 네트워크 활용", compare: "CloudFront" },
    { name: "Transit Gateway", summary: "VPC 간 중앙 허브. 수천 개 VPC 연결", compare: "VPC Peering" },
    { name: "NLB", summary: "Network Load Balancer. TCP/UDP, 초저지연, 고정 IP", compare: "ALB" },
  ]},
  { category: "보안", services: [
    {
      name: "IAM",
      summary: "ID/액세스 관리. 사용자, 역할, 정책",
      compare: "Cognito",
      frequency: 65,
      description: "AWS IAM은 AWS 서비스와 리소스에 대한 액세스를 안전하게 관리할 수 있는 서비스입니다. 사용자, 그룹, 역할을 생성하고, 세밀한 권한 정책을 적용하여 최소 권한 원칙을 실현합니다.",
      keyFeatures: [
        "사용자/그룹/역할: 역할은 임시 자격 증명으로 서비스 간 접근에 사용",
        "정책: JSON 기반, 자격 증명 기반(Identity) vs 리소스 기반(Resource)",
        "MFA(다중 인증): 추가 보안 계층",
        "Access Analyzer: 외부 공유 리소스 자동 탐지",
        "STS(Security Token Service): 임시 자격 증명 발급 (AssumeRole)",
        "교차 계정 접근: 역할 위임(AssumeRole)으로 다른 계정 리소스 접근",
      ],
      useCases: [
        "EC2에서 S3 접근: IAM 역할을 인스턴스 프로필에 연결",
        "교차 계정 접근: 다른 계정의 역할을 AssumeRole",
        "최소 권한 원칙 적용: IAM Access Analyzer 활용",
      ],
      examTips: [
        "'EC2에서 다른 AWS 서비스 접근' = IAM 역할 (액세스 키 X)",
        "'교차 계정' = IAM 역할 + STS AssumeRole",
        "'외부 사용자 인증' = Cognito (IAM은 AWS 내부용)",
        "정책 평가: 명시적 거부 > 명시적 허용 > 기본 거부",
      ],
      pricing: "무료 (IAM 자체에 비용 없음)",
    },
    {
      name: "KMS",
      summary: "키 관리. 암호화 키 생성/관리",
      compare: "CloudHSM",
      frequency: 32,
      description: "AWS KMS는 암호화 키를 쉽게 생성하고 제어할 수 있는 관리형 서비스입니다. S3, EBS, RDS 등 대부분의 AWS 서비스와 통합되어 데이터 암호화를 지원합니다.",
      keyFeatures: [
        "CMK(Customer Master Key): AWS 관리형 / 고객 관리형 / 사용자 지정(외부 가져오기)",
        "자동 키 로테이션: AWS 관리형(매년 자동), 고객 관리형(활성화 가능)",
        "봉투 암호화: 데이터 키로 데이터 암호화, CMK로 데이터 키 암호화",
        "교차 리전 키 복제: 다중 리전 키 지원",
      ],
      useCases: [
        "S3, EBS, RDS 데이터 암호화 (SSE-KMS)",
        "Lambda 환경 변수 암호화",
        "교차 계정 암호화 데이터 공유",
      ],
      examTips: [
        "'암호화 키 관리' + '감사 추적(CloudTrail)' = KMS",
        "'FIPS 140-2 Level 3' 또는 '전용 하드웨어' = CloudHSM",
        "S3 SSE-S3 vs SSE-KMS vs SSE-C: 키 관리 주체가 다름",
        "KMS는 4KB 이하 직접 암호화, 초과 시 봉투 암호화",
      ],
      pricing: "키당 월 $1 + API 호출 건당 과금",
    },
    { name: "Cognito", summary: "사용자 인증. 앱 사용자 풀, 소셜 로그인", compare: "IAM" },
    { name: "WAF", summary: "웹 방화벽. SQL 인젝션, XSS 방어", compare: "Shield" },
    { name: "Shield", summary: "DDoS 보호. Standard(무료), Advanced(유료)", compare: "WAF" },
    { name: "GuardDuty", summary: "위협 탐지. ML 기반 이상 행동 감지", compare: "Inspector, Detective" },
    { name: "Secrets Manager", summary: "비밀 관리. DB 자격 증명 자동 로테이션", compare: "Parameter Store" },
    { name: "ACM", summary: "인증서 관리. SSL/TLS 인증서 무료 발급", compare: "" },
  ]},
  { category: "분석/통합", services: [
    {
      name: "SQS",
      summary: "메시지 큐. 비동기 디커플링, Standard/FIFO",
      compare: "SNS, Kinesis",
      frequency: 52,
      description: "Amazon SQS는 마이크로서비스, 분산 시스템, 서버리스 애플리케이션을 분리(decouple)하는 완전관리형 메시지 대기열 서비스입니다. Standard 큐(순서 보장 X, 무제한 처리량)와 FIFO 큐(순서 보장, 초당 300개)를 제공합니다.",
      keyFeatures: [
        "Standard 큐: 무제한 처리량, 최소 1회 전달, 순서 보장 없음",
        "FIFO 큐: 정확히 1회 처리, 순서 보장, 초당 300 메시지(배치 3,000)",
        "가시성 타임아웃: 메시지 처리 중 다른 소비자에게 숨김",
        "Dead Letter Queue(DLQ): 처리 실패 메시지 격리",
        "긴 폴링(Long Polling): 빈 응답 감소, 비용 절감",
        "메시지 보존: 1분~14일 (기본 4일)",
      ],
      useCases: [
        "비동기 처리: 주문 접수 → SQS → 처리 서비스",
        "버퍼링: 급격한 트래픽 급증 흡수",
        "팬아웃: SNS → 여러 SQS 큐로 분산",
      ],
      examTips: [
        "'디커플링' + '비동기' = SQS",
        "'순서 보장' + '중복 제거' = FIFO 큐",
        "'메시지를 여러 구독자에게' = SNS (SQS는 단일 소비자)",
        "SQS + Auto Scaling: 큐 길이 기반 EC2 자동 확장",
        "'실시간 스트리밍' = Kinesis (SQS는 메시지 큐)",
      ],
      pricing: "요청 수 기반 과금. 프리 티어: 월 100만 요청 무료",
    },
    {
      name: "SNS",
      summary: "푸시 알림/Pub-Sub. 팬아웃 패턴",
      compare: "SQS, EventBridge",
      frequency: 48,
      description: "Amazon SNS는 pub/sub 메시징 및 모바일 알림 서비스입니다. 하나의 메시지를 여러 구독자(Lambda, SQS, HTTP, 이메일, SMS)에게 동시에 전달하는 팬아웃(fan-out) 패턴에 적합합니다.",
      keyFeatures: [
        "토픽 기반 pub/sub: 발행자 → 토픽 → 다수의 구독자",
        "구독 유형: SQS, Lambda, HTTP/S, 이메일, SMS",
        "메시지 필터링: 구독자별로 특정 메시지만 수신",
        "FIFO 토픽: SQS FIFO와 결합하여 순서 보장",
      ],
      useCases: [
        "팬아웃: SNS → 여러 SQS 큐에 동시 전달",
        "알림: CloudWatch 알람 → SNS → 이메일/SMS",
        "이벤트 기반 아키텍처: S3 이벤트 → SNS → Lambda",
      ],
      examTips: [
        "'하나의 이벤트를 여러 서비스에 전달' = SNS 팬아웃",
        "'SNS + SQS 팬아웃' 은 매우 빈출 패턴",
        "SNS는 메시지 보존 안 함 (SQS는 보존)",
        "EventBridge vs SNS: 이벤트 규칙/필터링이 복잡하면 EventBridge",
      ],
      pricing: "발행 + 전송 건당 과금. 프리 티어: 월 100만 SNS 발행 무료",
    },
    {
      name: "EventBridge",
      summary: "이벤트 버스. 이벤트 기반 아키텍처",
      compare: "SNS, SQS",
      frequency: 37,
      description: "Amazon EventBridge는 자체 애플리케이션, SaaS, AWS 서비스의 이벤트를 사용하여 이벤트 기반 아키텍처를 구축하는 서버리스 이벤트 버스입니다. 복잡한 이벤트 필터링과 라우팅 규칙을 지원합니다.",
      keyFeatures: [
        "이벤트 규칙: 패턴 매칭으로 이벤트 필터링/라우팅",
        "스케줄 규칙: cron 식으로 정기적 이벤트 생성",
        "SaaS 통합: Zendesk, Datadog 등 외부 서비스 이벤트 수신",
        "이벤트 아카이브/리플레이: 이벤트 저장 후 재생 가능",
      ],
      useCases: [
        "AWS 서비스 이벤트 기반 자동화 (EC2 상태 변경 등)",
        "스케줄 기반 Lambda 트리거 (cron 대체)",
        "크로스 계정/리전 이벤트 전달",
      ],
      examTips: [
        "'이벤트 기반' + '규칙/패턴 매칭' = EventBridge",
        "'CloudWatch Events'의 후속 서비스 = EventBridge",
        "SNS vs EventBridge: 단순 팬아웃은 SNS, 복잡한 라우팅은 EventBridge",
      ],
      pricing: "이벤트 발행 건당 과금 (커스텀 이벤트, AWS 이벤트는 무료)",
    },
    {
      name: "API Gateway",
      summary: "API 관리. REST/WebSocket API 생성/관리",
      compare: "ALB",
      frequency: 47,
      description: "Amazon API Gateway는 REST, HTTP, WebSocket API를 생성, 게시, 관리하는 완전관리형 서비스입니다. Lambda, HTTP 엔드포인트, AWS 서비스와 통합하여 서버리스 API를 구축할 수 있습니다.",
      keyFeatures: [
        "REST API: 완전한 API 관리 (캐싱, 스로틀링, API 키)",
        "HTTP API: 경량화, REST API 대비 저렴하고 빠름",
        "WebSocket API: 실시간 양방향 통신 (채팅 등)",
        "Lambda 프록시 통합: 요청을 Lambda로 직접 전달",
        "사용량 계획 + API 키로 접근 제어",
        "WAF 통합으로 API 보호",
      ],
      useCases: [
        "서버리스 API (API Gateway + Lambda)",
        "외부 클라이언트의 AWS 서비스 접근 프론트도어",
        "마이크로서비스 API 집약",
      ],
      examTips: [
        "'REST API' + '서버리스' = API Gateway + Lambda",
        "'외부 클라이언트' + 'AWS 서비스 접근' = API Gateway",
        "캐싱/스로틀링/API 키 필요하면 REST API, 아니면 HTTP API (더 저렴)",
      ],
      pricing: "API 호출 수 + 데이터 전송 + 캐시 메모리(선택) 비용",
    },
    { name: "Athena", summary: "서버리스 쿼리. S3 데이터를 SQL로 직접 분석", compare: "Redshift" },
    { name: "Kinesis", summary: "실시간 스트리밍. 데이터 수집/처리/분석", compare: "SQS, MSK" },
    { name: "Glue", summary: "서버리스 ETL. 데이터 카탈로그, 크롤러", compare: "EMR" },
    { name: "Step Functions", summary: "워크플로 오케스트레이션. 상태 머신 기반", compare: "SWF" },
  ]},
  { category: "관리/모니터링", services: [
    {
      name: "CloudWatch",
      summary: "모니터링. 지표, 로그, 알람",
      compare: "X-Ray",
      frequency: 50,
      description: "Amazon CloudWatch는 AWS 리소스와 애플리케이션을 실시간으로 모니터링하는 서비스입니다. 지표(Metrics) 수집, 로그(Logs) 관리, 알람(Alarms) 설정, 대시보드 구성 등 종합적인 모니터링을 제공합니다.",
      keyFeatures: [
        "지표(Metrics): CPU, 네트워크, 디스크 등 기본 지표 + 사용자 정의 지표",
        "알람: 지표 임계값 기반 알림 (SNS, Auto Scaling 연동)",
        "로그: CloudWatch Logs에서 로그 수집/검색/분석",
        "이벤트/EventBridge: AWS 리소스 변경 이벤트 감지",
        "Container Insights: ECS/EKS 컨테이너 모니터링",
        "기본 모니터링(5분) vs 세부 모니터링(1분, 추가 비용)",
      ],
      useCases: [
        "EC2 CPU 사용률 기반 Auto Scaling 트리거",
        "Lambda 실행 로그 수집 및 분석",
        "SQS 큐 길이 기반 알람 설정",
      ],
      examTips: [
        "'모니터링' + '알람' = CloudWatch",
        "기본 모니터링은 5분 간격 — 1분 필요시 세부 모니터링 활성화",
        "EC2 메모리/디스크 사용량은 기본 지표가 아님 → CloudWatch Agent 필요",
        "CloudWatch vs CloudTrail: 성능 모니터링 vs API 감사",
      ],
      pricing: "기본 모니터링 무료. 세부 모니터링, 사용자 지정 지표, 로그 저장에 비용",
    },
    {
      name: "Auto Scaling",
      summary: "자동 확장/축소. 수요에 따라 EC2 인스턴스 조정",
      compare: "",
      frequency: 91,
      description: "AWS Auto Scaling은 애플리케이션 수요에 따라 EC2 인스턴스를 자동으로 추가/제거하는 서비스입니다. 시작 템플릿, 최소/최대/원하는 용량, 조정 정책을 설정하여 성능과 비용을 최적화합니다.",
      keyFeatures: [
        "조정 정책: 대상 추적(Target Tracking), 단계(Step), 단순(Simple), 예약(Scheduled)",
        "대상 추적 조정: CPU 70% 유지 등 목표 지표 기반 자동 조정",
        "예측 조정: ML 기반으로 트래픽 패턴 예측하여 선제적 확장",
        "시작 템플릿: AMI, 인스턴스 유형, 키 페어, 보안 그룹 등 정의",
        "쿨다운 기간: 조정 활동 후 안정화 대기 시간",
        "수명 주기 후크: 인스턴스 시작/종료 시 사용자 정의 작업 실행",
      ],
      useCases: [
        "웹 서버 자동 확장 (ALB + Auto Scaling Group)",
        "SQS 큐 길이 기반 작업자 인스턴스 확장",
        "예약 조정: 특정 시간대에 미리 확장",
      ],
      examTips: [
        "'수요 기반 자동 확장' = Auto Scaling Group",
        "'CPU 70% 유지' = 대상 추적 조정 정책",
        "'트래픽 패턴 예측' = 예측 조정",
        "Auto Scaling은 ALB와 함께 사용하는 것이 일반적",
        "혼합 인스턴스 정책: 온디맨드 + 스팟 조합으로 비용 최적화",
      ],
      pricing: "Auto Scaling 자체는 무료. 실행되는 EC2 인스턴스 비용만 발생",
    },
    { name: "CloudTrail", summary: "API 감사 로그. 누가 무엇을 했는지 기록", compare: "Config" },
    { name: "Config", summary: "리소스 구성 추적. 규정 준수 평가", compare: "CloudTrail" },
    { name: "Systems Manager", summary: "운영 관리. 패치, 파라미터 스토어, 세션 매니저", compare: "" },
    { name: "CloudFormation", summary: "IaC. JSON/YAML 템플릿으로 인프라 프로비저닝", compare: "Terraform" },
    { name: "Organizations", summary: "멀티 계정 관리. SCP, 통합 결제", compare: "" },
    { name: "Trusted Advisor", summary: "모범 사례 추천. 비용, 성능, 보안 최적화", compare: "" },
    { name: "Cost Explorer", summary: "비용 분석. 사용량 시각화, 예측", compare: "Budgets" },
  ]},
];

// 개념 페이지에 있는 모든 서비스명 추출
const ALL_CONCEPT_NAMES = AWS_SERVICES.flatMap((cat) =>
  cat.services.map((svc) => svc.name)
);

export default function ConceptsPage() {
  const [search, setSearch] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [statsMap, setStatsMap] = useState<Map<string, ServiceStats>>(new Map());

  useEffect(() => {
    fetch("/api/questions")
      .then((res) => res.json())
      .then((data) => {
        const questions = data.questions as Question[];
        const stats = getAllServiceStats(questions, getDataServiceNames, ALL_CONCEPT_NAMES);
        setStatsMap(stats);
      })
      .catch(() => {});
  }, []);

  const filteredCategories = AWS_SERVICES.map((cat) => ({
    ...cat,
    services: cat.services.filter(
      (svc) =>
        svc.name.toLowerCase().includes(search.toLowerCase()) ||
        svc.summary.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.services.length > 0);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
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
                {cat.services.map((svc) => {
                  const hasDetail = !!svc.description;
                  const isExpanded = expandedService === svc.name;
                  const stats = statsMap.get(svc.name);
                  const hasQuestions = stats && stats.totalQuestions > 0;
                  return (
                    <div key={svc.name} className="border-b border-border last:border-b-0">
                      {/* 서비스 헤더 */}
                      <button
                        onClick={() => hasDetail && setExpandedService(isExpanded ? null : svc.name)}
                        className={`w-full px-4 py-3 text-left ${hasDetail ? "cursor-pointer" : "cursor-default"}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm text-primary">{svc.name}</p>
                            {svc.frequency && svc.frequency >= 30 && (
                              <span className="text-[10px] bg-danger-bg text-danger-fg border border-danger-border px-1.5 py-0.5 rounded font-medium">
                                빈출 {svc.frequency}문제
                              </span>
                            )}
                            {hasDetail && (
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                상세
                              </span>
                            )}
                            {hasQuestions && stats.solvedCount > 0 && (
                              <span className="text-[10px] bg-success-bg text-success-fg border border-success-border px-1.5 py-0.5 rounded font-medium">
                                {stats.solvedCount}/{stats.totalQuestions} ({stats.accuracy}%)
                              </span>
                            )}
                          </div>
                          {svc.compare && (
                            <span className="text-[10px] text-muted flex-shrink-0">vs {svc.compare}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-0.5 leading-relaxed">{svc.summary}</p>
                      </button>
                      {/* 관련 문제 풀기 링크 */}
                      {hasQuestions && (
                        <div className="px-4 pb-2">
                          <Link
                            href={`/questions?service=${encodeURIComponent(svc.name)}`}
                            className="inline-block text-[11px] text-primary font-medium hover:underline"
                          >
                            관련 문제 풀기 ({stats.totalQuestions}문제) &rarr;
                          </Link>
                        </div>
                      )}

                      {/* 상세 정보 */}
                      {isExpanded && hasDetail && (
                        <div className="px-4 pb-4 space-y-3">
                          {/* 설명 */}
                          <div className="bg-card-elevated rounded-lg p-3">
                            <p className="text-xs text-foreground leading-relaxed">{svc.description}</p>
                          </div>

                          {/* 핵심 특징 */}
                          {svc.keyFeatures && (
                            <div>
                              <p className="text-xs font-bold text-foreground mb-1.5">핵심 특징</p>
                              <ul className="space-y-1">
                                {svc.keyFeatures.map((f, i) => (
                                  <li key={i} className="text-xs text-muted leading-relaxed flex gap-1.5">
                                    <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                                    <span>{f}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* 시험 팁 */}
                          {svc.examTips && (
                            <div className="bg-warning-bg border border-warning-border rounded-lg p-3">
                              <p className="text-xs font-bold text-warning-fg mb-1.5">SAA 시험 팁</p>
                              <ul className="space-y-1">
                                {svc.examTips.map((tip, i) => (
                                  <li key={i} className="text-xs text-warning-fg leading-relaxed flex gap-1.5">
                                    <span className="flex-shrink-0">💡</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* 사용 사례 */}
                          {svc.useCases && (
                            <div>
                              <p className="text-xs font-bold text-foreground mb-1.5">주요 사용 사례</p>
                              <ul className="space-y-1">
                                {svc.useCases.map((uc, i) => (
                                  <li key={i} className="text-xs text-muted leading-relaxed flex gap-1.5">
                                    <span className="text-success flex-shrink-0">▸</span>
                                    <span>{uc}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* 비용 */}
                          {svc.pricing && (
                            <div className="text-xs text-muted bg-card-elevated rounded-lg p-2">
                              <span className="font-medium">비용: </span>{svc.pricing}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
