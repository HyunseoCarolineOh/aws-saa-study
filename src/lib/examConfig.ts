import type { ExamType, ExamConfig } from "./types";

export const EXAM_CONFIGS: Record<ExamType, ExamConfig> = {
  "SAA-C03": {
    type: "SAA-C03",
    label: "AWS Solutions Architect Associate",
    shortLabel: "SAA-C03",
    totalQuestions: 10,
    examTimeMinutes: 15,
    passingScore: 720,
    domainWeights: {
      "보안 아키텍처": 30,
      "복원력 아키텍처": 26,
      "고성능 아키텍처": 24,
      "비용 최적화": 20,
    },
  },
  "CLF-C02": {
    type: "CLF-C02",
    label: "AWS Cloud Practitioner",
    shortLabel: "CLF-C02",
    totalQuestions: 65,
    examTimeMinutes: 90,
    passingScore: 700,
    domainWeights: {
      "Cloud Concepts": 24,
      Security: 30,
      Technology: 34,
      "Billing & Pricing": 12,
    },
  },
};
