import { TRPCError } from "@trpc/server";

import { sendEmail } from "@/lib/email";
import { protectedProcedure, publicProcedure, router } from "@/server/trpc/trpc";
import {
  deleteAccountSchema,
  emailChangeConfirmSchema,
  emailChangeRequestSchema,
  lineLinkConfirmSchema,
  lineLinkRequestSchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
  passwordResetVerifySchema,
  passwordSetupConfirmSchema,
  passwordSetupRequestSchema,
  passwordSetupVerifySchema,
  pendingOAuthConfirmSchema,
  pendingOAuthSchema,
  stepEmailSchema,
  stepSignupCodeSchema,
  stepVerifySchema,
  unlinkProviderSchema,
} from "../schemas";
import {
  completeLineAsNewAccount,
  deleteAccount,
  getAccountOverview,
  unlinkOAuthProvider,
} from "../server/account-service";
import { AuthPolicyError } from "../server/errors";
import { buildCodeMail, type AuthMailLocale } from "../server/mail";
import { getPendingGoogleLink } from "../server/oauth-link";
import { confirmGoogleConnect } from "../server/oauth-connect";
import { consumeFixedWindowLimit } from "../server/rate-limit";
import {
  checkEmailExists,
  confirmGoogleLink,
  confirmLineLink,
  confirmPasswordReset,
  confirmPasswordSetup,
  issueEmailChangeChallenge,
  issueGoogleLinkChallenge,
  issueLineLinkChallenge,
  issuePasswordResetChallenge,
  issuePasswordSetupChallenge,
  issueSignupChallenge,
  verifyEmailChangeChallenge,
  verifyPasswordResetChallenge,
  verifyPasswordSetupChallenge,
  verifySignupChallenge,
} from "../server/verification";

function authError(error: unknown): never {
  if (error instanceof TRPCError) throw error;
  if (error instanceof AuthPolicyError) {
    const conflict = [
      "EMAIL_ALREADY_REGISTERED",
      "PROVIDER_ALREADY_LINKED",
      "ACCOUNT_HAS_ACTIVE_OBLIGATIONS",
      "LAST_SIGN_IN_METHOD",
      "GOOGLE_ACCOUNT_IN_USE",
      "GOOGLE_EMAIL_IN_USE",
    ].includes(error.code);
    throw new TRPCError({
      code:
        error.code === "VERIFICATION_RATE_LIMITED"
          ? "TOO_MANY_REQUESTS"
          : conflict
            ? "CONFLICT"
            : error.code === "USER_NOT_FOUND"
              ? "NOT_FOUND"
              : error.code === "INVALID_CREDENTIALS"
                ? "UNAUTHORIZED"
                : error.code === "REAUTH_REQUIRED"
                  ? "UNAUTHORIZED"
                : "BAD_REQUEST",
      message: error.code === "VERIFICATION_RATE_LIMITED" ? "RATE_LIMITED" : error.code,
      cause: error,
    });
  }
  console.error("[auth] operation failed", error);
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AUTH_OPERATION_FAILED", cause: error });
}

async function localeForUser(db: Parameters<typeof getAccountOverview>[0], userId: string): Promise<AuthMailLocale> {
  const profile = await db.profile.findUnique({ where: { userId }, select: { preferredLocale: true } });
  return profile?.preferredLocale === "zh" || profile?.preferredLocale === "en" ? profile.preferredLocale : "ja";
}

function deliverCode(to: string, locale: AuthMailLocale, kind: Parameters<typeof buildCodeMail>[1]) {
  return async (code: string) => {
    const mail = buildCodeMail(locale, kind, code);
    await sendEmail({ to, subject: mail.subject, html: mail.html });
  };
}

