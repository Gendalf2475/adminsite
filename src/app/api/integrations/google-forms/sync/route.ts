import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth";
import { syncApplicationsFromGoogleSheetsMock } from "@/services/google-forms.service";

export const runtime = "nodejs";

export async function POST() {
  const guard = await requireApiPermission("integrations.manage");
  if (!guard.ok) return guard.response;
  return NextResponse.json({ data: await syncApplicationsFromGoogleSheetsMock() });
}
