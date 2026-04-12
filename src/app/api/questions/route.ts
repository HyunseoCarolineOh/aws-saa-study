import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// 크롤링 데이터를 정적 JSON으로 로드
function loadQuestions() {
  const questions: Record<string, unknown>[] = [];

  // public 디렉토리의 정적 데이터 또는 crawler 디렉토리
  const possiblePaths = [
    path.join(process.cwd(), "public", "data", "nxtcloud_questions.json"),
    path.join(process.cwd(), "..", "crawler", "nxtcloud_questions.json"),
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        for (const q of data.questions) {
          questions.push({
            id: `nxt-${q.global_number}`,
            source: "nxtcloud",
            post_number: q.post_number,
            question_number_in_post: q.question_number_in_post,
            question_text: q.question_text,
            options: q.options,
            correct_answers: q.correct_answers || [],
            explanation: q.explanation || "",
            detailed_explanation: q.detailed_explanation || "",
            related_services: q.related_services || [],
            source_url: q.source_url,
          });
        }
        break; // 첫 번째 발견된 파일 사용
      } catch (e) {
        console.error("Failed to load nxtcloud data:", e);
      }
    }
  }

  // Examtopics 데이터
  const etPaths = [
    path.join(process.cwd(), "public", "data", "examtopics_questions.json"),
    path.join(process.cwd(), "..", "crawler", "examtopics_questions.json"),
  ];

  for (const filePath of etPaths) {
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        for (const q of data.questions) {
          questions.push({
            id: `et-${q.examtopics_number}`,
            source: "examtopics",
            examtopics_number: q.examtopics_number,
            question_text: q.question_text,
            options: q.options,
            correct_answers: q.correct_answers || q.marked_answer || [],
            explanation: "",
            related_services: q.related_services || [],
          });
        }
        break;
      } catch (e) {
        console.error("Failed to load examtopics data:", e);
      }
    }
  }

  return questions;
}

export async function GET() {
  const questions = loadQuestions();
  return NextResponse.json({
    total: questions.length,
    questions,
  });
}
