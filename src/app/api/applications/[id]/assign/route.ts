import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { parseJson } from "@/lib/api";
import { requireApiPermission } from "@/lib/auth";
import { assignApplication } from "@/services/application.service";

export const runtime = "nodejs";

const schema = z.object({ reviewerId: z.string().nullable() });

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission("applications.manage");
  if (!guard.ok) return guard.response;
  const parsed = await parseJson(request, schema);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  const { id } = await context.params;
  return NextResponse.json({ data: await assignApplication(id, parsed.data.reviewerId, guard.user.id) });
}
