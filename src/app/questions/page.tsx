"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Question } from "@/lib/types";
import QuestionCard from "@/components/QuestionCard";
import {
  getQuizProgress,
  saveQuizProgress,
  clearQuizProgress,
  getServiceQuizProgress,
  saveServiceQuizProgress,
  clearServiceQuizProgress,
  getTodayReviewQuestionIds,
  getAttemptedQuestionIds,
} from "@/lib/store";
import { getDataServiceNames } from "@/lib/serviceMap";
import CorrectionReportSheet from "@/components/CorrectionReportSheet";
import { isCorrectionsEnabled } from "@/lib/corrections";
import { useExam } from "@/contexts/ExamContext";
import Link from "next/link";

function buildPrioritizedOrder(questions: Question[]): Question[] {
  const attempted = getAttemptedQuestionIds();
  const unsolved: Question[] = [];
  const solved: Question[] = [];
  for (const q of questions) {
    (attempted.has(q.id) ? solved : unsolved).push(q);
  }
  const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);
  return [...shuffle(unsolved), ...shuffle(solved)];
}

function QuestionsContent() {
  const searchParams = useSearchParams();
  const service = searchParams.get("service");
  const singleId = searchParams.get("id");
  const mode = singleId ? "single" : service ? "service" : searchParams.get("mode") === "review" ? "review" : "normal";
  const examContext = useExam();
  const currentExam = examContext?.currentExam ?? "SAA-C03";

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportToast, setReportToast] = useState<string | null>(null);

  function showReportToast(msg: string) {
    setReportToast(msg);
    window.setTimeout(() => setReportToast(null), 2500);
  }

  function handleOpenReport() {
    if (!isCorrectionsEnabled()) {
      showReportToast("Supabase ?ㅼ젙???꾩슂?⑸땲??);
      return;
    }
    setReportOpen(true);
  }

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, service, currentExam]);

  async function loadQuestions() {
    try {
      const res = await fetch(`/api/questions?exam=${currentExam}`);
      const data = await res.json();

      if (mode === "single" && singleId) {
        // ?⑥씪 臾몄젣 紐⑤뱶: ?뱀젙 臾몄젣 ?섎굹留??쒖떆
        const target = (data.questions as Question[]).find((q) => q.id === singleId);
        if (target) {
          setQuestions([target]);
          setCurrentIndex(0);
        } else {
          setQuestions([]);
        }
      } else if (mode === "service" && service) {
        // ?쒕퉬??紐⑤뱶: ?뱀젙 ?쒕퉬??愿??臾몄젣留??꾪꽣留?
        const dataNames = getDataServiceNames(service);
        const serviceQuestions = (data.questions as Question[]).filter((q) =>
          q.related_services.some((s) => dataNames.includes(s))
        );

        // ??λ맂 吏꾪뻾 ?곹깭 蹂듭썝 ?쒕룄
        const saved = getServiceQuizProgress();
        if (saved && saved.mode === "service" && saved.serviceName === service && saved.questionIds.length > 0) {
          const questionMap = new Map(serviceQuestions.map((q) => [q.id, q]));
          const restored = saved.questionIds
            .map((id) => questionMap.get(id))
            .filter((q): q is Question => !!q);

          if (restored.length > 0) {
            setQuestions(restored);
            setCurrentIndex(Math.min(saved.currentIndex, restored.length - 1));
          } else {
            startServiceFresh(serviceQuestions, service);
          }
        } else {
          startServiceFresh(serviceQuestions, service);
        }
      } else if (mode === "review") {
        // 蹂듭뒿 紐⑤뱶: ?ㅻ뒛 蹂듭뒿??臾몄젣留??꾪꽣留?
        const reviewIds = getTodayReviewQuestionIds();
        const reviewQuestions = (data.questions as Question[]).filter((q) =>
          reviewIds.includes(q.id)
        );
        const shuffled = [...reviewQuestions].sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
        setCurrentIndex(0);
      } else {
        // ?쇰컲 紐⑤뱶: ??λ맂 吏꾪뻾 ?곹깭 蹂듭썝 or ?덈줈 ?뷀뵆
        const saved = getQuizProgress();
        const allQuestions = data.questions as Question[];

        if (saved && saved.mode === "normal" && saved.questionIds.length > 0) {
          // ??λ맂 ?쒖꽌濡?臾몄젣 蹂듭썝
          const questionMap = new Map(allQuestions.map((q) => [q.id, q]));
          const restored = saved.questionIds
            .map((id) => questionMap.get(id))
            .filter((q): q is Question => !!q);

          if (restored.length > 0) {
            setQuestions(restored);
            setCurrentIndex(Math.min(saved.currentIndex, restored.length - 1));
          } else {
            // ??λ맂 ID媛 ?꾩옱 ?곗씠?곗? ??留욎쑝硫??덈줈 ?뷀뵆
            startFresh(allQuestions);
          }
        } else {
          startFresh(allQuestions);
        }
      }
    } catch {
      setQuestions(getSampleQuestions());
    }
    setLoading(false);
  }

  function startFresh(allQuestions: Question[]) {
    const ordered = buildPrioritizedOrder(allQuestions);
    setQuestions(ordered);
    setCurrentIndex(0);
    saveQuizProgress({
      questionIds: ordered.map((q) => q.id),
      currentIndex: 0,
      mode: "normal",
    });
  }

  function startServiceFresh(serviceQuestions: Question[], serviceName: string) {
    const ordered = buildPrioritizedOrder(serviceQuestions);
    setQuestions(ordered);
    setCurrentIndex(0);
    saveServiceQuizProgress({
      questionIds: ordered.map((q) => q.id),
      currentIndex: 0,
      mode: "service",
      serviceName,
    });
  }

  function handleRestart() {
    if (mode === "service") {
      clearServiceQuizProgress();
    } else {
      clearQuizProgress();
    }
    loadQuestions();
  }

  const handleNext = useCallback(() => {
    if (mode === "single") return; // ?⑥씪 臾몄젣 紐⑤뱶?먯꽌???ㅼ쓬 臾몄젣 鍮꾪솢?깊솕
    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      if (mode === "normal") {
        saveQuizProgress({
          questionIds: questions.map((q) => q.id),
          currentIndex: nextIndex,
          mode: "normal",
        });
      } else if (mode === "service" && service) {
        saveServiceQuizProgress({
          questionIds: questions.map((q) => q.id),
          currentIndex: nextIndex,
          mode: "service",
          serviceName: service,
        });
      }
    }
  }, [currentIndex, questions, mode, service]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 text-center">
        <p className="text-muted">臾몄젣 濡쒕뵫 以?..</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 text-center">
        {mode === "single" ? (
          <>
            <p className="text-lg mb-2">臾몄젣瑜?李얠쓣 ???놁뒿?덈떎</p>
            <p className="text-sm text-muted mb-4">?대떦 ID??臾몄젣媛 議댁옱?섏? ?딆뒿?덈떎.</p>
            <Link href="/review" className="text-primary font-medium text-sm">
              ?ㅻ떟?명듃濡??뚯븘媛湲?&rarr;
            </Link>
          </>
        ) : mode === "service" && service ? (
          <>
            <p className="text-lg mb-2">{service} 愿??臾몄젣媛 ?놁뒿?덈떎</p>
            <p className="text-sm text-muted mb-4">???쒕퉬?ㅼ? ?곌껐??臾몄젣媛 ?꾩쭅 ?놁뒿?덈떎.</p>
            <Link href="/concepts" className="text-primary font-medium text-sm">
              ?쒕퉬???ъ쟾?쇰줈 ?뚯븘媛湲?&rarr;
            </Link>
          </>
        ) : mode === "review" ? (
          <>
            <p className="text-lg mb-2">蹂듭뒿??臾몄젣媛 ?놁뒿?덈떎</p>
            <p className="text-sm text-muted mb-4">?ㅻ뒛 蹂듭뒿 ?덉젙??臾몄젣媛 ?녾굅?? ?꾩쭅 ?由?臾몄젣媛 ?놁뒿?덈떎.</p>
            <Link href="/review" className="text-primary font-medium text-sm">
              ?ㅻ떟?명듃濡??뚯븘媛湲?&rarr;
            </Link>
          </>
        ) : (
          <p className="text-muted">臾몄젣媛 ?놁뒿?덈떎.</p>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* ?⑥씪 臾몄젣 紐⑤뱶 諛곕꼫 */}
      {mode === "single" && (
        <div className="max-w-lg mx-auto px-4 pt-2">
          <div className="bg-accent-bg border border-accent-border rounded-xl px-4 py-2 text-sm text-accent-fg flex justify-between items-center">
            <Link href="/review" className="hover:underline">&larr; ?ㅻ떟?명듃濡??뚯븘媛湲?/Link>
          </div>
        </div>
      )}

      {/* ?쒕퉬??紐⑤뱶 諛곕꼫 */}
      {mode === "service" && service && (
        <div className="max-w-lg mx-auto px-4 pt-2">
          <div className="bg-info-bg border border-info-border rounded-xl px-4 py-2 text-sm text-info-fg flex justify-between items-center">
            <Link href="/concepts" className="hover:underline">&larr; {service}</Link>
            <span>{currentIndex + 1} / {questions.length}臾몄젣</span>
          </div>
        </div>
      )}

      {/* 蹂듭뒿 紐⑤뱶 諛곕꼫 */}
      {mode === "review" && (
        <div className="max-w-lg mx-auto px-4 pt-2">
          <div className="bg-accent-bg border border-accent-border rounded-xl px-4 py-2 text-sm text-accent-fg flex justify-between items-center">
            <span>蹂듭뒿 紐⑤뱶</span>
            <span>{questions.length}臾몄젣</span>
          </div>
        </div>
      )}

      {/* ?대컮: 泥섏쓬遺???ㅼ떆 ?湲?+ ?섏젙 ?붿껌 */}
      <div className="max-w-lg mx-auto px-4 pt-2 flex justify-end items-center gap-3">
        {(mode === "normal" || mode === "service") && currentIndex > 0 && (
          <button
            onClick={handleRestart}
            className="text-xs text-muted hover:text-primary transition-colors px-2 py-1"
          >
            泥섏쓬遺???ㅼ떆 ?湲?
          </button>
        )}
        <button
          type="button"
          onClick={handleOpenReport}
          className="text-xs text-danger-fg hover:text-danger transition-colors px-2 py-1 flex items-center gap-1"
        >
          <span aria-hidden>??/span>
          <span>?섏젙 ?붿껌</span>
        </button>
      </div>

      <QuestionCard
        question={questions[currentIndex]}
        questionIndex={currentIndex}
        totalQuestions={questions.length}
        onNext={handleNext}
      />

      {reportOpen && questions[currentIndex] && (
        <CorrectionReportSheet
          isOpen
          question={questions[currentIndex]}
          onClose={() => setReportOpen(false)}
          onSubmitted={(msg) => {
            setReportOpen(false);
            showReportToast(msg);
          }}
        />
      )}

      {reportToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-card-elevated border border-border text-foreground text-sm px-4 py-2 rounded-xl shadow-lg z-50 animate-fade-in whitespace-nowrap">
          {reportToast}
        </div>
      )}
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto px-4 pt-20 text-center">
          <p className="text-muted">臾몄젣 濡쒕뵫 以?..</p>
        </div>
      }
    >
      <QuestionsContent />
    </Suspense>
  );
}

