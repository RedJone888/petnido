import { z } from "zod";

export const authEmailSchema = z
  .string()
  .trim()
  .min(1)
  .email()
  .max(254)
  .transform((value) => value.toLowerCase());

export const authPasswordSchema = z
  .string()
  .min(8)
  .max(72)
  .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/);

export const authCurrentPasswordSchema = z.string().min(1).max(72);

export const authCodeSchema = z.string().regex(/^\d{6}$/);
export const authNameSchema = z.string().trim().min(1).max(50);

export const stepEmailSchema = z.object({ email: authEmailSchema }).strict();
export const stepSignupCodeSchema = z
  .object({ email: authEmailSchema, username: authNameSchema })
  .strict();
export const stepSignupLinkSchema = z
  .object({ email: authEmailSchema, password: authPasswordSchema, username: authNameSchema })
  .strict();
export const stepVerifySchema = z
  .object({
    email: authEmailSchema,
    password: authPasswordSchema,
    username: authNameSchema,
    code: authCodeSchema,
  })
  .strict();
export const stepLoginSchema = z
  .object({ email: authEmailSchema, password: authPasswordSchema })
  .strict();

export const emailChangeRequestSchema = z.object({ email: authEmailSchema }).strict();
export const emailChangeConfirmSchema = z
  .object({ email: authEmailSchema, code: authCodeSchema })
  .strict();
export const passwordResetRequestSchema = z.object({ email: authEmailSchema }).strict();
export const passwordResetVerifySchema = z
  .object({ email: authEmailSchema, code: authCodeSchema })
  .strict();
export const passwordResetConfirmSchema = z
  .object({ email: authEmailSchema, code: authCodeSchema, password: authPasswordSchema })
  .strict();
export const passwordSetupRequestSchema = z.object({}).strict();
export const passwordSetupVerifySchema = z.object({ code: authCodeSchema }).strict();
export const passwordSetupConfirmSchema = z
  .object({ code: authCodeSchema, password: authPasswordSchema })
  .strict();
export const pendingOAuthSchema = z.object({ pendingId: z.string().cuid() }).strict();
export const pendingOAuthConfirmSchema = pendingOAuthSchema.extend({ code: authCodeSchema });
export const lineLinkRequestSchema = z.object({ email: authEmailSchema }).strict();
export const lineLinkConfirmSchema = lineLinkRequestSchema.extend({ code: authCodeSchema });
export const unlinkProviderSchema = z
  .object({
    provider: z.enum(["google", "line"]),
    password: z.string().min(1).max(72).optional(),
  })
  .strict();
export const deleteAccountSchema = z
  .object({ confirmation: z.literal("DELETE"), password: z.string().max(72).optional() })
  .strict();

export type StepType = "select" | "email" | "login" | "signup" | "verify";
