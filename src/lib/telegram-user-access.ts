import { prisma } from "@/lib/prisma";
import { ensureStaffUserAccessByTelegramId } from "@/services/staff-access.service";

export async function loadUserByTelegramId(telegramId: string) {
  return prisma.user.findUnique({
    where: { telegramId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: true,
            },
          },
        },
      },
      staffMember: true,
    },
  });
}

export type DbUserWithRoles = Awaited<ReturnType<typeof loadUserByTelegramId>>;

export async function resolveTelegramLoginUser(telegramId: string) {
  let dbUser = await loadUserByTelegramId(telegramId);
  if (!dbUser?.active || dbUser.staffMember?.status === "REMOVED") {
    await ensureStaffUserAccessByTelegramId(telegramId);
    dbUser = await loadUserByTelegramId(telegramId);
  }

  if (!dbUser?.active || dbUser.staffMember?.status === "REMOVED") return null;
  return dbUser;
}
