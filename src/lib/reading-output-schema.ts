import { z } from "zod";
import { reportSchema, sectionSchema } from "./reading-schema";

// Keep draft ingestion permissive for repair, but constrain new generation at the API boundary.
// Exact NFC counts and title style remain code checks; the API enforces title length only.
export const generatedTitleSchema = z.string().min(35).max(45)
  .describe("공백 포함 35~45자 제목. 쉼표는 정확히 하나이며 'A, B기니' 구조로 쓴다. 마지막 절은 마음을 열었기니·온도를 맞췄기니처럼 완료된 행동 동사+기니로 쓰고, 관계이기니·계기니 같은 명사형은 금지한다. 멈췄 다른·곱씹었 조금씩·조화시켰 서로처럼 중간 동사 활용을 자르지 말고 멈춘 장면에서·곱씹으며·조화시키고 같은 연결형으로 쓴다. 2번과 5번 장만 기니!로 끝내고 나머지는 기니로 끝낸다. 중괄호와 줄바꿈은 쓰지 않는다.");
export const generatedSectionSchema = sectionSchema.extend({ title: generatedTitleSchema });
export const generatedReportSchema = reportSchema.extend({ sections: z.array(generatedSectionSchema).length(8) });
