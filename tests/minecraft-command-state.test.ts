import { describe, expect, it } from "vitest";
import { isCommandExpired, resolveCommandStatus } from "@/services/minecraft-command-state";

describe("minecraft command state", () => {
  it("marks expired commands before applying plugin result", () => {
    const now = new Date("2026-07-09T10:00:00.000Z");
    const command = {
      status: "PROCESSING" as const,
      expiresAt: new Date("2026-07-09T09:59:59.000Z"),
    };

    expect(isCommandExpired(command, now)).toBe(true);
    expect(resolveCommandStatus(command, { success: true }, now)).toBe("EXPIRED");
  });

  it("maps plugin result to success or failed for active commands", () => {
    const now = new Date("2026-07-09T10:00:00.000Z");
    const command = {
      status: "PROCESSING" as const,
      expiresAt: new Date("2026-07-09T10:10:00.000Z"),
    };

    expect(resolveCommandStatus(command, { success: true }, now)).toBe("SUCCESS");
    expect(resolveCommandStatus(command, { success: false }, now)).toBe("FAILED");
  });
});
