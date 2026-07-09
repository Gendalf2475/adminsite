import { NextResponse, type NextRequest } from "next/server";
import { ApplicationStatus } from "@prisma/client";
import { z } from "zod";
import { parseJson } from "@/lib/api";
import { requireApiPermission } from "@/lib/auth";
import { updateApplicationStatus } from "@/services/application.service";

export const runtime = "nodejs";

const schema = z.object({
  status: z.nativeEnum(ApplicationStatus),
  note: z.string().optional(),
});

const permissionByStatus: Partial<Record<ApplicationStatus, "applications.accept" | "applications.reject" | "applications.manage">> = {
  ACCEPTED: "applications.accept",
  REJECTED: "applications.reject",
};

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const parsed = await parseJson(request, schema);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });

  const requiredPermission = permissionByStatus[parsed.data.status] ?? "applications.manage";
  const guard = await requireApiPermission(requiredPermission);
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  return NextResponse.json({ data: await updateApplicationStatus(id, parsed.data.status, guard.user.id, parsed.data.note) });
}
