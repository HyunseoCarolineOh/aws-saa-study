import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

const VALID_EXAMS = ["SAA-C03", "CLF-C02"] as const;
type ExamType = (typeof VALID_EXAMS)[number];

function loadSAAQuestions() {
  const questions: Record<string, unknown>[] = [];

  const nxtPaths = [
    path.join(process.cwd(), "public", "data", "nxtcloud_questions.json"),
    path.join(process.cwd(), "..", "crawler", "nxtcloud_questions.json"),
  ];
  for (const filePath of nxtPaths) {
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
            domain: q.domain,
          });
        }
        break;
      } catch (e) {
        console.error("Failed to load nxtcloud data:", e);
      }
    }
  }

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
            domain: q.domain,
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

function loadCLFQuestions() {
  const filePath = path.join(process.cwd(), "public", "data", "clf_questions.json");
  if (!fs.existsSync(filePath)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return data.questions || [];
  } catch (e) {
    console.error("Failed to load CLF data:", e);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const exam = (searchParams.get("exam") ?? "SAA-C03") as ExamType;

  if (!VALID_EXAMS.includes(exam)) {
    return NextResponse.json({ error: "Invalid exam type" }, { status: 400 });
  }

  const questions = exam === "CLF-C02" ? loadCLFQuestions() : loadSAAQuestions();
  return NextResponse.json({ total: questions.length, questions });
}
