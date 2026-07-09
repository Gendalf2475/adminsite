import { NextResponse } from "next/server";
import { getDemoUserWithAllPermissions } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Dev login is disabled in production" }, { status: 403 });
  }

  const user = getDemoUserWithAllPermissions();
  await setSessionCookie(user);
  return NextResponse.json({ ok: true, user });
}
