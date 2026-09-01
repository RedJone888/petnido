import NextAuth from "next-auth";

import { edgeAuthConfig } from "@/modules/auth/config/edge";
import { sanitizeReturnTo } from "@/modules/auth/return-to";
import { hasValidProfileValidationToken } from "@/server/validation/profile-session";

const { auth } = NextAuth(edgeAuthConfig);

export default auth((req) => {
  const isLoggedIn = Boolean(req.auth);
  const isValidationSession = hasValidProfileValidationToken(req);
  const { nextUrl } = req;
  if (nextUrl.pathname.startsWith("/dashboard") && !isLoggedIn && !isValidationSession) {
    const returnTo = sanitizeReturnTo(
      `${nextUrl.pathname}${nextUrl.search}`,
      "/dashboard",
    );
    const signInUrl = nextUrl.clone();
    const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0];
    const requestHost = forwardedHost ?? req.headers.get("host");
    if (
      requestHost &&
      /^(?:localhost|[a-z0-9.-]+|\[[a-f0-9:]+\])(?::\d{1,5})?$/i.test(
        requestHost,
      )
    ) {
      signInUrl.host = requestHost;
    }
    signInUrl.pathname = "/auth/sign-in";
    signInUrl.search = "";
    signInUrl.searchParams.set("returnTo", returnTo);
    return Response.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
