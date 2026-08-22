import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Line from "next-auth/providers/line";
import { cookies } from "next/headers";

import prisma from "@/lib/prisma";
import { edgeAuthConfig } from "../config/edge";
import { normalizeEmail } from "../shared/email";
import { consumeLoginTicket } from "./login-ticket";
import { createPendingGoogleLink } from "./oauth-link";
import { AuthPolicyError } from "./errors";
import {
  connectLineFromIntent,
  oauthConnectCookie,
  oauthConnectCookiePath,
  prepareGoogleConnect,
  type ConnectableOAuthProvider,
} from "./oauth-connect";

function oauthConnectError(provider: ConnectableOAuthProvider, code: string) {
  return `/auth/link-account?connectProvider=${provider}&connectError=${encodeURIComponent(code)}`;
}

function clearOAuthConnectCookie(provider: ConnectableOAuthProvider) {
  try {
    cookies().set(oauthConnectCookie(provider), "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: oauthConnectCookiePath(provider),
      maxAge: 0,
    });
  } catch {
    // The database intent is one-use and short-lived. Cookie cleanup is only
    // a client-side convenience if the callback runtime does not expose a
    // mutable response cookie store.
  }
}

const nextAuth = NextAuth({
  ...edgeAuthConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email ? normalizeEmail(profile.email) : null,
          image: profile.picture,
          emailVerified: profile.email_verified ? new Date() : null,
        };
      },
    }),
    Line({
      clientId: process.env.LINE_CLIENT_ID ?? "",
      clientSecret: process.env.LINE_CLIENT_SECRET ?? "",
      authorization: { params: { scope: "openid profile" } },
    }),
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        ticket: { label: "One-time ticket", type: "text" },
      },
      async authorize(credentials) {
        const ticket = typeof credentials.ticket === "string" ? credentials.ticket : "";
        if (ticket) return consumeLoginTicket(prisma, ticket);
        const email = typeof credentials.email === "string" ? normalizeEmail(credentials.email) : "";
        const password = typeof credentials.password === "string" ? credentials.password : "";
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (user?.deletedAt) return null;
        if (!user?.passwordHash || !user.emailVerified) return null;
        return (await bcrypt.compare(password, user.passwordHash)) ? user : null;
      },
    }),
  ],
  events: {
    async linkAccount({ account, profile, user }) {
      if (account.provider !== "google" || typeof profile.email !== "string") return;
      const providerEmail = normalizeEmail(profile.email);
      const providerEmailVerified = Boolean(
        "email_verified" in profile && profile.email_verified,
      );
      await prisma.account.update({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
        data: { providerEmail },
      });

      // Auth.js creates the User before it creates the Google Account. Persist
      // Google's verified-email claim as soon as the account is linked instead
      // of relying on an extra property returned by the provider mapper.
      if (
        providerEmailVerified &&
        user.email &&
        normalizeEmail(user.email) === providerEmail
      ) {
        await prisma.user.updateMany({
          where: { id: user.id, emailVerified: null },
          data: { emailVerified: new Date() },
        });
      }
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || account.provider === "credentials") return true;

      if (account.provider === "google" || account.provider === "line") {
        const provider = account.provider;
        const connectToken = cookies().get(oauthConnectCookie(provider))?.value;
        if (connectToken) {
          clearOAuthConnectCookie(provider);
          if (provider === "line") {
            try {
              const result = await connectLineFromIntent({
                db: prisma,
                rawToken: connectToken,
                account,
              });
              const connectResult =
                result.status === "already-linked" ? "already" : "success";
              return `/dashboard/settings?connectProvider=line&connectResult=${connectResult}`;
            } catch (error) {
              if (error instanceof AuthPolicyError) {
                return oauthConnectError("line", error.code);
              }
              console.error("[auth] LINE connect callback failed", error);
              return oauthConnectError("line", "AUTH_OPERATION_FAILED");
            }
          }

          const googleEmail =
            profile && typeof profile.email === "string"
              ? normalizeEmail(profile.email)
              : user.email
                ? normalizeEmail(user.email)
                : null;
          const emailVerified = Boolean(
            profile && "email_verified" in profile && profile.email_verified,
          );
          if (!googleEmail || !emailVerified) {
            return oauthConnectError("google", "GOOGLE_EMAIL_NOT_VERIFIED");
          }
          try {
            const result = await prepareGoogleConnect({
              db: prisma,
              rawToken: connectToken,
              account,
              googleEmail,
            });
            return result.status === "already-linked"
              ? "/dashboard/settings?connectProvider=google&connectResult=already"
              : `/auth/link-account?connectProvider=google&pending=${encodeURIComponent(result.pendingId)}`;
          } catch (error) {
            if (error instanceof AuthPolicyError) {
              return oauthConnectError("google", error.code);
            }
            console.error("[auth] Google connect callback failed", error);
            return oauthConnectError("google", "AUTH_OPERATION_FAILED");
          }
        }
      }

      const linked = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
        select: {
          id: true,
          providerEmail: true,
          user: { select: { id: true, email: true, emailVerified: true, deletedAt: true } },
        },
      });
      if (linked) {
        if (linked.user.deletedAt) return false;
        if (account.provider === "google" && profile && typeof profile.email === "string") {
          const providerEmail = normalizeEmail(profile.email);
          if (linked.providerEmail !== providerEmail) {
            await prisma.account.update({
              where: { id: linked.id },
              data: { providerEmail },
            });
          }
          const providerEmailVerified = Boolean(
            profile && "email_verified" in profile && profile.email_verified,
          );
          if (
            providerEmailVerified &&
            linked.user.email &&
            normalizeEmail(linked.user.email) === providerEmail &&
            !linked.user.emailVerified
          ) {
            // Repair older Google users without treating a differently addressed
            // Google login as verification of the PetNido account email.
            await prisma.user.updateMany({
              where: { id: linked.user.id, emailVerified: null },
              data: { emailVerified: new Date() },
            });
          }
        }
        return true;
      }

      if (account.provider === "google") {
        const email =
          profile && typeof profile.email === "string"
            ? normalizeEmail(profile.email)
            : user.email
              ? normalizeEmail(user.email)
              : null;
        const emailVerified = Boolean(
          profile && "email_verified" in profile && profile.email_verified,
        );
        if (!email || !emailVerified) return false;
        const owner = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });
        if (owner) {
          const pending = await createPendingGoogleLink(prisma, {
            targetUserId: owner.id,
            account,
            providerEmail: email,
          });
          return `/auth/link-account?pending=${encodeURIComponent(pending.id)}`;
        }
        user.email = email;
        (user as typeof user & { emailVerified: Date | null }).emailVerified = new Date();
      }

      // LINE is deliberately allowed to create a user with email=null. The
      // first-use decision is enforced before onboarding/business routes.
      return true;
    },
    async jwt({ token, user, account }) {
      if (user?.id) {
        token.sub = user.id;
        token.authenticatedAt = Date.now();
        token.authenticatedProvider = account?.provider;
      }
      return token;
    },
    session({ session, token }) {
      if (!token.sub) return session;
      session.user.id = token.sub;
      session.authenticatedAt = typeof token.authenticatedAt === "number" ? token.authenticatedAt : 0;
      session.authenticatedProvider =
        typeof token.authenticatedProvider === "string"
          ? token.authenticatedProvider
          : undefined;
      return session;
    },
  },
});

export const handlers = nextAuth.handlers;
export const signIn = nextAuth.signIn;
export const signOut = nextAuth.signOut;

// All server-side callers use this wrapper, so a deleted JWT cannot continue
// to authorize tRPC, pages, or business mutations from another device.
export async function auth() {
  const session = await nextAuth.auth();
  if (!session?.user?.id) return session;
  const active = await prisma.user.findFirst({
    where: { id: session.user.id, deletedAt: null },
    select: { id: true },
  });
  return active ? session : null;
}
