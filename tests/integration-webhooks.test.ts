import { describe, expect, it } from "vitest";
import { verifyGoogleFormsWebhookToken } from "@/services/google-forms.service";
import { verifyTelegramWebhookSecret } from "@/services/telegram.service";

describe("integration webhook auth", () => {
  it("validates Telegram secret header", () => {
    process.env.TELEGRAM_WEBHOOK_SECRET = "tg-secret";

    expect(verifyTelegramWebhookSecret("tg-secret")).toBe(true);
    expect(verifyTelegramWebhookSecret("wrong")).toBe(false);
    expect(verifyTelegramWebhookSecret(null)).toBe(false);
  });

  it("validates Google Forms bearer token", () => {
    process.env.GOOGLE_FORMS_WEBHOOK_SECRET = "forms-secret";

    expect(verifyGoogleFormsWebhookToken("forms-secret")).toBe(true);
    expect(verifyGoogleFormsWebhookToken("wrong")).toBe(false);
    expect(verifyGoogleFormsWebhookToken(null)).toBe(false);
  });
});
