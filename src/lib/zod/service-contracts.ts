import { z } from "zod";

import { mapLocationSchema, publicMapLocationSchema } from "./location";
import { currencySchema, moneyOfferSchema, priceUnitSchema } from "./money";

const petPolicySchema = z
  .object({
    petTypes: z.array(z.string().min(1).max(40)).min(1),
    sizes: z.array(z.enum(["SMALL", "MEDIUM", "LARGE", "GIANT"])),
    ageGroups: z.array(z.enum(["PUPPY_KITTEN", "ADULT", "SENIOR"])),
  })
  .strict();

const availabilitySchema = z
  .object({
    timeZone: z.string().min(1).max(100),
    weeklyDays: z.array(z.number().int().min(1).max(7)),
    includeHolidays: z.boolean(),
    ranges: z.array(
      z.object({ startsAt: z.string().datetime({ offset: true }), endsAt: z.string().datetime({ offset: true }) }).strict(),
    ),
    excludedDates: z.array(z.string().date()).max(500),
  })
  .strict();

const serviceBase = {
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(5000),
  location: mapLocationSchema,
  currency: currencySchema,
  availability: availabilitySchema,
  petPolicy: petPolicySchema,
  price: moneyOfferSchema,
  priceUnit: priceUnitSchema,
  experience: z.string().trim().min(1).max(5000),
  attachmentIds: z.array(z.string().cuid()).max(30),
  discountNote: z.string().trim().max(500).optional(),
};

export const servicePublishSchema = z.discriminatedUnion("mode", [
  z
    .object({
      mode: z.literal("HOME_VISIT"),
      ...serviceBase,
      serviceRadiusMeters: z.number().int().positive().max(200_000),
      taskCategories: z.array(z.string().min(1).max(80)).min(1),
    })
    .strict(),
  z
    .object({
      mode: z.literal("BOARDING"),
      ...serviceBase,
      maxPetCapacity: z.number().int().min(1).max(100),
      environmentAttachmentIds: z.array(z.string().cuid()).min(1).max(30),
      residentPetNotes: z.string().trim().max(2000).optional(),
      providedSupplies: z.array(z.string().trim().min(1).max(200)).max(50),
      environmentConditions: z.array(z.string().trim().min(1).max(300)).max(50),
    })
    .strict(),
  z
    .object({
      mode: z.literal("CUSTOM"),
      ...serviceBase,
      serviceRadiusMeters: z.number().int().positive().max(200_000),
      taskDescription: z.string().trim().min(1).max(3000),
    })
    .strict(),
]);

export const publicServiceSummarySchema = z
  .object({
    id: z.string().cuid(),
    providerId: z.string().cuid(),
    mode: z.enum(["HOME_VISIT", "BOARDING", "CUSTOM"]),
    title: z.string(),
    petTypes: z.array(z.string()),
    price: moneyOfferSchema,
    priceUnit: priceUnitSchema,
    location: publicMapLocationSchema,
    confirmedPetCountByDate: z.record(z.string().date(), z.number().int().nonnegative()).optional(),
  })
  .strict();

export type ServicePublish = z.infer<typeof servicePublishSchema>;
