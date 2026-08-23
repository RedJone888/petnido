import { z } from "zod";
export { emailChangeConfirmSchema, emailChangeRequestSchema } from "@/modules/auth/schemas";

export const localeSchema = z.enum(["zh", "en", "ja"]);
export const onboardingIntentSchema = z.enum(["POST_NEED", "OFFER_SERVICE", "BROWSE"]);

export const profileUpdateSchema = z
  .object({
    nickname: z.string().trim().min(1).max(50),
    avatarUrl: z.string().url().max(2048).nullable().optional(),
    bio: z.string().trim().max(1000).nullable().optional(),
    preferredLocale: localeSchema,
    timeZone: z.string().trim().min(1).max(100),
  })
  .strict();

export const onboardingProfileSchema = profileUpdateSchema.pick({
  nickname: true,
  avatarUrl: true,
  preferredLocale: true,
  timeZone: true,
}).extend({
  /**
   * A new account that arrived from the need publisher has already made its
   * intent clear.  Keep this as an explicit server-validated value instead of
   * inferring intent from a return URL in the mutation.
   */
  initialIntent: z.literal("POST_NEED").optional(),
});

export const onboardingIntentInputSchema = z
  .object({ intent: onboardingIntentSchema })
  .strict();

export const preferredLocaleUpdateSchema = z
  .object({ preferredLocale: localeSchema })
  .strict();

export const preferredCurrencyUpdateSchema = z
  .object({
    preferredCurrency: z.enum([
      "JPY",
      "USD",
      "EUR",
      "CNY",
      "TWD",
      "KRW",
      "GBP",
    ]),
  })
  .strict();

export const avatarAttachmentSchema = z
  .object({ attachmentId: z.string().cuid() })
  .strict();
