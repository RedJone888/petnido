import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";

import { formatAppError } from "./app-error";

describe("tRPC application error envelope", () => {
  it("maps authentication and stable domain errors", () => {
    expect(
      formatAppError(new TRPCError({ code: "UNAUTHORIZED" }), "request-1"),
    ).toEqual({
      code: "AUTH_REQUIRED",
      messageKey: "errors.authRequired",
      retryable: false,
      correlationId: "request-1",
    });
    expect(
      formatAppError(
        new TRPCError({ code: "CONFLICT", message: "CONFLICTING_UPDATE" }),
        "request-2",
      ),
    ).toMatchObject({ code: "CONFLICTING_UPDATE", retryable: true });
    expect(
      formatAppError(
        new TRPCError({ code: "CONFLICT", message: "LAST_SIGN_IN_METHOD" }),
        "request-3",
      ),
    ).toMatchObject({ code: "LAST_SIGN_IN_METHOD", retryable: false });
    expect(
      formatAppError(
        new TRPCError({ code: "UNAUTHORIZED", message: "REAUTH_REQUIRED" }),
        "request-4",
      ),
    ).toMatchObject({ code: "REAUTH_REQUIRED", retryable: false });
    expect(
      formatAppError(
        new TRPCError({ code: "UNAUTHORIZED", message: "INVALID_CREDENTIALS" }),
        "request-5",
      ),
    ).toMatchObject({ code: "INVALID_CREDENTIALS", retryable: false });
  });

  it("does not expose unknown internal error messages", () => {
    expect(
      formatAppError(
        new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "database-hostname-and-query",
        }),
        "request-3",
      ),
    ).toMatchObject({
      code: "UNEXPECTED_ERROR",
      messageKey: "errors.unexpected",
    });
  });
});
