import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { readingInput, type ChartPair } from "./compatibility";
import { reportSchema, validateReport, type Report } from "./reading-schema";
import { SYSTEM_PROMPT, PROMPT_VERSION } from "./reading-prompt";

export async function generateReading(pair: ChartPair, options: { prompt?: string; today?: string; previous?: Report } = {}) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0, timeout: 110_000 });
  const input = readingInput(pair, options.today);
  const started = Date.now();
  const response = await client.responses.parse({
    model: "gpt-5.6-luna", instructions: options.prompt ?? SYSTEM_PROMPT,
    input: JSON.stringify(options.previous ? { ...input, repair: { previous_report: options.previous, errors: validateReport(options.previous, input), target_body_chars: 725, instruction: "이전 결과에서 오류가 있는 항목만 고쳐 전체 JSON을 반환한다. 길이가 초과한 본문은 의미를 보존하면서 중복된 예시·조언을 덜어 700~750자로 줄인다. 제목은 35~45자와 쉼표 1개 및 마지막 기니를 맞춘다. 호칭·근거·3문단·완결 문장은 유지한다. 오류 없는 부분은 바꾸지 않는다. 글자를 자르거나 공백과 이모지로 채우지 않는다." } } : input), store: false, tools: [],
    reasoning: { effort: "medium" }, max_output_tokens: 20000,
    text: { verbosity: "high", format: zodTextFormat(reportSchema, "otaku_report") },
  });
  if (response.status !== "completed" || !response.output_parsed) throw new Error("READING_INCOMPLETE");
  const report = reportSchema.parse(response.output_parsed);
  return { report, validation: validateReport(report, input), usage: response.usage, elapsedMs: Date.now() - started, promptVersion: PROMPT_VERSION };
}
