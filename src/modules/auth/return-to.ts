const DEFAULT_RETURN_TO = "/dashboard";

export function sanitizeReturnTo(value: string | null | undefined, fallback = DEFAULT_RETURN_TO) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f]/.test(value)
  ) return fallback;
  try {
    const url = new URL(value, "https://petnido.invalid");
    if (url.origin !== "https://petnido.invalid" || url.pathname === "/auth/continue") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function authSignInUrl(returnTo?: string | null) {
  return `/auth/sign-in?returnTo=${encodeURIComponent(sanitizeReturnTo(returnTo))}`;
}

export function authModalReturnTo(
  currentUrl: string,
  requestedReturnTo?: string | null,
) {
  if (requestedReturnTo) return sanitizeReturnTo(requestedReturnTo);
  const safeCurrentUrl = sanitizeReturnTo(currentUrl);
  const pathname = new URL(safeCurrentUrl, "https://petnido.invalid").pathname;
  return pathname === "/" || pathname === "/home-v2"
    ? "/dashboard"
    : safeCurrentUrl;
}

export function initialIntentDestination(
  intent: "POST_NEED" | "OFFER_SERVICE" | "BROWSE",
  returnTo?: string | null,
) {
  const safe = sanitizeReturnTo(returnTo);
  if (safe.startsWith("/auth/pending-action?")) return safe;
  if (intent === "BROWSE") return safe;
  return intent === "POST_NEED" ? "/needs/create" : "/dashboard/serviceprofile/services/new";
}

export function authContinuationUrl(returnTo?: string | null) {
  return `/auth/continue?returnTo=${encodeURIComponent(sanitizeReturnTo(returnTo))}`;
}
