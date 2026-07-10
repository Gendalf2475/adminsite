import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth";
import { listAuditLogRows } from "@/services/audit-log.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireApiPermission("audit.view");
  if (!guard.ok) return guard.response;

  return NextResponse.json({ data: await listAuditLogRows() }, { headers: { "cache-control": "no-store" } });
}
