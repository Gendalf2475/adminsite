import { afterEach, describe, expect, it } from "vitest";
import { getConfiguredLuckPermsStaffGroups, parseLuckPermsStaffGroups, validateLuckPermsStaffGroup } from "@/services/luckperms.service";

const originalGroups = process.env.LUCKPERMS_STAFF_GROUPS;

afterEach(() => {
  process.env.LUCKPERMS_STAFF_GROUPS = originalGroups;
});

describe("LuckPerms staff groups", () => {
  it("parses configured groups with trimming, normalization, and dedupe", () => {
    expect(parseLuckPermsStaffGroups(" owner, Admin, moderator, owner, , helper ")).toEqual(["owner", "admin", "moderator", "helper"]);
  });

  it("reads the site allowlist from environment", () => {
    process.env.LUCKPERMS_STAFF_GROUPS = "owner,admin";

    expect(getConfiguredLuckPermsStaffGroups()).toEqual(["owner", "admin"]);
  });

  it("rejects groups that are not in the configured allowlist", () => {
    const result = validateLuckPermsStaffGroup("builder", ["owner", "admin", "moderator"]);

    if (result.ok) throw new Error("Expected builder to be rejected.");
    expect(result.message).toContain("Unknown LuckPerms group");
  });
});
