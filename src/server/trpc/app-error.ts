import { TRPCError } from "@trpc/server";

const errorDefinitions = {
  AUTH_REQUIRED: ["errors.authRequired", false],
  RESOURCE_NOT_FOUND: ["errors.resourceNotFound", false],
  FORBIDDEN_RESOURCE_ACTION: ["errors.forbiddenAction", false],
  INVALID_STATE_TRANSITION: ["errors.invalidStateTransition", false],
  CONFLICTING_UPDATE: ["errors.conflictingUpdate", true],
  RATE_LIMITED: ["errors.rateLimited", true],
  INVALID_CODE: ["errors.invalidCode", true],
  CODE_EXPIRED: ["errors.codeExpired", true],
  TOO_MANY_CODE_ATTEMPTS: ["errors.tooManyCodeAttempts", true],
  EMAIL_ALREADY_REGISTERED: ["errors.emailAlreadyRegistered", false],
  DEPENDENCY_UNAVAILABLE: ["errors.dependencyUnavailable", true],
  UNEXPECTED_ERROR: ["errors.unexpected", true],
} as const;

export type AppErrorCode = keyof typeof errorDefinitions;

function isAppErrorCode(value: string): value is AppErrorCode {
  return value in errorDefinitions;
}

export function formatAppError(error: TRPCError, correlationId: string) {
  const candidate =
    error.code === "UNAUTHORIZED" && error.message === "UNAUTHORIZED"
      ? "AUTH_REQUIRED"
      : error.message === "VERIFICATION_RATE_LIMITED"
        ? "RATE_LIMITED"
        : error.message === "EMAIL_SEND_FAILED"
          ? "DEPENDENCY_UNAVAILABLE"
          : error.message;
  const code: AppErrorCode = isAppErrorCode(candidate)
    ? candidate
    : "UNEXPECTED_ERROR";
  const [messageKey, retryable] = errorDefinitions[code];

  return { code, messageKey, retryable, correlationId };
}
