import { z } from "zod";
import { reportSchema, sectionSchema } from "./reading-schema";

// Keep draft ingestion permissive for repair, but constrain new generation at the API boundary.
// Exact NFC counts and title style remain code checks; the API enforces title length only.
export const generatedTitleSchema = z.string().min(35).max(45)
  .describe("공백 포함 35~45자 제목. 쉼표는 정확히 하나이며 'A, B기니' 구조로 쓴다. 기니는 앞말에 붙여 정확히 한 번만 쓴다. 2번과 5번 장만 기니!로 끝내고 나머지는 기니로 끝낸다. 중괄호와 줄바꿈은 쓰지 않는다.");
export const generatedSectionSchema = sectionSchema.extend({ title: generatedTitleSchema });
export const generatedReportSchema = reportSchema.extend({ sections: z.array(generatedSectionSchema).length(8) });
