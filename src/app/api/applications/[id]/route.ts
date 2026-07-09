import { NextResponse, type NextRequest } from "next/server";
import { requireApiPermission } from "@/lib/auth";
import { getApplication } from "@/services/application.service";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission("applications.view");
  if (!guard.ok) return guard.response;
  const { id } = await context.params;
  const data = await getApplication(id);
  if (!data) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  return NextResponse.json({ data });
}
