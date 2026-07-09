import { NextResponse, type NextRequest } from "next/server";
import { requireApiPermission } from "@/lib/auth";
import { sendApplicationReport } from "@/services/application.service";

export const runtime = "nodejs";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission("applications.send_report");
  if (!guard.ok) return guard.response;
  const { id } = await context.params;
  return NextResponse.json({ data: await sendApplicationReport(id, guard.user.id) });
}
