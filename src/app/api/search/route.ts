import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import type { GlobalSearchResult } from "@/types/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SEARCH_LIMIT_PER_SECTION = 5;

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (!query) return NextResponse.json({ data: [] satisfies GlobalSearchResult[] });

  const tasks: Array<Promise<GlobalSearchResult[]>> = [];

  if (hasPermission(user.permissions, "staff.view")) {
    tasks.push(searchStaff(query));
  }

  if (hasPermission(user.permissions, "applications.view")) {
    tasks.push(searchApplications(query));
  }

  if (hasPermission(user.permissions, "tickets.view")) {
    tasks.push(searchTickets(query));
  }

  const results = (await Promise.all(tasks)).flat().slice(0, 12);
  return NextResponse.json({ data: results }, { headers: { "cache-control": "no-store" } });
}

function contains(query: string) {
  return { contains: query, mode: "insensitive" as const };
}

async function searchStaff(query: string): Promise<GlobalSearchResult[]> {
  const rows = await prisma.staffMember.findMany({
    where: {
      OR: [
        { username: contains(query) },
        { telegramId: contains(query) },
        { discordUsername: contains(query) },
        { currentLuckPermsGroup: contains(query) },
        { projectPosition: contains(query) },
      ],
    },
    orderBy: [{ status: "asc" }, { assignedAt: "desc" }],
    take: SEARCH_LIMIT_PER_SECTION,
  });

  return rows.map((row) => ({
    type: "staff",
    id: row.id,
    title: row.username,
    subtitle: `${row.currentLuckPermsGroup} · ${row.projectPosition}`,
    href: `/staff/${row.id}`,
    status: row.status,
  }));
}

async function searchApplications(query: string): Promise<GlobalSearchResult[]> {
  const rows = await prisma.application.findMany({
    where: {
      OR: [
        { candidateUsername: contains(query) },
        { googleSheetRowId: contains(query) },
        { telegramUsername: contains(query) },
        { telegramId: contains(query) },
        { discordUsername: contains(query) },
      ],
    },
    orderBy: { submittedAt: "desc" },
    take: SEARCH_LIMIT_PER_SECTION,
  });

  return rows.map((row) => ({
    type: "application",
    id: row.id,
    title: row.candidateUsername,
    subtitle: `${row.telegramUsername ?? "Telegram не указан"} · ${row.discordUsername ?? "Discord не указан"}`,
    href: `/applications/${row.id}`,
    status: row.status,
  }));
}

async function searchTickets(query: string): Promise<GlobalSearchResult[]> {
  const rows = await prisma.ticket.findMany({
    where: {
      OR: [
        { title: contains(query) },
        { externalThreadId: contains(query) },
        { externalUsername: contains(query) },
        { playerUsername: contains(query) },
      ],
    },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    take: SEARCH_LIMIT_PER_SECTION,
  });

  return rows.map((row) => ({
    type: "ticket",
    id: row.id,
    title: row.title,
    subtitle: `${row.source} · ${row.externalUsername}`,
    href: `/tickets/${row.id}`,
    status: row.status,
  }));
}
