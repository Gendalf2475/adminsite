import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      error: "Discord support is handled by the support-worker Discord Gateway sidecar.",
    },
    { status: 410 },
  );
}
