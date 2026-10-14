import { z } from "zod";
import { reportSchema, sectionSchema } from "./reading-schema";

// Keep draft ingestion permissive for repair, but constrain new generation at the API boundary.
// The API bounds size; natural phrasing and the 35–45 character target are instructions.
// Content and style still need code checks because schema adherence cannot guarantee them.
export const generatedTitleSchema = z.string().min(1).max(100)
  .describe("각 장의 결론과 대표 장면을 담은 제목. 공백 포함 35~45자를 목표로 하되, 목표 길이에 못 미치더라도 짧고 완성된 제목을 우선한다. 쉼표는 정확히 하나이며 'A, B기니' 구조로 쓴다. 마지막 절은 의미와 문법이 완성된 자연스러운 표현에 기니를 붙인다. 과거형이나 특정 동사를 강제하지 않는다. 현재형·명사형도 문법과 의미가 자연스러우면 허용한다. 길이를 맞추려고 불필요한 말이나 본문에 없는 내용을 덧붙이지 않는다. API·스키마·요청 형식·생성 실패 등 기술적 오류나 작업 상태를 제목에 쓰지 않는다. 멈췄 다른·곱씹었 조금씩·조화시켰 서로처럼 중간 동사 활용을 자르지 말고 멈춘 장면에서·곱씹으며·조화시키고 같은 연결형으로 쓴다. 2번과 5번 장만 기니!로 끝내고 나머지는 기니로 끝낸다. 호칭·중괄호·줄바꿈은 쓰지 않는다.");
export const generatedSectionSchema = sectionSchema.extend({ title: generatedTitleSchema });
export const generatedReportSchema = reportSchema.extend({ sections: z.array(generatedSectionSchema).length(8) });
