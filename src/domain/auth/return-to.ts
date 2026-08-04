const localOrigin = "https://petnido.local";

export function sanitizeReturnTo(
  candidate: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (
    !candidate ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /[\u0000-\u001f]/.test(candidate)
  ) {
    return fallback;
  }

  try {
    const url = new URL(candidate, localOrigin);
    if (url.origin !== localOrigin || url.pathname === "/auth/continue") {
      return fallback;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function authContinuationUrl(returnTo?: string | null): string {
  const safe = sanitizeReturnTo(returnTo);
  return `/auth/continue?returnTo=${encodeURIComponent(safe)}`;
}
