import { describe, expect, it } from "vitest";

import { authPasswordSchema, stepLoginSchema } from "./schemas";

describe("auth password policy", () => {
  it("requires at least eight characters with a letter and a number", () => {
    expect(authPasswordSchema.safeParse("password1").success).toBe(true);
    expect(authPasswordSchema.safeParse("short1").success).toBe(false);
    expect(authPasswordSchema.safeParse("password").success).toBe(false);
    expect(authPasswordSchema.safeParse("12345678").success).toBe(false);
  });

  it("applies the same password policy to email sign-in", () => {
    expect(
      stepLoginSchema.safeParse({ email: "user@example.com", password: "password1" }).success,
    ).toBe(true);
    expect(
      stepLoginSchema.safeParse({ email: "user@example.com", password: "12345678" }).success,
    ).toBe(false);
  });
});
