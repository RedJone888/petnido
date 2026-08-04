import { z } from "zod";

export const localeSchema = z.enum(["zh", "en", "ja"]);
export const onboardingIntentSchema = z.enum(["POST_NEED", "OFFER_SERVICE"]);

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
});

export const onboardingIntentInputSchema = z
  .object({ intent: onboardingIntentSchema })
  .strict();

export const avatarAttachmentSchema = z
  .object({ attachmentId: z.string().cuid() })
  .strict();
