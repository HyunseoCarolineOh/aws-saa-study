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
    {
      name: "EKS",
      summary: "관리형 Kubernetes. 컨테이너 오케스트레이션",
      compare: "ECS",
      description: "Amazon EKS(Elastic Kubernetes Service)는 AWS에서 Kubernetes 컨트롤 플레인을 완전 관리해주는 서비스입니다. 업스트림 Kubernetes API와 호환되어 기존 Kubernetes 워크로드/도구(Helm, Kubectl, Argo 등)를 그대로 사용할 수 있으며, 워커 노드는 EC2 또는 Fargate로 구성합니다.",
      keyFeatures: [
        "관리형 컨트롤 플레인(Multi-AZ) — 마스터 노드 관리 불필요",
        "노드 옵션: Managed Node Groups(EC2), Self-managed EC2, Fargate(서버리스)",
        "AWS VPC CNI — Pod에 VPC IP 직접 할당",
        "IRSA(IAM Roles for Service Accounts) — Pod 단위 IAM 권한",
        "EKS Anywhere(온프레미스)·EKS Distro(업스트림 K8s 배포판)",
        "App Mesh/ALB Ingress Controller로 서비스 메시·L7 라우팅",
      ],
      examTips: [
        "'Kubernetes 호환 필수' / '멀티 클라우드 K8s' / '오픈소스 생태계' = EKS",
        "EKS vs ECS: Kubernetes 표준(EKS) vs AWS 전용·간단(ECS)",
        "노드 관리 부담 제거 = EKS + Fargate (서버리스 Pod)",
        "Pod별 세밀한 IAM 권한 = IRSA",
        "온프레미스 K8s도 관리 = EKS Anywhere",
      ],
    },
    {
      name: "Fargate",
      summary: "서버리스 컨테이너. ECS/EKS와 함께 사용, 인프라 관리 불필요",
      compare: "EC2",
      description: "AWS Fargate는 ECS와 EKS에서 워커 노드를 프로비저닝·관리하지 않고 컨테이너를 실행하는 서버리스 실행 엔진입니다. 태스크/Pod 단위로 vCPU·메모리를 선언하면 AWS가 기반 호스트를 자동 관리하며, 사용한 자원량에 대해서만 과금됩니다.",
      keyFeatures: [
        "서버리스 — EC2 호스트 관리/패치/스케일링 불필요",
        "ECS on Fargate + EKS on Fargate 양쪽 지원",
        "태스크/Pod별 vCPU·메모리 선언 → 초당 과금",
        "VPC 내부 ENI 할당으로 네트워크 격리",
        "Fargate Spot — 최대 70% 할인, 중단 가능(Stateless 워크로드)",
      ],
      examTips: [
        "'서버 관리 없이 컨테이너 실행' = Fargate",
        "Fargate vs EC2 Launch Type: 서버리스·관리 부담 없음(Fargate) vs 세밀한 튜닝·저렴한 장시간 실행(EC2)",
        "SSH 접속 불가 — 디버깅은 ECS Exec/logging 의존",
        "비용 민감·대규모 장시간 실행 = EC2 Launch Type이 더 저렴할 수 있음",
        "Fargate Spot으로 Stateless 배치 작업 비용 절감",
      ],
    },
    {
      name: "Elastic Beanstalk",
      summary: "PaaS. 코드만 업로드하면 자동으로 인프라 프로비저닝",
      compare: "ECS, Lambda",
      description: "AWS Elastic Beanstalk은 코드만 업로드하면 웹 애플리케이션을 실행할 인프라(EC2/ELB/Auto Scaling/RDS 등)를 자동으로 프로비저닝·관리해 주는 PaaS 서비스입니다. 내부적으로는 CloudFormation 스택으로 구성되며, 개발자가 인프라를 직접 관리하지 않고도 확장성과 배포 자동화를 얻을 수 있습니다.",
      keyFeatures: [
        "지원 플랫폼: Java/.NET/Node.js/Python/Ruby/Go/PHP/Docker",
        "환경 유형: Web Server / Worker(SQS 연계)",
        "배포 전략: All-at-once, Rolling, Rolling with Additional Batch, Immutable, Blue/Green(스왑 URL)",
        "내부는 CloudFormation + ALB/ASG/EC2 — 필요 시 커스터마이징(.ebextensions)",
        "환경 변수·로그·헬스체크·롤백 관리",
      ],
      examTips: [
        "'코드만 올리면 자동으로 웹앱 인프라 구성' = Elastic Beanstalk",
        "Beanstalk vs ECS/Lambda: 전통적 웹앱 PaaS(Beanstalk) vs 컨테이너 세밀 제어(ECS)/이벤트 기반(Lambda)",
        "무중단 배포 중 빠른 롤백 강조 = Immutable 또는 Blue/Green",
        "Beanstalk은 관리·과금되는 인프라(EC2/ELB)를 사용자가 직접 본다(Lambda처럼 완전 추상화 아님)",
        "고정 빈도 배치/큐 처리는 Worker Environment + SQS",
      ],
    },
    {
      name: "Batch",
      summary: "배치 컴퓨팅. 대규모 배치 작업 자동 관리",
      compare: "Lambda, Step Functions",
      description: "AWS Batch는 대규모 배치 컴퓨팅 작업을 큐잉·스케줄링·실행해 주는 관리형 서비스입니다. 작업 정의(Job Definition)를 만들고 큐(Job Queue)에 제출하면, 컴퓨팅 환경(EC2/Fargate/Spot)에서 자동으로 인스턴스를 확장해 실행합니다. 15분 제한에 걸리는 Lambda로는 어려운 장시간·고자원 작업에 적합합니다.",
      keyFeatures: [
        "컴퓨팅 환경: Managed(AWS가 EC2/Fargate 프로비저닝) / Unmanaged",
        "Job Queue + Priority로 작업 스케줄링",
        "Array Jobs — 수천 개 유사 작업을 인덱스 기반 병렬 실행",
        "Job Dependencies — 선후관계 정의",
        "Spot 통합으로 비용 최적화, Fair-share Scheduling 지원",
        "실행 시간 제한 없음(Lambda 대비 장기 실행 가능)",
      ],
      examTips: [
        "'대규모·장시간 배치 처리' / '수천 개 병렬 작업' = AWS Batch",
        "Batch vs Lambda: 장시간(>15분)·고자원·컨테이너(Batch) vs 짧은 이벤트 처리(Lambda)",
        "Batch vs Step Functions: 컴퓨팅 자원 관리·스케줄링(Batch) vs 상태 기반 워크플로 오케스트레이션(Step Functions) — 조합 가능",
        "비용 최적화 핵심 = EC2/Fargate **Spot** 컴퓨팅 환경 사용",
        "수천 개 유사 태스크 병렬 실행 = Array Job",
      ],
    },
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
    {
      name: "FSx",
      summary: "관리형 파일 시스템. Windows(SMB) 또는 Lustre(HPC)",
      compare: "EFS",
      description: "Amazon FSx는 특정 파일 시스템 엔진에 특화된 관리형 파일 스토리지 모음입니다. Windows 파일 서버(SMB/AD), Lustre(HPC), NetApp ONTAP(다중 프로토콜/스냅샷), OpenZFS(POSIX 고성능) 네 가지 엔진을 제공합니다. EFS는 리눅스 NFS 공유용, FSx는 엔진별 특수 요구에 대응합니다.",
      keyFeatures: [
        "FSx for Windows File Server — SMB + Active Directory 통합",
        "FSx for Lustre — HPC·ML 트레이닝용 초고성능 병렬 파일 시스템, S3 연동",
        "FSx for NetApp ONTAP — 다중 프로토콜(NFS/SMB/iSCSI) + 스냅샷·SnapMirror",
        "FSx for OpenZFS — 고성능 POSIX, 스냅샷·클론",
        "VPC 내부 배치, Multi-AZ 옵션(Windows/ONTAP)",
      ],
      examTips: [
        "'Windows 파일 서버 + Active Directory' = FSx for Windows",
        "'HPC / ML 트레이닝 / S3 연동 고성능' = FSx for Lustre",
        "'NFS + SMB 동시 / 스냅샷 / 온프레미스 NetApp 이관' = FSx for ONTAP",
        "FSx vs EFS: 엔진 특화(FSx) vs 리눅스 NFS 공유(EFS)",
        "Lustre는 S3 데이터를 Lazy-Load해 처리 후 결과를 S3로 내보내기 가능",
      ],
    },
    {
      name: "Storage Gateway",
      summary: "온프레미스-AWS 하이브리드 스토리지 연결",
      compare: "DataSync, Snow Family",
      description: "AWS Storage Gateway는 온프레미스 애플리케이션이 AWS 스토리지(S3/Glacier/EBS 스냅샷)를 로컬 파일·볼륨·테이프처럼 사용할 수 있게 해주는 하이브리드 스토리지 게이트웨이입니다. 세 가지 게이트웨이 유형을 제공합니다.",
      keyFeatures: [
        "S3 File Gateway — NFS/SMB로 S3에 파일 저장, 로컬 캐시 제공",
        "FSx File Gateway — 온프레미스에서 FSx for Windows에 로우 레이턴시 접근",
        "Volume Gateway — iSCSI 블록 볼륨(Cached/Stored 모드) + EBS 스냅샷",
        "Tape Gateway — 가상 테이프 라이브러리(VTL), 백업 SW가 S3/Glacier에 테이프 저장",
        "로컬 캐시로 자주 쓰는 데이터는 빠르게 제공",
      ],
      examTips: [
        "'온프레미스 앱이 S3를 파일 공유처럼 사용' = S3 File Gateway",
        "'테이프 백업 SW의 대상만 클라우드로 교체' = Tape Gateway (VTL)",
        "'iSCSI 볼륨으로 온프레미스 블록 스토리지 확장' = Volume Gateway",
        "Storage Gateway vs DataSync: 상시 하이브리드 접근(SG) vs 대량 일회성 이관·동기화(DataSync)",
        "Storage Gateway vs Snow Family: 네트워크 기반 지속 연동(SG) vs 물리 장치 대량 오프라인 이관(Snow)",
      ],
    },
    {
      name: "Snow Family",
      summary: "대용량 데이터 물리 전송. Snowcone/Snowball/Snowmobile",
      compare: "DataSync, Storage Gateway",
      description: "AWS Snow Family는 인터넷 대역폭이 부족하거나 네트워크 전송이 비현실적인 대용량 데이터를 물리 장치로 AWS에 이관·반출하는 서비스입니다. 원격·엣지 환경에서 일부 컴퓨팅도 수행할 수 있습니다. 2024년 이후 Snowmobile은 단종되었습니다.",
      keyFeatures: [
        "Snowcone — 소형(8TB/14TB), 배터리·Wi-Fi 지원, 엣지 컴퓨팅 소량 가능",
        "Snowball Edge Storage Optimized — 최대 80TB 저장(이관용 주력)",
        "Snowball Edge Compute Optimized — EC2/Lambda 엣지 컴퓨팅 + 저장",
        "데이터 256-bit 암호화, TPM 및 서명된 매니페스트로 무결성 보장",
        "오프라인 이관 대역 — 수십~수백 TB를 며칠 내 전달 가능",
      ],
      examTips: [
        "'인터넷 대역폭 부족 + 수십 TB 이상 이관' = Snow Family",
        "Snow vs DataSync: 오프라인 물리 이관(Snow) vs 온라인 네트워크 동기화(DataSync)",
        "엣지 현장에서 컴퓨팅까지 필요 = Snowball Edge Compute Optimized",
        "배터리·경량·이동성 강조 = Snowcone",
        "100PB 급 초대용량 이관이 필요한 경우 — 과거엔 Snowmobile이었으나 현재는 단종 → 대체로 Snowball 다수 병행 또는 Direct Connect 활용",
      ],
    },
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
    {
      name: "Redshift",
      summary: "데이터 웨어하우스. OLAP, 페타바이트 규모 분석",
      compare: "Athena, RDS",
      description: "Amazon Redshift는 페타바이트 규모의 완전 관리형 데이터 웨어하우스 서비스입니다. 열 기반(columnar) 저장과 MPP(대규모 병렬 처리) 아키텍처로 복잡한 분석 쿼리를 빠르게 실행합니다. Redshift Spectrum으로 S3의 데이터를 직접 쿼리할 수 있고, Redshift Serverless는 용량 관리 없이 사용량 기반으로 과금됩니다.",
      keyFeatures: [
        "열 기반 저장 + MPP로 대규모 집계/분석 쿼리 최적화",
        "Redshift Spectrum — S3 데이터를 외부 테이블로 직접 SQL 질의",
        "동시성 확장(Concurrency Scaling) — 피크 시 자동으로 읽기 클러스터 추가",
        "AQUA(Advanced Query Accelerator) — 하드웨어 가속 캐시",
        "Redshift Serverless — 클러스터 프로비저닝 불필요",
        "S3 + COPY 명령으로 대량 로드, UNLOAD로 내보내기",
      ],
      examTips: [
        "'데이터 웨어하우스' / 'OLAP' / '페타바이트 분석' = Redshift",
        "Redshift vs Athena: 정기적 복잡 분석(Redshift) vs 임시 S3 쿼리(Athena)",
        "Redshift vs RDS: OLAP(분석) vs OLTP(트랜잭션)",
        "S3에 이미 있는 데이터를 옮기지 않고 분석 = Redshift Spectrum",
        "클러스터 관리 부담 없이 분석 = Redshift Serverless",
      ],
    },
    {
      name: "DocumentDB",
      summary: "MongoDB 호환 문서 DB",
      compare: "DynamoDB",
      description: "Amazon DocumentDB는 MongoDB API와 호환되는 완전 관리형 문서 데이터베이스입니다. Aurora와 유사한 스토리지 분리 아키텍처로 내구성과 확장성을 제공하며, 기존 MongoDB 애플리케이션을 최소 수정으로 이관할 수 있습니다.",
      keyFeatures: [
        "MongoDB 3.6/4.0/5.0 API 호환 (단, 완전한 MongoDB는 아님)",
        "Aurora-style 스토리지 — 자동 복제(6-way, 3 AZ), 자동 장애 조치",
        "리더 인스턴스 최대 15개까지 확장 가능",
        "자동 백업(PITR), KMS 암호화, VPC 전용 배치",
        "Global Clusters로 멀티 리전 읽기·DR",
      ],
      examTips: [
        "'MongoDB 호환' / '관리형 문서 DB' = DocumentDB",
        "DocumentDB vs DynamoDB: MongoDB 호환 JSON 문서(DocumentDB) vs Key-Value/Document NoSQL(DynamoDB)",
        "기존 MongoDB 워크로드 AWS 이관 = DocumentDB (코드 변경 최소화)",
        "DocumentDB는 VPC 전용 — 인터넷에서 직접 접근 불가",
        "완벽한 MongoDB 기능 세트 필요 = EC2에 MongoDB 직접 설치 또는 Atlas 고려",
      ],
    },
    {
      name: "Neptune",
      summary: "그래프 데이터베이스. 관계 중심 데이터",
      compare: "DynamoDB",
      description: "Amazon Neptune은 관계 중심 데이터에 최적화된 완전 관리형 그래프 데이터베이스입니다. Property Graph(Gremlin, openCypher)와 RDF(SPARQL) 두 가지 모델을 지원하며, 소셜 네트워크·지식 그래프·사기 탐지·추천 엔진 등에 쓰입니다.",
      keyFeatures: [
        "Property Graph(Gremlin/openCypher)와 RDF(SPARQL) 질의 지원",
        "Aurora-style 스토리지 — 자동 복제(6-way, 3 AZ), PITR 백업",
        "읽기 복제본 최대 15개, 수 밀리초 단위 쿼리 지연",
        "Neptune ML — GNN(Graph Neural Network) 기반 예측",
        "Neptune Streams — 그래프 변경 이벤트 스트림",
        "VPC 전용, KMS 암호화",
      ],
      examTips: [
        "'관계/네트워크 탐색' / '소셜 네트워크' / '사기 탐지' / '지식 그래프' = Neptune",
        "Neptune vs DynamoDB: 다단계 관계 탐색(Neptune) vs 단순 Key-Value 조회(DynamoDB)",
        "추천 시스템·사기 탐지의 '연결 관계' 분석 키워드 = Neptune",
        "Property Graph는 Gremlin/openCypher, RDF는 SPARQL — 질의 언어 선택 주의",
        "그래프 기반 ML 예측 = Neptune ML",
      ],
    },
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
    {
      name: "Route 53",
      summary: "DNS 서비스. 도메인 등록, 라우팅 정책",
      compare: "",
      frequency: 31,
      description: "Amazon Route 53은 고가용성·저지연의 권위 DNS 서비스로, 도메인 등록, 상태 기반 장애 조치, 지리·지연 시간·가중치 기반 라우팅을 제공합니다. Alias 레코드로 AWS 리소스(CloudFront/ALB/S3 웹사이트 등)에 별도 비용 없이 연결할 수 있습니다.",
      keyFeatures: [
        "라우팅 정책: Simple/Weighted/Latency/Failover/Geolocation/Geoproximity/Multi-Value",
        "Health Check + Failover — 엔드포인트 헬스 기반 자동 전환",
        "Alias 레코드 — ALB/NLB/CloudFront/S3/API Gateway에 Zone Apex(루트 도메인) 연결",
        "Private Hosted Zone — VPC 내부 전용 DNS",
        "Route 53 Resolver — 온프레미스 ↔ VPC 간 DNS 쿼리 전달(Inbound/Outbound Endpoint)",
        "Domain Registrar 기능 — 도메인 등록/이전 가능",
      ],
      examTips: [
        "'글로벌 지연 최소화' = Latency-based Routing",
        "'재해 복구·액티브-패시브' = Failover Routing + Health Check",
        "'트래픽을 10:90으로 분배하며 카나리 배포' = Weighted Routing",
        "Zone Apex(예: example.com) → ALB/CloudFront 연결 = **Alias**(CNAME 불가)",
        "Route 53 vs Global Accelerator: DNS 레벨 라우팅 vs AWS 백본 네트워크로 TCP/UDP 트래픽 최적화",
        "온프레미스 DNS와 VPC DNS 연계 = Route 53 Resolver Endpoints",
      ],
    },
    {
      name: "Direct Connect",
      summary: "전용 네트워크 연결. 온프레미스-AWS 간 안정적 연결",
      compare: "VPN",
      description: "AWS Direct Connect(DX)는 온프레미스 데이터센터와 AWS를 전용 사설 회선으로 연결하는 서비스입니다. 인터넷을 거치지 않아 지연이 일정하고 대역폭이 큰 워크로드(대용량 데이터 이관, 하이브리드 DB 등)에 적합합니다. 구축에 수 주~수 개월이 걸릴 수 있어 단기 필요 시에는 Site-to-Site VPN이 대안입니다.",
      keyFeatures: [
        "1/10/100 Gbps 전용 회선 — Dedicated Connection 또는 Hosted Connection(파트너)",
        "Virtual Interface(VIF): Private(VPC 접근) / Public(AWS 공용 서비스) / Transit(Transit Gateway)",
        "DX Gateway — 여러 리전의 VPC를 단일 DX 연결로 접근",
        "MACsec 지원(10/100 Gbps) — 물리 링크 레벨 암호화",
        "이중화: DX 2회선 또는 DX + VPN 백업(SiteLink/Resiliency)",
      ],
      examTips: [
        "'일관된 저지연·대역폭' / '전용 회선' = Direct Connect",
        "DX는 **암호화되지 않음** — 암호화 필요 시 DX + IPsec VPN 조합 또는 MACsec",
        "DX vs VPN: 지연 일관성·고대역폭·비용↑(DX) vs 즉시 구성·인터넷 기반·저렴(VPN)",
        "여러 VPC·여러 리전을 하나의 DX로 = DX Gateway + Transit Gateway",
        "DR/백업 연결 = DX Primary + VPN Secondary (Active/Standby)",
        "구축에 시간 소요 — '빨리 필요' 키워드면 답은 VPN",
      ],
    },
    {
      name: "Global Accelerator",
      summary: "글로벌 네트워크 최적화. AWS 백본 네트워크 활용",
      compare: "CloudFront",
      description: "AWS Global Accelerator는 두 개의 고정 애니캐스트 IP를 제공해 사용자 트래픽을 가장 가까운 AWS 엣지 로케이션으로 끌어들인 뒤, AWS 글로벌 백본을 통해 지정된 리전의 엔드포인트로 전달합니다. TCP/UDP 기반으로 비-HTTP 워크로드에도 적합하며, 빠른 장애 조치를 제공합니다.",
      keyFeatures: [
        "2개의 고정 Anycast IP — 클라이언트 설정 변경 없이 백엔드 전환",
        "Endpoint Group을 가중치로 트래픽 분배, Traffic Dial로 리전 트래픽 비율 조절",
        "빠른 장애 조치(1분 이내) — 헬스체크 실패 시 다른 리전으로 전환",
        "TCP/UDP 지원 — 게임, VoIP, IoT 등 비-HTTP에도 사용 가능",
        "AWS Shield Standard 자동 적용",
        "Endpoint: ALB/NLB/EC2/Elastic IP",
      ],
      examTips: [
        "'비-HTTP(게임/VoIP) + 글로벌 저지연 + 고정 IP' = Global Accelerator",
        "Global Accelerator vs CloudFront: TCP/UDP 가속·원본 가속(GA) vs 정적/동적 HTTP 콘텐츠 캐싱(CloudFront)",
        "Multi-Region 빠른 Failover = Global Accelerator(1분) > Route 53(DNS TTL 의존)",
        "고정 IP 필요한 온프레미스 화이트리스트 요구사항 = Global Accelerator",
        "CloudFront에서 해결되는 HTTP(S) 정적 콘텐츠는 CloudFront가 더 저렴",
      ],
    },
    {
      name: "Transit Gateway",
      summary: "VPC 간 중앙 허브. 수천 개 VPC 연결",
      compare: "VPC Peering",
      description: "AWS Transit Gateway(TGW)는 여러 VPC와 온프레미스 네트워크(VPN/Direct Connect)를 허브-스포크 구조로 중앙 연결하는 네트워크 서비스입니다. VPC Peering이 Full-Mesh로 확장성 문제가 있는 반면, TGW는 단일 게이트웨이로 수천 개 VPC를 확장 가능하게 연결합니다.",
      keyFeatures: [
        "허브-스포크 아키텍처 — N개 VPC를 O(N) 연결로 통합",
        "Transit Gateway Route Tables — 경로 격리/공유 유연하게 설계",
        "VPN·Direct Connect·다른 리전 TGW(Peering)·SD-WAN 연결 지원",
        "Multicast 지원(일반 VPC에서는 불가)",
        "Resource Access Manager(RAM)로 크로스 계정 공유",
        "Network Manager로 글로벌 네트워크 시각화",
      ],
      examTips: [
        "'수십~수천 VPC + 온프레미스를 한 곳에 연결' = Transit Gateway",
        "TGW vs VPC Peering: 확장 가능 허브(TGW, 전이적) vs 1:1 메시(Peering, 비전이적)",
        "VPC Peering은 전이적 라우팅 안 됨 — 많아지면 TGW 고려",
        "리전 간 연결 = TGW Peering (별도 리전의 TGW 두 개를 Peering)",
        "VPC에서 Multicast 필요 = Transit Gateway (Multicast Domain)",
        "Direct Connect Gateway + Transit Gateway = 다수 VPC를 하나의 DX 회선으로",
      ],
    },
    {
      name: "NLB",
      summary: "Network Load Balancer. TCP/UDP, 초저지연, 고정 IP",
      compare: "ALB",
      description: "Network Load Balancer(NLB)는 L4(TCP/UDP/TLS) 수준에서 동작하는 초저지연·초고성능 로드 밸런서입니다. 가용 영역별로 고정 IP(Static/Elastic IP)를 제공하며, 초당 수백만 요청을 처리합니다. 대상의 소스 IP를 보존(Preserve)해 서버가 실제 클라이언트 IP를 보게 할 수 있습니다.",
      keyFeatures: [
        "L4 로드 밸런싱(TCP/UDP/TLS), 초당 수백만 요청",
        "가용 영역당 고정 IP(EIP 바인딩 가능) — 화이트리스트 요구사항 충족",
        "소스 IP 보존(Source IP Preservation) — 대상이 실제 클라이언트 IP 확인",
        "TLS 종단(SSL Offloading) 지원 — ACM 인증서 바인딩",
        "Target Type: Instance/IP/ALB/Lambda(불가, Lambda는 ALB만)",
        "PrivateLink 엔드포인트 서비스의 표준 백엔드",
      ],
      examTips: [
        "'TCP/UDP' / '초저지연' / '초당 수백만 요청' / '고정 IP' = NLB",
        "NLB vs ALB: L4 TCP/UDP·고정 IP(NLB) vs L7 HTTP/HTTPS·경로/호스트 기반 라우팅(ALB)",
        "클라이언트 실제 IP가 서버 로그에 그대로 필요 = NLB (Source IP Preserve)",
        "화이트리스트 대상 고정 IP 요구 = NLB(EIP) 또는 Global Accelerator",
        "PrivateLink(VPC Endpoint Service)의 백엔드는 NLB — ALB는 직접 불가",
        "Lambda 대상 연동은 ALB만 가능 — NLB는 지원하지 않음",
      ],
    },
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
    {
      name: "Cognito",
      summary: "사용자 인증. 앱 사용자 풀, 소셜 로그인",
      compare: "IAM",
      description: "Amazon Cognito는 웹/모바일 앱의 최종 사용자 인증과 권한 부여를 제공하는 관리형 서비스입니다. User Pools로 사용자 디렉터리와 로그인 UI를 제공하고, Identity Pools(Federated Identities)로 인증된 사용자에게 임시 AWS 자격 증명을 부여합니다.",
      keyFeatures: [
        "User Pools — 회원가입/로그인/MFA/비밀번호 재설정 관리, JWT 발급",
        "Identity Pools — 인증된(또는 게스트) 사용자에게 임시 IAM 자격 증명 발급",
        "소셜 로그인(Google/Facebook/Apple) 및 SAML/OIDC 연동",
        "적응형 인증(Adaptive Authentication) — 위험 점수 기반 MFA 요구",
        "Hosted UI — 코드 없이 로그인 페이지 제공",
      ],
      examTips: [
        "'모바일/웹 앱의 최종 사용자 로그인' = Cognito, 'AWS 리소스 접근 권한 관리' = IAM",
        "User Pool(인증, 누구인가) vs Identity Pool(인가, 어떤 AWS 자격 증명을 줄까) 구분",
        "S3/DynamoDB 등 AWS 리소스에 사용자별 권한으로 직접 접근 = Identity Pool",
        "API Gateway 인증 = Cognito Authorizer + User Pool (JWT 검증)",
        "Cognito vs IAM Identity Center: 앱 최종 사용자 vs 내부 직원의 AWS 계정 SSO",
      ],
    },
    {
      name: "WAF",
      summary: "웹 방화벽. SQL 인젝션, XSS 방어",
      compare: "Shield",
      description: "AWS WAF(Web Application Firewall)는 웹 애플리케이션을 대상으로 한 L7(HTTP/HTTPS) 공격을 차단하는 방화벽입니다. CloudFront, ALB, API Gateway, AppSync, App Runner에 연결하여 SQL 인젝션·XSS·Bot·악성 IP 등을 규칙 기반으로 차단합니다.",
      keyFeatures: [
        "Web ACL + Rules — IP/Geo/SQLi/XSS/Rate-based 룰 조합",
        "관리형 룰 그룹 — AWS/Marketplace 제공 (OWASP Top 10 등)",
        "Rate-based Rule — IP당 요청 비율 제한(DDoS-like 완화)",
        "Bot Control — 크롤러/스크레이퍼 분류·차단",
        "연결 대상: CloudFront(글로벌), ALB/API Gateway/AppSync/App Runner(리전)",
        "로그를 S3/Kinesis Firehose/CloudWatch Logs로 전송",
      ],
      examTips: [
        "'SQL 인젝션/XSS 방어' / 'L7 HTTP 필터' = WAF",
        "WAF vs Shield: L7 애플리케이션 공격(WAF) vs L3/L4 DDoS(Shield)",
        "글로벌 엣지 차단 = CloudFront + WAF, 리전 ALB 차단 = ALB + WAF",
        "IP당 요청 폭주 차단 = Rate-based Rule",
        "지역 기반 차단(특정 국가만 허용) = Geo Match Rule",
      ],
    },
    {
      name: "Shield",
      summary: "DDoS 보호. Standard(무료), Advanced(유료)",
      compare: "WAF",
      description: "AWS Shield는 DDoS(분산 서비스 거부) 공격으로부터 AWS 리소스를 보호하는 서비스입니다. Standard는 모든 AWS 고객에게 무료로 L3/L4 일반 DDoS를 완화하고, Advanced는 유료로 고도화된 탐지·24시간 SRT(Shield Response Team) 지원·청구 보호(Cost Protection)를 제공합니다.",
      keyFeatures: [
        "Shield Standard — 모든 계정 기본 제공(무료), L3/L4 자동 완화",
        "Shield Advanced — CloudFront/ALB/NLB/Route 53/Global Accelerator 보호",
        "SRT(Shield Response Team) — 공격 시 24/7 전문가 대응",
        "Cost Protection — DDoS 트래픽으로 인한 확장 비용 환급",
        "WAF 유료 요금 면제 포함(Advanced 가입자)",
        "Protected Resources에 대한 실시간 DDoS 지표·알림",
      ],
      examTips: [
        "'DDoS 보호' / 'L3/L4 대규모 트래픽 공격 대응' = Shield",
        "Shield Standard는 무료·자동 적용 — 별도 설정 불필요",
        "Shield Advanced = 유료, SRT·Cost Protection이 필요한 대규모 서비스용",
        "Shield + WAF 조합: L3/L4(Shield) + L7(WAF)로 계층 방어",
        "Advanced 보호 대상: CloudFront/Route 53/Global Accelerator/ALB/NLB/EIP",
      ],
    },
    {
      name: "GuardDuty",
      summary: "위협 탐지. ML 기반 이상 행동 감지",
      compare: "Inspector, Detective",
      description: "Amazon GuardDuty는 VPC Flow Logs, DNS Logs, CloudTrail, EKS 감사 로그 등을 ML·위협 인텔리전스로 분석해 악성 활동과 이상 행동을 탐지하는 관리형 위협 탐지 서비스입니다. 별도 에이전트 설치가 필요 없고, 활성화만으로 계정 전체를 모니터링합니다.",
      keyFeatures: [
        "분석 소스: VPC Flow Logs, Route 53 DNS Logs, CloudTrail Management/Data Events, EKS Audit, S3, RDS, Lambda",
        "ML + 위협 인텔리전스 기반 Finding(심각도 Low/Medium/High)",
        "EventBridge 연동으로 자동 대응(Lambda, SSM Automation 등)",
        "Organizations와 연동해 멀티 계정 중앙 관리 가능",
        "암호 화폐 채굴, 비정상 API 호출, 손상된 자격 증명 사용 등 탐지",
      ],
      examTips: [
        "'계정/네트워크 이상 행동 탐지' / 'ML 위협 탐지' = GuardDuty",
        "GuardDuty vs Inspector: 런타임 위협 탐지 vs 취약점(패치/CVE) 스캔",
        "GuardDuty vs Macie: 위협(행동) vs S3 민감 데이터 식별",
        "Detective와 조합: GuardDuty Finding을 Detective로 드릴다운 조사",
        "에이전트 설치 불필요 — 로그 기반이라 즉시 활성화",
      ],
    },
    {
      name: "Secrets Manager",
      summary: "비밀 관리. DB 자격 증명 자동 로테이션",
      compare: "Parameter Store",
      description: "AWS Secrets Manager는 DB 자격 증명, API 키, OAuth 토큰 등 비밀(Secret)을 안전하게 저장하고 Lambda 기반으로 자동 로테이션하는 서비스입니다. KMS로 암호화되며, IAM 정책으로 접근을 세밀하게 제어합니다.",
      keyFeatures: [
        "자동 로테이션 — RDS/Aurora/Redshift/DocumentDB는 관리형 로테이션 제공",
        "사용자 정의 로테이션 — Lambda로 임의의 비밀 순환",
        "KMS 암호화 저장 + IAM/리소스 기반 정책으로 접근 제어",
        "버전 관리(AWSCURRENT/AWSPENDING/AWSPREVIOUS)로 안전한 전환",
        "크로스 계정·리전 복제 지원",
      ],
      examTips: [
        "'DB 비밀번호 자동 로테이션' = Secrets Manager (Parameter Store로는 자동 로테이션 불가)",
        "Secrets Manager vs Parameter Store(SecureString): 자동 로테이션·관리형 기능(유료) vs 단순 저장(저렴)",
        "RDS와 결합 시 '관리형 로테이션' 옵션 체크 — Lambda 코드 작성 불필요",
        "애플리케이션은 IAM 역할로 Secrets Manager 호출 — 하드코딩 금지",
        "크로스 리전 DR = Secrets Manager 복제(Replica Secret)",
      ],
    },
    {
      name: "ACM",
      summary: "인증서 관리. SSL/TLS 인증서 무료 발급",
      compare: "",
      description: "AWS Certificate Manager(ACM)는 SSL/TLS 인증서를 무료로 발급·갱신하고 AWS 리소스(ELB/CloudFront/API Gateway 등)에 바인딩할 수 있게 해주는 관리형 서비스입니다. 공용 인증서는 자동 갱신되며, 프라이빗 CA(PCA)로 내부용 인증서도 발급할 수 있습니다.",
      keyFeatures: [
        "퍼블릭 인증서 무료 + 자동 갱신(DNS 또는 이메일 검증)",
        "지원 대상: ALB/NLB/CloudFront/API Gateway/App Runner 등 AWS 통합 서비스",
        "프라이빗 CA(ACM PCA) — 내부 PKI, 사용자 지정 루트/중간 CA 구성(유료)",
        "CloudFront용 인증서는 반드시 us-east-1 리전에서 발급",
        "EC2에 직접 설치 불가 — 통합 서비스에만 바인딩 가능",
      ],
      examTips: [
        "'HTTPS 인증서 자동 갱신' / 'ELB/CloudFront에 SSL 적용' = ACM",
        "ACM 공용 인증서는 무료 — 외부 CA 구매 불필요",
        "CloudFront용 인증서는 반드시 **us-east-1** (Virginia) — 단골 함정",
        "EC2에 직접 설치는 불가 → EC2 앞에 ALB/NLB를 두고 ACM 바인딩",
        "내부 PKI/자체 CA = ACM Private CA (유료)",
      ],
    },
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
    {
      name: "Athena",
      summary: "서버리스 쿼리. S3 데이터를 SQL로 직접 분석",
      compare: "Redshift",
      description: "Amazon Athena는 S3에 저장된 데이터를 Presto 기반 SQL로 직접 질의하는 서버리스 분석 서비스입니다. 인프라를 프로비저닝하지 않고 사용량(스캔한 데이터량)만큼 과금되며, Glue Data Catalog를 스키마 저장소로 사용합니다.",
      keyFeatures: [
        "서버리스 — 클러스터 관리 없이 S3에 바로 SQL 질의",
        "Glue Data Catalog를 스키마 저장소로 사용",
        "지원 포맷: CSV/JSON/Parquet/ORC/Avro — 열 기반(Parquet/ORC)이 스캔량·속도에서 유리",
        "파티셔닝으로 스캔 대상 축소 → 비용·성능 최적화",
        "Athena Federated Query — RDS/DynamoDB 등 이기종 소스 연합 질의",
      ],
      examTips: [
        "'S3 데이터를 바로 SQL로 분석' / '서버리스 쿼리' = Athena",
        "Athena vs Redshift: 임시·Ad-hoc 쿼리(Athena) vs 정기적 대규모 분석(Redshift)",
        "비용·성능 최적화: Parquet/ORC + 파티셔닝 + 필요한 컬럼만 SELECT",
        "스캔한 데이터량 기준 과금 — SELECT * 남발 금지",
        "VPC Flow Logs, ALB/CloudFront 액세스 로그 분석에 자주 등장",
      ],
    },
    {
      name: "Kinesis",
      summary: "실시간 스트리밍. 데이터 수집/처리/분석",
      compare: "SQS, MSK",
      description: "Amazon Kinesis는 실시간 데이터 스트리밍을 위한 플랫폼으로, 네 가지 하위 서비스(Data Streams, Data Firehose, Data Analytics, Video Streams)로 구성됩니다. 로그/클릭스트림/IoT 센서 같은 대용량 스트림을 수집·변환·분석하는 파이프라인을 구성합니다.",
      keyFeatures: [
        "Data Streams — 샤드 기반 실시간 스트림, 소비자는 KCL로 순서 보장 처리",
        "Data Firehose — 서버리스 적재 파이프라인, S3/Redshift/OpenSearch로 자동 전송",
        "Data Analytics (Managed Service for Apache Flink) — 스트림 SQL/Flink 분석",
        "순서 보장 — Partition Key 해시 기반으로 동일 키는 동일 샤드",
        "보존 기간 — 기본 24시간, 최대 365일 (재처리 가능)",
      ],
      examTips: [
        "'실시간 스트리밍' / '클릭스트림/IoT 데이터 수집' = Kinesis",
        "Kinesis vs SQS: 실시간 순서 보장·다중 소비자·재처리(Kinesis) vs 작업 큐·1회 소비(SQS)",
        "S3/Redshift로 자동 적재만 필요 = Firehose (서버리스)",
        "커스텀 실시간 처리 = Data Streams + Lambda/KCL",
        "Kinesis Data Streams는 샤드 수 = 처리량 단위 (1MB/s write, 2MB/s read per shard)",
      ],
    },
    {
      name: "Glue",
      summary: "서버리스 ETL. 데이터 카탈로그, 크롤러",
      compare: "EMR",
      description: "AWS Glue는 서버리스 ETL(Extract-Transform-Load) 서비스로, Apache Spark 기반의 작업(Job)으로 데이터를 변환하고 Glue Data Catalog에 스키마를 중앙 저장합니다. 크롤러(Crawler)가 S3/DB 소스의 스키마를 자동 추론해 카탈로그에 등록하므로, Athena·Redshift Spectrum·EMR이 공용 메타데이터로 활용할 수 있습니다.",
      keyFeatures: [
        "서버리스 Spark 실행 — DPU(Data Processing Unit) 단위로 과금",
        "Data Catalog — Hive 호환 메타데이터 저장소, Athena/Redshift Spectrum/EMR 공통 사용",
        "Crawler — S3·JDBC 소스 스캔으로 스키마·파티션 자동 추론",
        "Glue Studio — GUI 기반 ETL 파이프라인 작성",
        "Glue DataBrew — 코드 없이 시각적 데이터 정제",
        "Job Bookmarks로 증분 처리, Triggers/Workflows로 오케스트레이션",
      ],
      examTips: [
        "'서버리스 ETL' / '스키마 자동 탐지' / 'Data Catalog' = Glue",
        "Glue vs EMR: 서버리스·관리형(Glue) vs 클러스터 직접 관리·고성능 튜닝(EMR)",
        "Athena의 스키마 저장소 = Glue Data Catalog",
        "S3의 파일 구조 변경 자동 반영 = Glue Crawler 주기 실행",
        "코드 없는 데이터 정제 = Glue DataBrew (분석가용)",
      ],
    },
    {
      name: "Step Functions",
      summary: "워크플로 오케스트레이션. 상태 머신 기반",
      compare: "SWF",
      description: "AWS Step Functions는 여러 서비스(Lambda/ECS/SNS/SQS/DynamoDB 등)를 상태 머신(State Machine)으로 엮어 워크플로를 오케스트레이션하는 서비스입니다. 재시도·오류 처리·병렬 실행·조건 분기를 시각적 그래프로 정의하며, Amazon States Language(JSON)로 작성됩니다.",
      keyFeatures: [
        "상태 타입: Task/Choice/Parallel/Map/Wait/Pass/Succeed/Fail",
        "Standard Workflow — 최대 1년 실행, 정확히 1회 실행 보장, 감사 로그 완비",
        "Express Workflow — 최대 5분, 고빈도·저비용, At-least-once",
        "내장 재시도·Catch·Exponential Backoff로 내결함성",
        "직접 서비스 통합(Optimized/AWS SDK) — Lambda 없이 DynamoDB/SQS/ECS 호출",
        "시각적 워크플로 편집기(Workflow Studio)",
      ],
      examTips: [
        "'복잡한 서비스 간 워크플로 조율' / '재시도·분기 관리' = Step Functions",
        "Standard vs Express: 장기·감사 vs 초당 수천 건 고빈도 처리",
        "Lambda만 연속 호출하기보단 → 재시도·에러 핸들링 중앙화로 Step Functions",
        "Map 상태 = 배열 요소에 대한 병렬 처리 (대량 파일 처리 등)",
        "Step Functions vs SWF: 최신·관리 간편(Step Functions) vs 레거시(SWF)",
      ],
    },
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
    {
      name: "CloudTrail",
      summary: "API 감사 로그. 누가 무엇을 했는지 기록",
      compare: "Config",
      description: "AWS CloudTrail은 AWS 계정에서 발생한 모든 API 호출을 이벤트로 기록하는 거버넌스·컴플라이언스·감사 서비스입니다. 콘솔/CLI/SDK 호출 주체, 시간, 소스 IP, 요청·응답 파라미터를 저장하여 보안 조사와 규정 준수 감사에 활용됩니다.",
      keyFeatures: [
        "관리 이벤트(계정·리소스 관리 API) vs 데이터 이벤트(S3 객체, Lambda 호출 등)",
        "조직 전체 추적(Organization Trail)으로 멀티 계정 통합 감사",
        "CloudTrail Lake — SQL로 이벤트 질의, 최대 7년 보관",
        "S3 + (옵션) KMS 암호화로 로그 저장, CloudWatch Logs로 실시간 분석",
        "로그 파일 무결성 검증(SHA-256 서명)으로 변조 탐지",
      ],
      examTips: [
        "'누가 무엇을 했는지' / 'API 호출 기록' / '감사 로그' 키워드 = CloudTrail",
        "CloudTrail vs CloudWatch: API 감사 vs 성능/지표 모니터링",
        "CloudTrail vs Config: 누가 호출했나(CloudTrail) vs 리소스가 어떤 상태인가(Config)",
        "S3 객체 수준 접근 추적은 '데이터 이벤트'를 명시적으로 활성화해야 함(기본 OFF)",
        "멀티 계정 컴플라이언스 = Organizations + CloudTrail Organization Trail",
      ],
    },
    {
      name: "Config",
      summary: "리소스 구성 추적. 규정 준수 평가",
      compare: "CloudTrail",
      description: "AWS Config는 AWS 리소스의 구성(configuration) 변화를 지속적으로 추적·기록하고 규정 준수 상태를 평가하는 서비스입니다. 리소스의 시점별 스냅샷과 변경 이력을 보관하며, Config Rules로 '보안 그룹이 0.0.0.0/0에 22번 포트를 열었는가' 같은 규칙을 자동 평가합니다.",
      keyFeatures: [
        "구성 항목(Configuration Item) — 리소스의 시점별 상태 스냅샷",
        "Config Rules — 관리형 규칙 + 사용자 정의(Lambda) 규칙으로 컴플라이언스 평가",
        "Conformance Pack — 규정 준수 규칙 번들을 한 번에 배포",
        "Remediation Actions — SSM Automation으로 비준수 리소스 자동 교정",
        "멀티 계정/리전 데이터를 Aggregator로 집중 조회",
      ],
      examTips: [
        "'리소스 구성 변경 이력' / '규정 준수 평가' = Config",
        "Config vs CloudTrail: 리소스 상태 스냅샷(Config) vs API 호출 로그(CloudTrail)",
        "비준수 리소스 자동 교정 = Config + SSM Automation Remediation",
        "PCI/HIPAA 등 공통 규정 묶음 배포 = Conformance Pack",
        "멀티 계정 컴플라이언스 대시보드 = Config Aggregator",
      ],
    },
    {
      name: "Systems Manager",
      summary: "운영 관리. 패치, 파라미터 스토어, 세션 매니저",
      compare: "",
      description: "AWS Systems Manager(SSM)는 EC2 및 하이브리드 인프라 운영을 중앙에서 관리하는 통합 서비스입니다. SSH 키/베스천 호스트 없이 인스턴스에 접속하는 Session Manager, 패치 자동화를 위한 Patch Manager, 설정값 보관을 위한 Parameter Store 등 다수의 하위 도구를 제공합니다.",
      keyFeatures: [
        "Session Manager — IAM 기반 SSH/RDP 없는 쉘 접속, CloudTrail에 기록",
        "Parameter Store — 설정값·비밀번호 저장 (SecureString은 KMS 암호화)",
        "Patch Manager — OS 패치 일정화 및 컴플라이언스 리포트",
        "Run Command — 다수 인스턴스에 원격 명령 일괄 실행",
        "Automation — 운영 작업을 실행 가능한 런북(Runbook)으로 정의",
        "State Manager — 원하는 구성 상태를 지속 유지",
      ],
      examTips: [
        "'베스천 호스트 없이 접속' / '22번 포트 안 열고 EC2 접속' = SSM Session Manager",
        "Parameter Store vs Secrets Manager: 일반 설정/간단 비밀(저렴) vs 자동 로테이션/DB 자격 증명",
        "OS 패치 자동화 = SSM Patch Manager + Maintenance Window",
        "EC2에 SSM Agent + SSM용 IAM 인스턴스 프로파일 필요",
        "하이브리드(온프레미스) 서버도 관리 가능 — Advanced Tier",
      ],
    },
    {
      name: "CloudFormation",
      summary: "IaC. JSON/YAML 템플릿으로 인프라 프로비저닝",
      compare: "Terraform",
      description: "AWS CloudFormation은 JSON/YAML 템플릿으로 AWS 인프라를 코드(IaC)로 정의·배포·관리하는 서비스입니다. 스택(Stack) 단위로 리소스를 묶어 생성/업데이트/삭제하며, 변경 세트(Change Set)로 실제 적용 전 영향 범위를 미리 확인할 수 있습니다.",
      keyFeatures: [
        "템플릿 — Resources/Parameters/Outputs/Mappings/Conditions 섹션",
        "Change Sets — 적용 전 변경 사항 미리보기로 위험 감소",
        "Drift Detection — 템플릿 상태와 실제 리소스 차이 탐지",
        "StackSets — 여러 계정/리전에 동일 스택 일괄 배포",
        "Nested Stacks + Cross-Stack References로 모듈화",
        "Rollback — 실패 시 자동 이전 상태 복구",
      ],
      examTips: [
        "'JSON/YAML로 인프라 정의' / 'IaC' / '스택' = CloudFormation",
        "멀티 계정·멀티 리전 표준 인프라 배포 = StackSets",
        "적용 전 변경 영향 확인 = Change Set (반드시 Execute 해야 실제 적용)",
        "수동으로 변경된 리소스 탐지 = Drift Detection",
        "CloudFormation vs Elastic Beanstalk: 모든 AWS 리소스 IaC vs 웹앱 전용 PaaS",
      ],
    },
    {
      name: "Organizations",
      summary: "멀티 계정 관리. SCP, 통합 결제",
      compare: "",
      description: "AWS Organizations는 다수의 AWS 계정을 하나의 조직으로 묶어 중앙에서 관리하는 서비스입니다. 조직 단위(OU) 계층으로 계정을 구성하고, 서비스 제어 정책(SCP)으로 계정별 최대 권한 경계를 강제하며, 통합 결제(Consolidated Billing)로 모든 계정의 청구를 한데 모읍니다.",
      keyFeatures: [
        "조직 단위(OU)로 계정 계층 구성, SCP를 OU·계정 단위로 부착",
        "SCP — 계정의 '최대 허용 권한' 정의 (IAM 권한을 초과해 허용할 수는 없음)",
        "통합 결제 — 볼륨 할인·예약 공유로 비용 절감",
        "계정 자동 생성 및 관리 계정(Management Account) ↔ 멤버 계정 구조",
        "Service-Linked Roles + Delegated Administrator로 보안·감사 서비스 위임",
      ],
      examTips: [
        "'멀티 계정 중앙 관리' / '모든 계정에 금지 정책 강제' = Organizations + SCP",
        "SCP는 '허용'이 아니라 '최대 경계'를 정의 — IAM 정책과 교집합으로 동작",
        "예약 인스턴스/Savings Plans 공유·볼륨 할인 = 통합 결제",
        "Organizations + Config/CloudTrail = 조직 전체 컴플라이언스·감사",
        "신규 계정 자동 생성·표준 기준 적용 = AWS Control Tower(Organizations 기반)",
      ],
    },
    {
      name: "Trusted Advisor",
      summary: "모범 사례 추천. 비용, 성능, 보안 최적화",
      compare: "",
      description: "AWS Trusted Advisor는 AWS 환경을 5개 축(비용 최적화, 성능, 보안, 내결함성, 서비스 한도)으로 자동 점검하고 모범 사례 기반 개선 권고를 제공하는 서비스입니다. Business/Enterprise Support 플랜에서 전체 체크를 사용할 수 있고, 기본 플랜에서는 핵심 보안·서비스 한도 체크만 제공됩니다.",
      keyFeatures: [
        "5개 카테고리: 비용/성능/보안/내결함성/서비스 한도",
        "기본 플랜 — 핵심 보안 체크 + 서비스 한도 체크만",
        "Business/Enterprise 플랜 — 전체 체크 활성화",
        "사용되지 않는 리소스, 과다 프로비저닝, 공개 S3 버킷 등 탐지",
        "EventBridge 연동으로 경고 자동화 가능",
      ],
      examTips: [
        "'비용 절감·보안·모범 사례 추천' 키워드 = Trusted Advisor",
        "전체 체크는 Business 이상 지원 플랜 필요 — 기본 플랜은 제한적",
        "서비스 한도(Service Quotas) 근접 경고 = Trusted Advisor의 기본 체크",
        "Trusted Advisor vs Cost Explorer: 모범 사례 권고 vs 비용 데이터 분석·예측",
        "Security Hub, Config, GuardDuty와 역할 구분: 취약점·위협 vs 리소스 구성 vs 베스트프랙티스",
      ],
    },
    {
      name: "Cost Explorer",
      summary: "비용 분석. 사용량 시각화, 예측",
      compare: "Budgets",
      description: "AWS Cost Explorer는 AWS 사용량과 비용을 시각화·분석·예측하는 도구입니다. 서비스·태그·계정·리전별로 비용을 분해해 볼 수 있고, 최대 12개월까지의 사용량 기반 비용 예측과 예약 인스턴스/Savings Plans 구매 권장도 제공합니다.",
      keyFeatures: [
        "서비스·태그·계정·리전·사용 유형별 비용 분해 시각화",
        "사용량 기반 미래 비용 예측(최대 12개월)",
        "예약 인스턴스/Savings Plans 적용률·커버리지·권장 구매안 리포트",
        "비정상 비용 탐지(Cost Anomaly Detection) — ML 기반 이상 지출 알림",
        "월별/일별 Granularity 및 Resource-level(EC2) 상세 보기",
      ],
      examTips: [
        "'비용 분석' / '과거 사용량 기반 예측' / '어느 서비스에 얼마 썼나' = Cost Explorer",
        "Cost Explorer vs Budgets: 비용 분석·예측(시각화) vs 임계값 초과 시 알림",
        "RI/Savings Plans 최적 구매안 = Cost Explorer 권장 리포트",
        "비정상적 비용 급증 자동 감지 = Cost Anomaly Detection",
        "조직 전체 비용 집중 조회 = Organizations(통합 결제) + Cost Explorer",
      ],
    },
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
      <div className="mb-5">
        <p className="text-xs text-muted font-semibold tracking-wider">BESTIARY</p>
        <h1 className="text-2xl font-display font-black text-rose">서비스 도감 📖</h1>
        <p className="text-xs text-muted mt-1">AWS 서비스들을 수집해봐!</p>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 서비스명 또는 키워드 검색..."
        className="w-full rounded-3xl px-4 py-3 text-sm mb-4 focus:outline-none transition-colors"
        style={{
          background: "rgba(37,32,58,0.7)",
          border: "1.5px solid var(--border)",
          color: "var(--foreground)",
        }}
      />

      <div className="space-y-3">
        {filteredCategories.map((cat) => (
          <div
            key={cat.category}
            className="rounded-3xl overflow-hidden"
            style={{
              background: "rgba(37,32,58,0.6)",
              border: "1px solid rgba(200,180,255,0.22)",
            }}
          >
            <button
              onClick={() =>
                setExpandedCategory(expandedCategory === cat.category ? null : cat.category)
              }
              className="w-full flex justify-between items-center p-4 text-left"
            >
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-lavender">{cat.category}</span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-display font-bold"
                  style={{
                    background: "rgba(200,180,255,0.15)",
                    color: "var(--pastel-lavender)",
                  }}
                >
                  {cat.services.length}
                </span>
              </div>
              <span className="text-muted text-xs">
                {expandedCategory === cat.category ? "▲" : "▼"}
              </span>
            </button>
            {(expandedCategory === cat.category || search) && (
              <div style={{ borderTop: "1px solid var(--border)" }}>
                {cat.services.map((svc) => {
                  const hasDetail = !!svc.description;
                  const isExpanded = expandedService === svc.name;
                  const stats = statsMap.get(svc.name);
                  const hasQuestions = stats && stats.totalQuestions > 0;
                  const rarity =
                    svc.frequency && svc.frequency >= 100 ? { stars: "★★★", tint: "#ffe27a", label: "LEGEND" }
                    : svc.frequency && svc.frequency >= 30 ? { stars: "★★", tint: "#ffb4c6", label: "RARE" }
                    : svc.frequency ? { stars: "★", tint: "#c8b4ff", label: "COMMON" }
                    : null;

                  return (
                    <div key={svc.name} className="border-b border-border last:border-b-0">
                      <button
                        onClick={() => hasDetail && setExpandedService(isExpanded ? null : svc.name)}
                        className={`w-full px-4 py-3 text-left ${hasDetail ? "cursor-pointer" : "cursor-default"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-display font-black text-sm text-rose">{svc.name}</p>
                            {rarity && (
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-display font-bold"
                                style={{
                                  background: `${rarity.tint}22`,
                                  color: rarity.tint,
                                  border: `1px solid ${rarity.tint}55`,
                                }}
                              >
                                {rarity.stars} {svc.frequency}
                              </span>
                            )}
                            {hasDetail && (
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-display font-bold"
                                style={{
                                  background: "rgba(180,242,225,0.15)",
                                  color: "var(--pastel-mint)",
                                }}
                              >
                                상세
                              </span>
                            )}
                            {hasQuestions && stats.solvedCount > 0 && (
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-display font-bold"
                                style={{
                                  background: "rgba(180,242,225,0.15)",
                                  color: "var(--pastel-mint)",
                                  border: "1px solid rgba(180,242,225,0.3)",
                                }}
                              >
                                {stats.solvedCount}/{stats.totalQuestions} · {stats.accuracy}%
                              </span>
                            )}
                          </div>
                          {svc.compare && (
                            <span className="text-[10px] text-muted flex-shrink-0">vs {svc.compare}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-1 leading-relaxed">{svc.summary}</p>
                      </button>
                      {hasQuestions && (
                        <div className="px-4 pb-3">
                          <Link
                            href={`/questions?service=${encodeURIComponent(svc.name)}`}
                            className="inline-block text-[11px] font-display font-bold px-3 py-1 rounded-full transition-all active:scale-[0.95]"
                            style={{
                              background: "linear-gradient(135deg, rgba(255,180,198,0.15), rgba(200,180,255,0.15))",
                              color: "var(--pastel-rose)",
                              border: "1px solid rgba(255,180,198,0.35)",
                            }}
                          >
                            ⚔️ 퀘스트 도전 ({stats.totalQuestions}문제)
                          </Link>
                        </div>
                      )}

                      {isExpanded && hasDetail && (
                        <div className="px-4 pb-4 space-y-3 animate-fade-in">
                          <div
                            className="rounded-2xl p-3"
                            style={{
                              background: "rgba(46,40,73,0.7)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            <p className="text-xs leading-relaxed">{svc.description}</p>
                          </div>

                          {svc.keyFeatures && (
                            <div>
                              <p className="text-xs font-display font-bold text-lavender mb-1.5">✨ 핵심 특징</p>
                              <ul className="space-y-1">
                                {svc.keyFeatures.map((f, i) => (
                                  <li key={i} className="text-xs text-muted leading-relaxed flex gap-1.5">
                                    <span className="text-rose mt-0.5 flex-shrink-0">🌸</span>
                                    <span>{f}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {svc.examTips && (
                            <div
                              className="rounded-2xl p-3"
                              style={{
                                background: "linear-gradient(135deg, rgba(255,226,122,0.12), rgba(255,203,168,0.1))",
                                border: "1px solid rgba(255,226,122,0.35)",
                              }}
                            >
                              <p className="text-xs font-display font-bold text-warning-fg mb-1.5">💡 SAA 공략 팁</p>
                              <ul className="space-y-1">
                                {svc.examTips.map((tip, i) => (
                                  <li key={i} className="text-xs leading-relaxed flex gap-1.5" style={{ color: "var(--warning-fg)" }}>
                                    <span className="flex-shrink-0">▸</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {svc.useCases && (
                            <div>
                              <p className="text-xs font-display font-bold text-mint mb-1.5">🎯 주요 사용 사례</p>
                              <ul className="space-y-1">
                                {svc.useCases.map((uc, i) => (
                                  <li key={i} className="text-xs text-muted leading-relaxed flex gap-1.5">
                                    <span className="text-mint flex-shrink-0">▸</span>
                                    <span>{uc}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {svc.pricing && (
                            <div
                              className="text-xs rounded-2xl p-3"
                              style={{
                                background: "rgba(168,220,255,0.08)",
                                border: "1px solid rgba(168,220,255,0.25)",
                                color: "var(--info-fg)",
                              }}
                            >
                              <span className="font-display font-bold">💰 비용: </span>
                              {svc.pricing}
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
