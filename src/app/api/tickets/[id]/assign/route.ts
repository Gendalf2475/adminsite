import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { parseJson } from "@/lib/api";
import { requireApiPermission } from "@/lib/auth";
import { assignTicket } from "@/services/ticket.service";

export const runtime = "nodejs";

const schema = z.object({ assignedUserId: z.string().nullable() });

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission("tickets.assign");
  if (!guard.ok) return guard.response;
  const parsed = await parseJson(request, schema);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  const { id } = await context.params;
  return NextResponse.json({ data: await assignTicket(id, parsed.data.assignedUserId, guard.user.id) });
}
