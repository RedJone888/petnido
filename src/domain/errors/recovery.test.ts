import { describe, expect, it } from "vitest";

import { recoveryAdvice } from "./recovery";

describe("recoverable error advice", () => {
  it("maps concurrency conflicts to refresh without exposing raw server details", () => {
    expect(recoveryAdvice({ data: { appError: { code: "CONFLICTING_UPDATE", correlationId: "request-1" } } })).toMatchObject({ kind: "CONFLICT", action: "REFRESH", retryable: true, correlationId: "request-1" });
  });

  it("separates missing, forbidden, expired and damaged-draft recovery", () => {
    expect(recoveryAdvice(new Error("RESOURCE_NOT_FOUND")).action).toBe("BACK");
    expect(recoveryAdvice(new Error("FORBIDDEN_RESOURCE_ACTION")).kind).toBe("FORBIDDEN");
    expect(recoveryAdvice(new Error("NEED_ALREADY_EXPIRED")).kind).toBe("EXPIRED");
    expect(recoveryAdvice(new Error("DAMAGED_DRAFT")).action).toBe("DISCARD_DRAFT");
  });

  it("makes network and unknown failures retryable while cancellation does nothing", () => {
    expect(recoveryAdvice(new Error("fetch failed")).action).toBe("RETRY");
    expect(recoveryAdvice(new Error("unexpected internal detail"))).toMatchObject({ kind: "UNKNOWN", retryable: true });
    expect(recoveryAdvice(new Error("CANCELLED")).action).toBe("NONE");
  });
});
