import { describe, expect, it } from "vitest";
import { getOutboundRetryDelaySeconds, isFinalOutboundFailure } from "@/services/support-outbound.service";

describe("support outbound retry policy", () => {
  it("uses capped backoff schedule", () => {
    expect(getOutboundRetryDelaySeconds(1)).toBe(5);
    expect(getOutboundRetryDelaySeconds(2)).toBe(30);
    expect(getOutboundRetryDelaySeconds(3)).toBe(120);
    expect(getOutboundRetryDelaySeconds(4)).toBe(300);
    expect(getOutboundRetryDelaySeconds(7)).toBe(300);
  });

  it("marks final failure after eight attempts", () => {
    expect(isFinalOutboundFailure(7)).toBe(false);
    expect(isFinalOutboundFailure(8)).toBe(true);
    expect(isFinalOutboundFailure(9)).toBe(true);
  });
});
