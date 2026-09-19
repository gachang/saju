import { createReadingClient, READING_MODEL } from "./reading-client.server";
import { zodTextFormat } from "openai/helpers/zod";
import { readingInput, type ChartPair, type NameLengths } from "./compatibility";
import { generatedReportSchema } from "./reading-output-schema";
import { reportSchema, validateReport, type Report } from "./reading-schema";
import { SYSTEM_PROMPT, PROMPT_VERSION } from "./reading-prompt";
import { withPacedReadingRetry as withRateLimitRetry } from "./openai-retry.server";

export type ReadingModel = typeof READING_MODEL;
export async function generateReading(pair: ChartPair, options: { prompt?: string; today?: string; previous?: Report; model?: ReadingModel; signal?: AbortSignal; nameLengths?: NameLengths; onUsage?: (usage: unknown, elapsedMs: number) => void } = {}) {
  const client = createReadingClient(52_000);
  const input = readingInput(pair, options.today, options.nameLengths);
  const started = Date.now();
  const response = await withRateLimitRetry(() => client.structured.parse({
    model: options.model ?? READING_MODEL, instructions: options.prompt ?? SYSTEM_PROMPT,
    input: JSON.stringify(options.previous ? { ...input, repair: { previous_report: options.previous, errors: validateReport(options.previous, input), target_body_chars: 725, instruction: "이전 결과에서 오류가 있는 항목만 고쳐 전체 JSON을 반환한다. 길이가 초과한 본문은 의미를 보존하면서 중복된 예시·조언을 덜어 700~750자로 줄인다. 제목은 35~45자와 쉼표 1개 및 마지막 기니를 맞춘다. '멈췄 다른', '곱씹었 조금씩', '조화시켰 서로'처럼 중간 동사를 자르지 말고 자연스러운 연결형으로 고친다. 호칭·근거·3문단·완결 문장은 유지한다. 오류 없는 부분은 바꾸지 않는다. 글자를 자르거나 공백과 이모지로 채우지 않는다." } } : input), store: false, tools: [],
    max_output_tokens: 5000,
    // Accept structurally valid drafts; title/body length belongs to repairReport.
    text: { format: zodTextFormat(generatedReportSchema, "otaku_report") },
  }, { signal: options.signal }), options.signal);
  options.onUsage?.(response.usage, Date.now() - started);
  if (!response.output_parsed) throw new Error("READING_INCOMPLETE");
  const report = reportSchema.parse(response.output_parsed);
  return { report, validation: validateReport(report, input), usage: response.usage, elapsedMs: Date.now() - started, promptVersion: PROMPT_VERSION };
}
