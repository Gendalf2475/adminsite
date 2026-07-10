import { describe, expect, it } from "vitest";
import {
  canAssignStaffGroup,
  canEditRole,
  canManageStaffGroup,
  resolveDutyEffective,
} from "@/config/roles";
import { getAuditActionLabel } from "@/config/audit";
import type { AuthUser } from "@/types/domain";

function userWithRank(key: string): AuthUser {
  return {
    id: key,
    telegramId: key,
    displayName: key,
    roles: [{ id: key, key, name: key, kind: "STAFF_RANK", permissions: [] }],
    permissions: [],
  };
}

describe("role hierarchy", () => {
  it("keeps developer protected from support", () => {
    const support = userWithRank("support");

    expect(canManageStaffGroup(support, "developer")).toBe(false);
    expect(canAssignStaffGroup(support, "developer")).toBe(false);
    expect(canManageStaffGroup(support, "support")).toBe(true);
    expect(canEditRole(support, "developer")).toBe(false);
    expect(canEditRole(support, "staff")).toBe(true);
  });

  it("allows developer to manage every staff rank while top role permissions stay locked", () => {
    const developer = userWithRank("developer");

    expect(canManageStaffGroup(developer, "developer")).toBe(true);
    expect(canAssignStaffGroup(developer, "developer")).toBe(true);
    expect(canEditRole(developer, "developer")).toBe(false);
    expect(canEditRole(developer, "support")).toBe(false);
    expect(canEditRole(developer, "moder")).toBe(true);
  });
});

describe("support duty overrides", () => {
  it("uses personal enable/disable before the rank default", () => {
    expect(resolveDutyEffective(true, "INHERIT")).toBe(true);
    expect(resolveDutyEffective(true, "DISABLED")).toBe(false);
    expect(resolveDutyEffective(false, "ENABLED")).toBe(true);
  });
});

describe("Russian audit labels", () => {
  it("describes staff updates using changed fields", () => {
    expect(getAuditActionLabel("staff.updated", { changedFields: ["status", "telegramId"] })).toBe(
      "Изменил данные сотрудника: статус, Telegram ID",
    );
    expect(getAuditActionLabel("role.permissions_updated")).toBe("Изменил права роли");
  });
});
