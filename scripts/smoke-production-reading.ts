// Explicitly invoked live test; only the existing synthetic fixture is transmitted.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";
const origin = "https://otaku-saju-web.vercel.app";
async function main() {
  const fixture = JSON.parse(await readFile("tests/fixtures/accepted-report.json", "utf8"));
  const resumeFile = process.argv[2];
  let resumeToken: string | undefined = resumeFile
    ? JSON.parse(await readFile(resumeFile, "utf8")).resumeToken
    : undefined;
  if (resumeFile && !resumeToken) throw new Error("MISSING_RESUME_TOKEN");
  for (let step = 1; step <= 3; step++) {
    const started = Date.now();
    const response = await fetch(`${origin}/api/reading-copy`, {
      method: "POST", headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ ...fixture.pair, name_lengths: fixture.nameLengths, resumeToken }), signal: AbortSignal.timeout(250_000),
    });
    const body = await response.json();
    console.log(JSON.stringify({ step, status: response.status, code: body.code, requestId: body.requestId, elapsedMs: Date.now() - started, sections: body.report?.sections.length }));
    await mkdir(".eval", { recursive: true });
    await writeFile(".eval/luna-production-result.json", JSON.stringify(body, null, 2), { mode: 0o600 });
    await writeFile(`.eval/luna-production-step-${step}.json`, JSON.stringify(body, null, 2), { mode: 0o600 });
    if (body.resumeToken && (response.status === 202 || body.code === "READING_TIMEOUT")) {
      resumeToken = body.resumeToken;
      await setTimeout(7000);
      continue;
    }
    if (!response.ok || !body.report) process.exitCode = 1;
    return;
  }
  process.exitCode = 1;
}
main().catch(() => { console.error("LIVE_TEST_TRANSPORT_FAILURE"); process.exitCode = 1; });
