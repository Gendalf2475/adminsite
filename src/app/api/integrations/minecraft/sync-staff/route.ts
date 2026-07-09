import { NextResponse, type NextRequest } from "next/server";
import { StaffStatus } from "@prisma/client";
import { z } from "zod";
import { getBearerToken, parseJson } from "@/lib/api";
import { verifyMinecraftPluginToken } from "@/services/minecraft.service";
import { syncStaffFromMinecraft } from "@/services/staff.service";

export const runtime = "nodejs";

const staffSchema = z.object({
  username: z.string().min(2),
  uuid: z.string().nullable().optional(),
  telegramId: z.string().nullable().optional(),
  discordUsername: z.string().nullable().optional(),
  currentLuckPermsGroup: z.string().min(1),
  projectPosition: z.string().nullable().optional(),
  status: z.nativeEnum(StaffStatus).nullable().optional(),
});

const schema = z.object({
  serverName: z.string().nullable().optional(),
  staff: z.array(staffSchema).min(1),
});

export async function POST(request: NextRequest) {
  if (!verifyMinecraftPluginToken(getBearerToken(request))) {
    return NextResponse.json({ error: "Invalid plugin token" }, { status: 401 });
  }

  const parsed = await parseJson(request, schema);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });

  return NextResponse.json({ data: await syncStaffFromMinecraft(parsed.data) });
}
