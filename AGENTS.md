<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## 수정 요청 처리 (correction requests)

모바일에서 사용자가 신고한 문제 오류는 Supabase `saa_correction_requests` 테이블에 쌓인다. 사용자가 터미널에서 "수정 요청 처리해줘"류의 명령을 내리면 아래 절차를 따른다.

1. `mcp__supabase__execute_sql`로 미처리 목록 조회:
   ```sql
   select * from saa_correction_requests order by created_at asc;
   ```
2. 각 행에 대해 `question_source`에 맞는 크롤러 JSON을 연다:
   - `nxtcloud` → `C:\Projects\sandbox\aws-saa-study\crawler\nxtcloud_questions.json`
   - `examtopics` → `C:\Projects\sandbox\aws-saa-study\crawler\examtopics_questions.json`
3. `question_id`로 항목을 찾는다. ID 포맷:
   - `nxt-<global_number>` → 해당 파일에서 `global_number` 매칭
   - `et-<examtopics_number>` → 해당 파일에서 `examtopics_number` 매칭
   - 찾지 못하면 로그만 남기고 **삭제하지 말 것**.
4. `report_type`별로 수정 지침:
   - **translation_needed**: 한국어 번역을 추가/보강한다. 원문은 보존. `scope`가 `question`이면 `question_text`, `option`이면 `options[*].text`(단 `option_label`에 해당하는 옵션만), `explanation`이면 `explanation`, `detail`이면 `detailed_explanation`을 대상으로 한다.
   - **wrong_explanation**: `correct_answers`를 기준으로 해설을 재작성한다. `scope`에 맞춰 `explanation` 또는 `detailed_explanation` 편집. AWS 공식 문서 근거를 인용한다.
   - **invalid_choice**: `option_label`에 해당하는 선지 텍스트를 수정한다. 선지 블록에 섞여 있던 비(非)선지 콘텐츠는 해설 쪽으로 옮기거나 제거. 정답 변경이 필요한지 재검증.
   - **wrong_answer**: `source_url`과 문제 본문을 대조해 `correct_answers`를 업데이트. 판단이 불확실하면 중단하고 사용자에게 확인.
5. 수정이 반영되면 해당 레코드를 삭제한다:
   ```sql
   delete from saa_correction_requests where id = <id>;
   ```
6. 모든 행 처리 후 요약: `N건 처리 / M건 스킵 / 이유별 내역`.

**중요**: `app/`은 별도 git 저장소(서브모듈)이지만 크롤러 JSON은 외부 루트 저장소(`C:\Projects\sandbox\aws-saa-study`)에 있다. JSON 수정 커밋은 외부 루트에서 하고, `app/`에는 아무것도 스테이징하지 말 것.

신고 기능 관련 코드:
- `src/lib/corrections.ts` — Supabase CRUD + 타입
- `src/components/CorrectionReportSheet.tsx` — 모바일 신고 바텀시트
- `src/components/QuestionCard.tsx` — ⚠ 버튼 진입점 (문제/선지/해설)
- `src/app/review/page.tsx` — 데스크탑 "수정 요청" 탭
