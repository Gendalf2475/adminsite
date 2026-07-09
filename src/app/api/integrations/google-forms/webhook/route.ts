import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getBearerToken, parseJson } from "@/lib/api";
import { upsertApplicationFromGoogleForms, verifyGoogleFormsWebhookToken } from "@/services/google-forms.service";

export const runtime = "nodejs";

const schema = z.object({
  rowId: z.string().min(1),
  submittedAt: z.union([z.string(), z.date()]).optional(),
  candidateUsername: z.string().min(2),
  telegramUsername: z.string().nullable().optional(),
  telegramId: z.string().nullable().optional(),
  discordUsername: z.string().nullable().optional(),
  answers: z.record(z.unknown()),
});

export async function POST(request: NextRequest) {
  if (!verifyGoogleFormsWebhookToken(getBearerToken(request))) {
    return NextResponse.json({ error: "Invalid Google Forms webhook token" }, { status: 401 });
  }

  const parsed = await parseJson(request, schema);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });

  const data = await upsertApplicationFromGoogleForms(parsed.data);
  return NextResponse.json({ ok: true, data }, { status: data.imported ? 201 : 200 });
}