function getSampleQuestions(): Question[] {
  return [
    {
      id: "sample-1",
      source: "nxtcloud",
      question_text:
        "???뚯궗媛 AWS?먯꽌 寃곗젣 ?좏뵆由ъ??댁뀡???ㅽ뻾?섎젮怨??⑸땲?? ?좏뵆由ъ??댁뀡? 紐⑤컮???μ튂濡쒕???寃곗젣 ?뚮┝??諛쏆뒿?덈떎. 寃곗젣 ?뚮┝? 異붽? 泥섎━瑜??꾪빐 ?꾩넚?섍린 ?꾩뿉 湲곕낯?곸씤 ?뺤씤???꾩슂?⑸땲?? 諛깆뿏??泥섎━ ?좏뵆由ъ??댁뀡? ?κ린媛??ㅽ뻾?섎ŉ 而댄벂??諛?硫붾え由щ? 議곗젙?댁빞 ?⑸땲?? ?뚯궗???명봽??愿由щ? ?먰븯吏 ?딆뒿?덈떎.\n\n理쒖냼?쒖쓽 ?댁쁺 ?ㅻ쾭?ㅻ뱶濡??대윭???붽뎄 ?ы빆??異⑹”?섎뒗 ?붾（?섏? 臾댁뾿?낅땲源?",
      options: [
        { label: "A", text: "Amazon SQS ?湲곗뿴???앹꽦?⑸땲?? ?湲곗뿴??Amazon EventBridge 洹쒖튃怨??듯빀?섏뿬 紐⑤컮???μ튂?먯꽌 寃곗젣 ?뚮┝??諛쏆뒿?덈떎. Amazon EKS??諛깆뿏???좏뵆由ъ??댁뀡??諛고룷?⑸땲??" },
        { label: "B", text: "Amazon API Gateway API瑜??앹꽦?⑸땲?? API瑜?AWS Step Functions ?곹깭 癒몄떊怨??듯빀?⑸땲?? Amazon EKS???먯껜 愿由ы삎 ?몃뱶濡?諛깆뿏?쒕? 諛고룷?⑸땲??" },
        { label: "C", text: "Amazon SQS ?湲곗뿴???앹꽦?⑸땲?? Amazon EC2 ?ㅽ뙚 ?몄뒪?댁뒪??諛깆뿏???좏뵆由ъ??댁뀡??諛고룷?⑸땲??" },
        { label: "D", text: "Amazon API Gateway API瑜??앹꽦?⑸땲?? API瑜?AWS Lambda? ?듯빀?섏뿬 寃곗젣 ?뚮┝??寃利앺빀?덈떎. Amazon ECS??AWS Fargate濡?諛깆뿏?쒕? 諛고룷?⑸땲??" },
      ],
      correct_answers: ["D"],
      explanation:
        "紐⑤컮???μ튂? 媛숈? ?몃? ?대씪?댁뼵?몃줈遺???곗씠?곕? ?섏떊???뚮뒗 Amazon API Gateway媛 媛???쒖??곸씤 吏꾩엯?먯엯?덈떎. 媛꾨떒???좏슚??寃?щ뒗 AWS Lambda濡?泥섎━?섍퀬, ?명봽??愿由??놁씠 ?μ떆媛??ㅽ뻾?섎뒗 而⑦뀒?대꼫??AWS Fargate(Amazon ECS)瑜??ъ슜?섎뒗 寃껋씠 ?뺣떟?낅땲??",
      related_services: ["API Gateway", "Lambda", "ECS", "Fargate"],
    },
  ];
}
