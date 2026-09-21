import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { createReadingClient, READING_MODEL } from "../src/lib/reading-client.server";

// Explicit, single paid request. Never log credentials or raw provider errors.
async function main() {
  const started = Date.now();
  const result = await createReadingClient(30_000).structured.parse({
    model: READING_MODEL,
    instructions: 'Return JSON with status set to "ok".',
    input: "Connection test only.",
    reasoning: { effort: "none" },
    max_output_tokens: 512,
    text: { format: zodTextFormat(z.object({ status: z.literal("ok") }), "connection_test") },
  });
  console.log(JSON.stringify({ event: "openai_smoke", model: READING_MODEL,
    success: result.output_parsed.status === "ok", elapsedMs: Date.now() - started,
    usage: result.usage }));
}
main().catch((error: unknown) => {
  const safe = error as { status?: number; code?: string };
  console.error(JSON.stringify({ event: "openai_smoke", success: false,
    status: safe.status, code: safe.code?.replace(/[^a-z_]/gi, "").slice(0,60) }));
  process.exitCode = 1;
});
