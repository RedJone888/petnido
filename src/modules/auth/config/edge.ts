import type { NextAuthConfig } from "next-auth";

export const edgeAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [],
  pages: { signIn: "/auth/sign-in", error: "/auth/error" },
} satisfies NextAuthConfig;
