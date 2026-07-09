import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { parseJson } from "@/lib/api";
import { requireApiPermission } from "@/lib/auth";
import { replyToTicket } from "@/services/ticket.service";

export const runtime = "nodejs";

const schema = z.object({
  body: z.string().min(1),
  internal: z.boolean().default(false),
});

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission("tickets.reply");
  if (!guard.ok) return guard.response;
  const parsed = await parseJson(request, schema);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  const { id } = await context.params;
  return NextResponse.json({ data: await replyToTicket(id, parsed.data.body, guard.user.id, parsed.data.internal) }, { status: 201 });
}
