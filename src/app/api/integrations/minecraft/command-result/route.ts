import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getBearerToken, parseJson } from "@/lib/api";
import { recordCommandResult, verifyMinecraftPluginToken } from "@/services/minecraft.service";

export const runtime = "nodejs";

const schema = z.object({
  commandId: z.string(),
  success: z.boolean(),
  result: z.unknown().optional(),
  errorMessage: z.string().optional(),
});

export async function POST(request: NextRequest) {
  if (!verifyMinecraftPluginToken(getBearerToken(request))) {
    return NextResponse.json({ error: "Invalid plugin token" }, { status: 401 });
  }

  const parsed = await parseJson(request, schema);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });

  return NextResponse.json({ data: await recordCommandResult(parsed.data) });
}
