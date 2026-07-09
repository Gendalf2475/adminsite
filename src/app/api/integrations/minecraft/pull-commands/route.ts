import { NextResponse, type NextRequest } from "next/server";
import { getBearerToken } from "@/lib/api";
import { pullPendingCommands, verifyMinecraftPluginToken } from "@/services/minecraft.service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!verifyMinecraftPluginToken(getBearerToken(request))) {
    return NextResponse.json({ error: "Invalid plugin token" }, { status: 401 });
  }

  const commands = await pullPendingCommands();
  return NextResponse.json({ data: commands });
}
