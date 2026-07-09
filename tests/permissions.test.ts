import { describe, expect, it } from "vitest";
import { getEffectivePermissionsFromRoles, hasPermission } from "@/lib/permissions";
import type { RoleSummary } from "@/types/domain";

describe("RBAC permissions", () => {
  it("combines rank and duty permissions without duplicates", () => {
    const roles: RoleSummary[] = [
      {
        id: "role-admin",
        key: "admin",
        name: "Admin",
        kind: "STAFF_RANK",
        permissions: ["staff.view", "tickets.view", "tickets.reply"],
      },
      {
        id: "role-support",
        key: "support",
        name: "Support",
        kind: "DUTY",
        permissions: ["tickets.view", "tickets.close", "tickets.assign"],
      },
    ];

    const effective = getEffectivePermissionsFromRoles(roles);

    expect(effective).toEqual(["staff.view", "tickets.view", "tickets.reply", "tickets.close", "tickets.assign"]);
    expect(hasPermission(effective, "tickets.close")).toBe(true);
    expect(hasPermission(effective, "settings.manage")).toBe(false);
  });
});
