import { createHmac, timingSafeEqual, createHash } from "node:crypto";
import { z } from "zod";
import { reportSchema } from "./reading-schema";

const checkpointSchema = z.object({
  scope: z.string(), expires: z.number(), attempt: z.number().int().min(1).max(3),
  report: reportSchema, editorial: z.record(z.string(), z.array(z.string())).default({}),
});
type Checkpoint = z.infer<typeof checkpointSchema>;
export const checkpointScope = (pair: unknown) => createHash("sha256").update(JSON.stringify(pair)).digest("hex");
const signature = (body: string, secret: string) => createHmac("sha256", secret).update(`saju-checkpoint-v1:${body}`).digest();

export function sealCheckpoint(value: Omit<Checkpoint, "expires">, secret: string, now = Date.now()) {
  const body = Buffer.from(JSON.stringify(checkpointSchema.parse({ ...value, expires: now + 30 * 60_000 }))).toString("base64url");
  return `${body}.${signature(body, secret).toString("base64url")}`;
}

export function openCheckpoint(token: string, scope: string, secret: string, now = Date.now()) {
  if (token.length > 100_000) throw new Error("INVALID_CHECKPOINT");
  const [body, mac, extra] = token.split(".");
  if (!body || !mac || extra) throw new Error("INVALID_CHECKPOINT");
  const actual = Buffer.from(mac, "base64url"), expected = signature(body, secret);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error("INVALID_CHECKPOINT");
  const value = checkpointSchema.parse(JSON.parse(Buffer.from(body, "base64url").toString("utf8")));
  if (value.scope !== scope || value.expires <= now) throw new Error("INVALID_CHECKPOINT");
  return value;
}
