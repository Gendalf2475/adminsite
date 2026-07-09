import { describe, expect, it, vi } from "vitest";
import { createTelegramHash, verifyTelegramLogin } from "@/lib/telegram-auth";

describe("telegram login verification", () => {
  it("accepts a valid Telegram Login Widget payload", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-09T10:00:00.000Z"));
    const authDate = Math.floor(Date.now() / 1000);
    const payload = {
      id: "123456789",
      first_name: "Owner",
      username: "owner",
      auth_date: authDate,
    };
    const botToken = "123456:secret";
    const hash = createTelegramHash(payload, botToken);

    expect(verifyTelegramLogin({ ...payload, hash }, botToken)).toEqual({
      ok: true,
      user: { ...payload, hash },
    });

    vi.useRealTimers();
  });

  it("rejects tampered payloads", () => {
    const payload = {
      id: "123456789",
      username: "owner",
      auth_date: Math.floor(Date.now() / 1000),
      hash: "0".repeat(64),
    };

    expect(verifyTelegramLogin(payload, "123456:secret")).toEqual({ ok: false, reason: "invalid_hash" });
  });
});
