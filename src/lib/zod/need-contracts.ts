import { z } from "zod";
import { petTypeCodes } from "@/modules/need-publishing/domain/pet-types";

import { mapLocationSchema, publicMapLocationSchema } from "./location";
import { feeRuleSchema, moneyOfferSchema } from "./money";

const petTypeSchema = z.enum(petTypeCodes);

export const needPetInputSchema = z.discriminatedUnion("source", [
  z.object({ source: z.literal("PROFILE"), petId: z.string().cuid() }).strict(),
  z
    .object({
      source: z.literal("NEW"),
      clientKey: z.string().uuid(),
      name: z.string().trim().min(1).max(80),
      petType: petTypeSchema,
      breed: z.string().trim().max(100).optional(),
      birthMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
      careNotes: z.string().trim().max(2000).optional(),
    })
    .strict(),
]);

const petTaskSchema = z
  .object({
    petRef: z.string().min(1).max(100),
    taskCategory: z.enum(["FEED", "WATER", "LITTER", "WALK", "MEDICATION", "GROOM", "PLAY", "OTHER"]),
    instructions: z.string().trim().min(1).max(1000),
  })
  .strict();

const needBase = {
  title: z.string().trim().min(1).max(120),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
  timeZone: z.string().min(1).max(100),
  pets: z.array(needPetInputSchema).min(1).max(20),
  location: mapLocationSchema,
  budget: moneyOfferSchema,
};

export const homeVisitNeedPublishSchema = z
  .object({
    mode: z.literal("HOME_VISIT"),
    ...needBase,
    visits: z
      .array(
        z
          .object({
            scheduledAt: z.string().datetime({ offset: true }),
            tasks: z.array(petTaskSchema).min(1).max(100),
          })
          .strict(),
      )
      .min(1)
      .max(200),
    transportFee: feeRuleSchema,
  })
  .strict();

export const boardingNeedPublishSchema = z
  .object({
    mode: z.literal("BOARDING"),
    ...needBase,
    ownerProvides: z.array(z.string().trim().min(1).max(200)).max(50),
    providerProvides: z.array(z.string().trim().min(1).max(200)).max(50),
    dailyTasks: z.array(petTaskSchema).min(1).max(100),
    scheduledTasks: z
      .array(
        z.object({ scheduledAt: z.string().datetime({ offset: true }), task: petTaskSchema }).strict(),
      )
      .max(100),
    environmentRequirements: z.array(z.string().trim().min(1).max(300)).max(50),
    unacceptableConditions: z.array(z.string().trim().min(1).max(300)).max(50),
    transport: z
      .object({
        method: z.enum(["OWNER", "PROVIDER_PICKUP", "PROVIDER_DROPOFF", "PROVIDER_BOTH", "DISCUSS"]),
        searchRadiusMeters: z.number().int().positive().max(200_000),
        fee: feeRuleSchema,
      })
      .strict(),
    suppliesFee: feeRuleSchema,
  })
  .strict();

export const customNeedPublishSchema = z
  .object({
    mode: z.literal("CUSTOM"),
    ...needBase,
    tasks: z.array(petTaskSchema).min(1).max(100),
    scheduleNote: z.string().trim().max(1000).optional(),
  })
  .strict();

export const needPublishSchema = z
  .discriminatedUnion("mode", [homeVisitNeedPublishSchema, boardingNeedPublishSchema, customNeedPublishSchema])
  .refine((value) => Date.parse(value.endsAt) > Date.parse(value.startsAt), "INVALID_TIME_RANGE");

export const publicNeedSummarySchema = z
  .object({
    id: z.string().cuid(),
    title: z.string(),
    mode: z.enum(["HOME_VISIT", "BOARDING", "CUSTOM"]),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    petTypes: z.array(petTypeSchema),
    taskCategories: z.array(z.string()),
    budget: moneyOfferSchema,
    location: publicMapLocationSchema,
  })
  .strict();

export type NeedPublish = z.infer<typeof needPublishSchema>;
