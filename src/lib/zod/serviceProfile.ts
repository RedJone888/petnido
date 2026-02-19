import { Currency } from "@prisma/client";
import { z } from "zod";
export const baseLocationSchema = z.object({
  baseAreaRaw: z.string().nullable(),
  baseLat: z.number().nullable(),
  baseLon: z.number().nullable(),
  baseCurrency: z.nativeEnum(Currency).nullable(),
});
export const baseInfoSchema = baseLocationSchema.extend({
  introduction: z.string().nullable(),
  monthsExperience: z.number().int().nullable(),
});
export const serviceProfileRatingSchema = z.object({
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
});

export type BaseLocation = z.infer<typeof baseLocationSchema>;
export type BaseInfo = z.infer<typeof baseInfoSchema>;
