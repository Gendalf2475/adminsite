import { NextResponse, type NextRequest } from "next/server";
import type { ZodSchema } from "zod";

export async function parseJson<T>(request: NextRequest | Request, schema: ZodSchema<T>) {
  const body = await request.json().catch(() => null);
  return schema.safeParse(body);
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function getBearerToken(request: NextRequest | Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice("Bearer ".length);
}

export function getRequestIp(request: NextRequest | Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? null;
}