export const authRouter = router({
  checkEmailExist: publicProcedure.input(stepEmailSchema).mutation(async ({ ctx, input }) => {
    try {
      await consumeFixedWindowLimit(ctx.prisma, {
        action: "email-check",
        kind: "ip",
        subject: ctx.requestIp,
        limit: 30,
        windowMs: 60 * 60 * 1000,
        now: new Date(),
      });
      return { exists: await checkEmailExists(ctx.prisma, input.email) };
    } catch (error) {
      return authError(error);
    }
  }),

  sendVerificationCode: publicProcedure.input(stepSignupCodeSchema).mutation(async ({ ctx, input }) => {
    try {
      return await issueSignupChallenge({
        db: ctx.prisma,
        email: input.email,
        requestIp: ctx.requestIp,
        deliver: deliverCode(input.email, "ja", "SIGN_UP"),
      });
    } catch (error) {
      return authError(error);
    }
  }),

  verifyCode: publicProcedure.input(stepVerifySchema).mutation(async ({ ctx, input }) => {
    try {
      const user = await verifySignupChallenge({ db: ctx.prisma, requestIp: ctx.requestIp, ...input });
      return { email: user.email };
    } catch (error) {
      return authError(error);
    }
  }),

  requestPasswordReset: publicProcedure.input(passwordResetRequestSchema).mutation(async ({ ctx, input }) => {
    try {
      return await issuePasswordResetChallenge({
        db: ctx.prisma,
        email: input.email,
        requestIp: ctx.requestIp,
        deliver: deliverCode(input.email, "ja", "PASSWORD_RESET"),
      });
    } catch (error) {
      return authError(error);
    }
  }),

  confirmPasswordReset: publicProcedure.input(passwordResetConfirmSchema).mutation(async ({ ctx, input }) => {
    try {
      return await confirmPasswordReset({ db: ctx.prisma, requestIp: ctx.requestIp, ...input });
    } catch (error) {
      return authError(error);
    }
  }),

  verifyPasswordResetCode: publicProcedure.input(passwordResetVerifySchema).mutation(async ({ ctx, input }) => {
    try {
      return await verifyPasswordResetChallenge({
        db: ctx.prisma,
        requestIp: ctx.requestIp,
        ...input,
      });
    } catch (error) {
      return authError(error);
    }
  }),

  requestPasswordSetup: protectedProcedure.input(passwordSetupRequestSchema).mutation(async ({ ctx }) => {
    try {
      const account = await getAccountOverview(ctx.prisma, ctx.session.user.id);
      if (!account.email) throw new AuthPolicyError("EMAIL_REQUIRED");
      const locale = await localeForUser(ctx.prisma, ctx.session.user.id);
      return await issuePasswordSetupChallenge({
        db: ctx.prisma,
        userId: ctx.session.user.id,
        requestIp: ctx.requestIp,
        deliver: deliverCode(account.email, locale, "PASSWORD_SETUP"),
      });
    } catch (error) {
      return authError(error);
    }
  }),

  confirmPasswordSetup: protectedProcedure.input(passwordSetupConfirmSchema).mutation(async ({ ctx, input }) => {
    try {
      return await confirmPasswordSetup({
        db: ctx.prisma,
        userId: ctx.session.user.id,
        requestIp: ctx.requestIp,
        ...input,
      });
    } catch (error) {
      return authError(error);
    }
  }),

  verifyPasswordSetupCode: protectedProcedure.input(passwordSetupVerifySchema).mutation(async ({ ctx, input }) => {
    try {
      return await verifyPasswordSetupChallenge({
        db: ctx.prisma,
        userId: ctx.session.user.id,
        requestIp: ctx.requestIp,
        ...input,
      });
    } catch (error) {
      return authError(error);
    }
  }),

  requestEmailChange: protectedProcedure.input(emailChangeRequestSchema).mutation(async ({ ctx, input }) => {
    try {
      const locale = await localeForUser(ctx.prisma, ctx.session.user.id);
      return await issueEmailChangeChallenge({
        db: ctx.prisma,
        userId: ctx.session.user.id,
        email: input.email,
        requestIp: ctx.requestIp,
        deliver: deliverCode(input.email, locale, "EMAIL_CHANGE"),
      });
    } catch (error) {
      return authError(error);
    }
  }),

  confirmEmailChange: protectedProcedure.input(emailChangeConfirmSchema).mutation(async ({ ctx, input }) => {
    try {
      return await verifyEmailChangeChallenge({
        db: ctx.prisma,
        userId: ctx.session.user.id,
        requestIp: ctx.requestIp,
        ...input,
      });
    } catch (error) {
      return authError(error);
    }
  }),

  getAccountOverview: protectedProcedure.query(({ ctx }) => getAccountOverview(ctx.prisma, ctx.session.user.id)),

  unlinkProvider: protectedProcedure.input(unlinkProviderSchema).mutation(async ({ ctx, input }) => {
    try {
      return await unlinkOAuthProvider(ctx.prisma, {
        userId: ctx.session.user.id,
        provider: input.provider,
        password: input.password,
        authenticatedAt:
          "authenticatedAt" in ctx.session ? ctx.session.authenticatedAt : undefined,
        authenticatedProvider:
          "authenticatedProvider" in ctx.session
            ? ctx.session.authenticatedProvider
            : undefined,
      });
    } catch (error) {
      return authError(error);
    }
  }),

  getPendingGoogleLink: publicProcedure.input(pendingOAuthSchema).query(async ({ ctx, input }) => {
    try {
      const pending = await getPendingGoogleLink(ctx.prisma, input.pendingId);
      if (!pending.requiresEmailCode) {
        if (ctx.session?.user?.id !== pending.targetUserId || !pending.providerEmail) {
          throw new AuthPolicyError("OAUTH_CONNECT_EXPIRED");
        }
        return {
          flow: "connect" as const,
          provider: "google" as const,
          currentEmail: pending.targetUser.email,
          providerEmail: pending.providerEmail,
        };
      }
      const [local, domain] = pending.targetUser.email!.split("@");
      return {
        flow: "email_verification" as const,
        provider: "google" as const,
        maskedEmail: `${local.slice(0, 2)}***@${domain}`,
      };
    } catch (error) {
      return authError(error);
    }
  }),

  requestGoogleLink: publicProcedure.input(pendingOAuthSchema).mutation(async ({ ctx, input }) => {
    try {
      const pending = await getPendingGoogleLink(ctx.prisma, input.pendingId);
      const locale = await localeForUser(ctx.prisma, pending.targetUserId);
      return await issueGoogleLinkChallenge({
        db: ctx.prisma,
        pendingId: input.pendingId,
        requestIp: ctx.requestIp,
        deliver: deliverCode(pending.targetUser.email!, locale, "ACCOUNT_LINK"),
      });
    } catch (error) {
      return authError(error);
    }
  }),

  confirmGoogleLink: publicProcedure.input(pendingOAuthConfirmSchema).mutation(async ({ ctx, input }) => {
    try {
      return await confirmGoogleLink({ db: ctx.prisma, requestIp: ctx.requestIp, ...input });
    } catch (error) {
      return authError(error);
    }
  }),

  confirmGoogleConnect: protectedProcedure.input(pendingOAuthSchema).mutation(async ({ ctx, input }) => {
    try {
      return await confirmGoogleConnect({
        db: ctx.prisma,
        pendingId: input.pendingId,
        userId: ctx.session.user.id,
      });
    } catch (error) {
      return authError(error);
    }
  }),

  requestLineLink: protectedProcedure.input(lineLinkRequestSchema).mutation(async ({ ctx, input }) => {
    try {
      return await issueLineLinkChallenge({
        db: ctx.prisma,
        sourceUserId: ctx.session.user.id,
        email: input.email,
        requestIp: ctx.requestIp,
        deliver: deliverCode(input.email, "ja", "ACCOUNT_LINK"),
      });
    } catch (error) {
      return authError(error);
    }
  }),

  confirmLineLink: protectedProcedure.input(lineLinkConfirmSchema).mutation(async ({ ctx, input }) => {
    try {
      return await confirmLineLink({
        db: ctx.prisma,
        sourceUserId: ctx.session.user.id,
        requestIp: ctx.requestIp,
        ...input,
      });
    } catch (error) {
      return authError(error);
    }
  }),

  completeLineAsNewAccount: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      return await completeLineAsNewAccount(ctx.prisma, ctx.session.user.id);
    } catch (error) {
      return authError(error);
    }
  }),

  deleteAccount: protectedProcedure.input(deleteAccountSchema).mutation(async ({ ctx, input }) => {
    try {
      return await deleteAccount(ctx.prisma, {
        userId: ctx.session.user.id,
        password: input.password,
        authenticatedAt:
          "authenticatedAt" in ctx.session ? ctx.session.authenticatedAt : undefined,
      });
    } catch (error) {
      return authError(error);
    }
  }),
});
