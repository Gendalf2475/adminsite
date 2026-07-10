import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
}));

const staffAccessMock = vi.hoisted(() => ({
  ensureStaffUserAccessByTelegramId: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/services/staff-access.service", () => staffAccessMock);

import { resolveTelegramLoginUser } from "@/lib/telegram-user-access";

function dbUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    telegramId: "197300387",
    telegramUsername: "tasis",
    displayName: "TASIS",
    avatarUrl: null,
    active: true,
    lastLoginAt: null,
    staffMemberId: "staff-1",
    staffMember: { status: "ACTIVE" },
    roles: [],
    ...overrides,
  };
}

describe("telegram login user resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an existing active user without reconciling staff access", async () => {
    const user = dbUser();
    prismaMock.user.findUnique.mockResolvedValue(user);

    await expect(resolveTelegramLoginUser("197300387")).resolves.toBe(user);
    expect(staffAccessMock.ensureStaffUserAccessByTelegramId).not.toHaveBeenCalled();
  });

  it("reconciles access when a staff Telegram ID has no User yet", async () => {
    const user = dbUser();
    prismaMock.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(user);
    staffAccessMock.ensureStaffUserAccessByTelegramId.mockResolvedValue(true);

    await expect(resolveTelegramLoginUser("197300387")).resolves.toBe(user);
    expect(staffAccessMock.ensureStaffUserAccessByTelegramId).toHaveBeenCalledWith("197300387");
  });

  it("still rejects when reconciliation does not produce an active user", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    staffAccessMock.ensureStaffUserAccessByTelegramId.mockResolvedValue(false);

    await expect(resolveTelegramLoginUser("197300387")).resolves.toBeNull();
  });
});
