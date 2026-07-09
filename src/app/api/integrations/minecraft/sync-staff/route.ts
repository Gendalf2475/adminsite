import { NextResponse, type NextRequest } from "next/server";
import { SyncStatus } from "@prisma/client";
import { getBearerToken } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { verifyMinecraftPluginToken } from "@/services/minecraft.service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!verifyMinecraftPluginToken(getBearerToken(request))) {
    return NextResponse.json({ error: "Invalid plugin token" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const log = await prisma.integrationSyncLog.create({
    data: {
      integration: "minecraft_staff",
      status: SyncStatus.SUCCESS,
      message: "Mock staff sync payload accepted.",
      metadata: payload,
      finishedAt: new Date(),
    },
  });

  return NextResponse.json({ data: log });
}
