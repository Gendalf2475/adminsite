import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth";
import { listApplications } from "@/services/application.service";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireApiPermission("applications.view");
  if (!guard.ok) return guard.response;
  return NextResponse.json({ data: await listApplications() });
}
