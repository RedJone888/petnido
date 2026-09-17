export const validationProfileCookie = "petnido_profile_validation";
export const validationFailureCookie = "petnido_validation_failure";
export const validationProfileUserId = "validation-profile-user";

export function validationProfileEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.FEATURE_PROFILE_E2E === "true" &&
    Boolean(process.env.VALIDATION_TEST_TOKEN)
  );
}

// A leftover SQLite URL must never switch normal application requests away
// from PostgreSQL and real authentication. Only the explicit E2E mode opts in.
export function validationDatabaseEnabled() {
  return validationProfileEnabled() && Boolean(process.env.VALIDATION_DATABASE_URL);
}

export function hasValidProfileValidationToken(req?: Request) {
  if (!req || !validationProfileEnabled()) return false;
  const expected = process.env.VALIDATION_TEST_TOKEN;
  const headerToken = req.headers.get("x-validation-token");
  const cookieToken = req.headers
    .get("cookie")
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${validationProfileCookie}=`))
    ?.slice(validationProfileCookie.length + 1);
  return headerToken === expected || cookieToken === expected;
}
