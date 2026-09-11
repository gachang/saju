// Authentication only. Never log API error bodies or request headers.
const response = await fetch("https://api.openai.com/v1/models/gpt-5.6-luna", {
  headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
  signal: AbortSignal.timeout(20000),
});
const body = await response.json();
console.log(JSON.stringify({ status: response.status, model: response.ok ? body.id : null, code: body.error?.code ?? null }));
process.exitCode = response.ok ? 0 : 1;
