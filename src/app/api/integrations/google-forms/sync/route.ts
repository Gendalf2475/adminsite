import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth";
import { getLatestGoogleFormsSyncLog } from "@/services/google-forms.service";

export const runtime = "nodejs";

export async function POST() {
  const guard = await requireApiPermission("integrations.manage");
  if (!guard.ok) return guard.response;
  return NextResponse.json(
    {
      error: "Pull sync is disabled. Configure Apps Script to POST /api/integrations/google-forms/webhook.",
      latestSync: await getLatestGoogleFormsSyncLog(),
    },
    { status: 410 },
  );
}
