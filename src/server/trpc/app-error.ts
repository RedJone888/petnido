import { TRPCError } from "@trpc/server";

const errorDefinitions = {
  AUTH_REQUIRED: ["errors.authRequired", false],
  RESOURCE_NOT_FOUND: ["errors.resourceNotFound", false],
  FORBIDDEN_RESOURCE_ACTION: ["errors.forbiddenAction", false],
  INVALID_STATE_TRANSITION: ["errors.invalidStateTransition", false],
  CONFLICTING_UPDATE: ["errors.conflictingUpdate", true],
  IDEMPOTENCY_KEY_REUSED: ["errors.conflictingUpdate", false],
  DRAFT_REVISION_CONFLICT: ["errors.conflictingUpdate", true],
  INVALID_BOOKING_WINDOW: ["errors.invalidStateTransition", false],
  SERVICE_UNAVAILABLE: ["errors.resourceNotFound", true],
  PET_NOT_ACCEPTED: ["errors.invalidStateTransition", false],
  BOARDING_CAPACITY_EXCEEDED: ["errors.conflictingUpdate", true],
  EMAIL_VERIFICATION_REQUIRED: ["errors.invalidStateTransition", false],
  RATE_LIMITED: ["errors.rateLimited", true],
  INVALID_CODE: ["errors.invalidCode", true],
  CODE_EXPIRED: ["errors.codeExpired", true],
  TOO_MANY_CODE_ATTEMPTS: ["errors.tooManyCodeAttempts", true],
  EMAIL_ALREADY_REGISTERED: ["errors.emailAlreadyRegistered", false],
  INVALID_CREDENTIALS: ["errors.invalidCredentials", false],
  LAST_SIGN_IN_METHOD: ["errors.lastSignInMethod", false],
  PROVIDER_NOT_LINKED: ["errors.providerNotLinked", false],
  PROVIDER_ALREADY_LINKED: ["errors.providerAlreadyLinked", false],
  GOOGLE_ACCOUNT_IN_USE: ["errors.googleAccountInUse", false],
  GOOGLE_EMAIL_IN_USE: ["errors.googleEmailInUse", false],
  GOOGLE_EMAIL_NOT_VERIFIED: ["errors.googleEmailNotVerified", false],
  OAUTH_CONNECT_EXPIRED: ["errors.oauthConnectExpired", true],
  OAUTH_LINK_EXPIRED: ["errors.oauthConnectExpired", true],
  REAUTH_REQUIRED: ["errors.reauthRequired", false],
  NEED_ALREADY_EXPIRED: ["errors.needAlreadyExpired", false],
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
