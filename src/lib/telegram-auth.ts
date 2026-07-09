import crypto from "node:crypto";
import { z } from "zod";

export const telegramLoginSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().url().optional(),
  auth_date: z.union([z.string(), z.number()]).transform((value) => Number(value)),
  hash: z.string(),
});

export type TelegramLoginPayload = z.infer<typeof telegramLoginSchema>;

export function createTelegramDataCheckString(payload: Record<string, unknown>) {
  return Object.entries(payload)
    .filter(([key, value]) => key !== "hash" && value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

export function createTelegramHash(payload: Record<string, unknown>, botToken: string) {
  const secret = crypto.createHash("sha256").update(botToken).digest();
  return crypto.createHmac("sha256", secret).update(createTelegramDataCheckString(payload)).digest("hex");
}

export function verifyTelegramLogin(payload: Record<string, unknown>, botToken: string, maxAgeSeconds = 86400) {
  const parsed = telegramLoginSchema.parse(payload);
  const expectedHash = createTelegramHash(parsed, botToken);
  const receivedHash = parsed.hash;

  const hashValid =
    expectedHash.length === receivedHash.length &&
    crypto.timingSafeEqual(Buffer.from(expectedHash, "hex"), Buffer.from(receivedHash, "hex"));

  if (!hashValid) {
    return { ok: false as const, reason: "invalid_hash" as const };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (nowSeconds - parsed.auth_date > maxAgeSeconds) {
    return { ok: false as const, reason: "expired" as const };
  }

  return { ok: true as const, user: parsed };
}
