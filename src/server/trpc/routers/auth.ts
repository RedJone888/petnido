import { TRPCError } from "@trpc/server";

import { sendEmail } from "@/lib/email";
import {
  stepEmailSchema,
  stepSignupCodeSchema,
  stepVerifySchema,
} from "@/lib/zod/auth";
import { consumeFixedWindowLimit } from "@/server/domains/auth/rate-limit";
import {
  issueSignupChallenge,
  verifySignupChallenge,
} from "@/server/domains/auth/email-verification";
import { VerificationPolicyError } from "@/server/domains/auth/verification-policy";
import { publicProcedure, router } from "@/server/trpc/trpc";

function verificationError(error: unknown): TRPCError {
  if (error instanceof TRPCError) return error;
  if (error instanceof VerificationPolicyError) {
    const code =
      error.code === "VERIFICATION_RATE_LIMITED"
        ? "TOO_MANY_REQUESTS"
        : error.code === "EMAIL_ALREADY_REGISTERED"
          ? "CONFLICT"
          : "BAD_REQUEST";
    return new TRPCError({
      code,
      message:
        error.code === "VERIFICATION_RATE_LIMITED"
          ? "RATE_LIMITED"
          : error.code,
      cause: error,
    });
  }
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "AUTH_OPERATION_FAILED",
    cause: error,
  });
}

export const authRouter = router({
  checkEmailExist: publicProcedure
    .input(stepEmailSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const now = new Date();
        await consumeFixedWindowLimit(ctx.prisma, {
          action: "email-check",
          kind: "ip",
          subject: ctx.requestIp,
          limit: 30,
          windowMs: 60 * 60 * 1000,
          now,
        });
        const user = await ctx.prisma.user.findUnique({
          where: { email: input.email },
          select: { id: true },
        });
        return { exists: !!user };
      } catch (error) {
        throw verificationError(error);
      }
    }),

  sendVerificationCode: publicProcedure
    .input(stepSignupCodeSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await issueSignupChallenge({
          db: ctx.prisma,
          email: input.email,
          requestIp: ctx.requestIp,
          deliver: async (code) => {
            try {
              await sendEmail({
                to: input.email,
                subject: "PetNido 会員登録コード",
                html: `
                  <div style="font-family:Arial; font-size:14px; color:#333">
                    <p>こんにちは。</p>
                    <p>PetNido へのご登録ありがとうございます。</p>
                    <p>以下の認証コードを入力してください：</p>
                    <h2 style="font-size:28px; letter-spacing:4px;">${code}</h2>
                    <p>10分以内にご入力ください。</p>
                    <p>この手続きを行っていない場合は、本メールを破棄してください。</p>
                  </div>`,
              });
            } catch (error) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "DEPENDENCY_UNAVAILABLE",
                cause: error,
              });
            }
          },
        });
      } catch (error) {
        throw verificationError(error);
      }
    }),

  verifyCode: publicProcedure
    .input(stepVerifySchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await verifySignupChallenge({
          db: ctx.prisma,
          email: input.email,
          username: input.username,
          password: input.password,
          code: input.code,
          requestIp: ctx.requestIp,
        });
        return { email: user.email };
      } catch (error) {
        throw verificationError(error);
      }
    }),
});
