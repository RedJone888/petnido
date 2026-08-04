import { z } from "zod";

export const publishSchemaVersion = 1 as const;

export const publishingModeSchema = z.enum([
  "HOME_VISIT",
  "BOARDING",
  "CUSTOM",
]);
export const currencySchema = z.enum([
  "JPY",
  "USD",
  "EUR",
  "CNY",
  "TWD",
  "KRW",
  "GBP",
]);

const nonNegativeMinorAmount = z.number().int().safe().nonnegative();
const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const localTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

function isIanaTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export const mapLocationInputSchema = z
  .object({
    sourceLocationId: z.string().min(1).optional(),
    lat: z.number().finite().min(-90).max(90),
    lon: z.number().finite().min(-180).max(180),
    regionLabel: z.string().trim().min(1).max(120).nullable().optional(),
    displayPrecision: z.enum(["MAP_POINT", "DISTRICT", "CITY"]),
  })
  .strict();

export const moneyInputSchema = z
  .object({
    kind: z.enum(["EXACT", "RANGE", "OPEN"]),
    minAmountMinor: nonNegativeMinorAmount.nullable(),
    maxAmountMinor: nonNegativeMinorAmount.nullable(),
    currency: currencySchema,
    negotiable: z.boolean().default(false),
  })
  .strict()
  .superRefine((money, ctx) => {
    if (money.kind === "EXACT") {
      if (money.minAmountMinor === null || money.maxAmountMinor !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "EXACT_REQUIRES_ONE_AMOUNT",
        });
      }
    }
    if (money.kind === "RANGE") {
      if (
        money.minAmountMinor === null ||
        money.maxAmountMinor === null ||
        money.minAmountMinor > money.maxAmountMinor
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "INVALID_MONEY_RANGE",
        });
      }
    }
    if (
      money.kind === "OPEN" &&
      (money.minAmountMinor !== null || money.maxAmountMinor !== null)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "OPEN_PRICE_MUST_NOT_HAVE_AMOUNT",
      });
    }
  });

export const additionalCostInputSchema = z
  .object({
    kind: z.enum(["TRAVEL", "SUPPLY"]),
    mode: z.enum(["NONE", "FIXED", "ACTUAL", "DISCUSS"]),
    amountMinor: nonNegativeMinorAmount.nullable(),
  })
  .strict()
  .superRefine((cost, ctx) => {
    if (cost.mode === "FIXED" && cost.amountMinor === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "FIXED_COST_REQUIRES_AMOUNT",
      });
    }
    if (cost.mode !== "FIXED" && cost.amountMinor !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "NON_FIXED_COST_MUST_NOT_HAVE_AMOUNT",
      });
    }
  });

export const petSnapshotInputSchema = z
  .object({
    clientPetKey: z.string().min(1).max(80),
    sourcePetId: z.string().min(1).nullable(),
    name: z.string().trim().min(1).max(80),
    petType: z.string().trim().min(1).max(40),
    breed: z.string().trim().max(100).nullable(),
    birthDate: dateOnlySchema.nullable(),
    weightGrams: z.number().int().positive().nullable(),
    sex: z.enum(["FEMALE", "MALE", "UNKNOWN"]),
    neutered: z.enum(["YES", "NO", "UNKNOWN"]),
    careNotes: z.string().trim().max(4000).nullable(),
  })
  .strict();

export const needTaskInputSchema = z
  .object({
    clientTaskKey: z.string().min(1).max(80),
    category: z.string().trim().min(1).max(80),
    label: z.string().trim().min(1).max(160),
    instructions: z.string().trim().max(4000).nullable(),
    priority: z.enum(["MUST", "NICE"]),
    petKeys: z.array(z.string().min(1)).min(1),
    scheduleKind: z.enum(["EACH_VISIT", "DAILY", "REPEATING", "ONCE", "AS_NEEDED"]),
    visitNumbers: z.array(z.number().int().positive()).default([]),
    localTimes: z.array(localTimeSchema).default([]),
    intervalDays: z.number().int().positive().nullable(),
    dueDate: dateOnlySchema.nullable(),
    trigger: z.string().trim().min(1).max(500).nullable(),
    order: z.number().int().nonnegative(),
  })
  .strict()
  .superRefine((task, ctx) => {
    if (task.scheduleKind === "EACH_VISIT" && task.visitNumbers.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "VISIT_TASK_REQUIRES_VISIT" });
    }
    if (task.scheduleKind === "REPEATING" && task.intervalDays === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "REPEATING_TASK_REQUIRES_INTERVAL" });
    }
    if (task.scheduleKind === "ONCE" && task.dueDate === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ONCE_TASK_REQUIRES_DATE" });
    }
    if (task.scheduleKind === "AS_NEEDED" && task.trigger === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "AS_NEEDED_TASK_REQUIRES_TRIGGER" });
    }
  });

const needCommonShape = {
  schemaVersion: z.literal(publishSchemaVersion),
  draftId: z.string().min(1),
  revision: z.number().int().nonnegative(),
  idempotencyKey: z.string().uuid(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000).nullable(),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
  timeZone: z.string().min(1).refine(isIanaTimeZone, "INVALID_TIME_ZONE"),
  pets: z.array(petSnapshotInputSchema).min(1).max(20),
  location: mapLocationInputSchema,
  budget: moneyInputSchema,
  additionalCosts: z.array(additionalCostInputSchema).max(2),
};

const visitWindowSchema = z
  .object({
    visitNumber: z.number().int().positive(),
    kind: z.enum(["FLEXIBLE", "PREFERRED"]),
    preferredLocalTime: localTimeSchema.nullable(),
  })
  .strict()
  .superRefine((window, ctx) => {
    if (window.kind === "PREFERRED" && window.preferredLocalTime === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "PREFERRED_VISIT_REQUIRES_TIME" });
    }
    if (window.kind === "FLEXIBLE" && window.preferredLocalTime !== null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "FLEXIBLE_VISIT_MUST_NOT_HAVE_TIME" });
    }
  });

const homeVisitNeedPublishSchema = z.object({
  ...needCommonShape,
  mode: z.literal("HOME_VISIT"),
  homeVisit: z
    .object({
      intervalDays: z.number().int().positive(),
      firstServiceDate: dateOnlySchema,
      excludedDates: z.array(dateOnlySchema),
      visitsPerServiceDay: z.number().int().min(1).max(12),
      visitWindows: z.array(visitWindowSchema).min(1).max(12),
      tasks: z.array(needTaskInputSchema).min(1).max(200),
    })
    .strict(),
}).strict();

const supplyInputSchema = z
  .object({
    clientSupplyKey: z.string().min(1).max(80),
    petKey: z.string().min(1).nullable(),
    category: z.enum(["FOOD", "STAY", "TRAVEL", "OTHER"]),
    label: z.string().trim().min(1).max(160),
    providedBy: z.enum(["OWNER", "PROVIDER", "NOT_NEEDED"]),
  })
  .strict();

const requirementInputSchema = z
  .object({
    kind: z.enum(["ENVIRONMENT_REQUIRED", "UNACCEPTABLE", "OTHER_NEED", "WARNING"]),
    label: z.string().trim().min(1).max(500),
    petKey: z.string().min(1).nullable(),
  })
  .strict();

const boardingNeedPublishSchema = z.object({
  ...needCommonShape,
  mode: z.literal("BOARDING"),
  boarding: z
    .object({
      tasks: z.array(needTaskInputSchema).min(1).max(200),
      supplies: z.array(supplyInputSchema).max(100),
      requirements: z.array(requirementInputSchema).max(100),
      transportMode: z.enum(["OWNER", "PROVIDER", "TAXI", "DISCUSS"]),
      handoffDirection: z.enum(["OWNER_DROPOFF", "PROVIDER_PICKUP", "SPLIT", "DISCUSS"]),
      maxProviderDistanceMeters: z.number().int().positive().max(500_000).nullable(),
    })
    .strict(),
}).strict();

const customNeedPublishSchema = z.object({
  ...needCommonShape,
  mode: z.literal("CUSTOM"),
  custom: z
    .object({
      tasks: z.array(needTaskInputSchema).min(1).max(200),
    })
    .strict(),
}).strict();

export const needPublishSchema = z
  .discriminatedUnion("mode", [
    homeVisitNeedPublishSchema,
    boardingNeedPublishSchema,
    customNeedPublishSchema,
  ])
  .superRefine((need, ctx) => {
    if (new Date(need.startsAt) >= new Date(need.endsAt)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "INVALID_DATE_RANGE" });
    }
    const petKeys = new Set(need.pets.map((pet) => pet.clientPetKey));
    if (petKeys.size !== need.pets.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "DUPLICATE_PET_KEY" });
    }
    const tasks =
      need.mode === "HOME_VISIT"
        ? need.homeVisit.tasks
        : need.mode === "BOARDING"
          ? need.boarding.tasks
          : need.custom.tasks;
    for (const task of tasks) {
      if (task.petKeys.some((key) => !petKeys.has(key))) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "TASK_PET_NOT_FOUND" });
      }
      if (
        need.mode === "HOME_VISIT" &&
        task.visitNumbers.some((number) => number > need.homeVisit.visitsPerServiceDay)
      ) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "TASK_VISIT_OUT_OF_RANGE" });
      }
    }
  });

const availabilityRuleSchema = z
  .object({
    kind: z.enum(["WEEKLY", "DATE_RANGE"]),
    weekdays: z.array(z.number().int().min(1).max(7)).default([]),
    startsOn: dateOnlySchema.nullable(),
    endsOn: dateOnlySchema.nullable(),
    includesHolidays: z.boolean(),
  })
  .strict()
  .superRefine((rule, ctx) => {
    if (rule.kind === "WEEKLY" && rule.weekdays.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "WEEKLY_RULE_REQUIRES_DAYS" });
    }
    if (rule.kind === "DATE_RANGE" && (!rule.startsOn || !rule.endsOn)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "DATE_RANGE_REQUIRES_BOUNDS" });
    }
    if (rule.startsOn && rule.endsOn && rule.startsOn > rule.endsOn) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "INVALID_AVAILABILITY_RANGE" });
    }
  });

const petPolicySchema = z
  .object({
    petType: z.string().trim().min(1).max(40),
    size: z.enum(["TINY", "SMALL", "MEDIUM", "LARGE", "GIANT", "ANY"]),
    ageBand: z.enum(["YOUNG", "ADULT", "SENIOR", "ANY"]),
    accepted: z.boolean(),
    notes: z.string().trim().max(1000).nullable(),
  })
  .strict();

const serviceCommonShape = {
  schemaVersion: z.literal(publishSchemaVersion),
  draftId: z.string().min(1),
  revision: z.number().int().nonnegative(),
  idempotencyKey: z.string().uuid(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000).nullable(),
  timeZone: z.string().min(1).refine(isIanaTimeZone, "INVALID_TIME_ZONE"),
  location: mapLocationInputSchema,
  currency: currencySchema,
  availabilityRules: z.array(availabilityRuleSchema).min(1).max(100),
  availabilityExceptions: z.array(
    z.object({ date: dateOnlySchema, available: z.boolean(), note: z.string().max(500).nullable() }).strict(),
  ),
  petPolicies: z.array(petPolicySchema).min(1).max(100),
  offerings: z.array(
    z.object({ category: z.string().min(1).max(80), label: z.string().min(1).max(160), description: z.string().max(2000).nullable() }).strict(),
  ).min(1).max(100),
  priceRules: z.array(
    z.object({ label: z.string().min(1).max(160), unit: z.enum(["HOUR", "VISIT", "DAY", "FIXED"]), amountMinor: nonNegativeMinorAmount }).strict(),
  ).min(1).max(100),
  discounts: z.array(
    z.object({ label: z.string().min(1).max(160), kind: z.enum(["FIXED", "PERCENT"]), value: z.number().int().positive(), condition: z.string().max(500).nullable() }).strict(),
  ).max(50),
  attachmentIds: z.array(z.string().min(1)).max(30),
};

export const servicePublishSchema = z.discriminatedUnion("mode", [
  z.object({
    ...serviceCommonShape,
    mode: z.literal("HOME_VISIT"),
    homeVisit: z.object({ serviceRadiusMeters: z.number().int().positive().max(500_000) }).strict(),
  }).strict(),
  z.object({
    ...serviceCommonShape,
    mode: z.literal("BOARDING"),
    boarding: z
      .object({
        maxPetCapacity: z.number().int().positive().max(100),
        environmentDescription: z.string().trim().min(1).max(4000),
        residentPetNotes: z.string().trim().max(2000).nullable(),
        suppliedItems: z.array(z.string().trim().min(1).max(160)).max(100),
      })
      .strict(),
  }).strict(),
  z.object({
    ...serviceCommonShape,
    mode: z.literal("CUSTOM"),
    custom: z.object({ serviceRadiusMeters: z.number().int().positive().max(500_000).nullable() }).strict(),
  }).strict(),
]);

const draftMoneySchema = z
  .object({
    kind: z.enum(["EXACT", "RANGE", "OPEN"]).nullable().optional(),
    minAmountMinor: nonNegativeMinorAmount.nullable().optional(),
    maxAmountMinor: nonNegativeMinorAmount.nullable().optional(),
    currency: currencySchema.nullable().optional(),
    negotiable: z.boolean().optional(),
  })
  .strict();

export const needDraftPayloadSchema = z
  .object({
    title: z.string().trim().max(160).optional(),
    description: z.string().trim().max(4000).nullable().optional(),
    startsAt: z.string().datetime({ offset: true }).nullable().optional(),
    endsAt: z.string().datetime({ offset: true }).nullable().optional(),
    timeZone: z.string().refine(isIanaTimeZone, "INVALID_TIME_ZONE").nullable().optional(),
    pets: z.array(petSnapshotInputSchema.partial()).max(20).optional(),
    location: mapLocationInputSchema.nullable().optional(),
    budget: draftMoneySchema.nullable().optional(),
    additionalCosts: z.array(additionalCostInputSchema).max(2).optional(),
    homeVisit: z
      .object({
        intervalDays: z.number().int().positive().optional(),
        firstServiceDate: dateOnlySchema.nullable().optional(),
        excludedDates: z.array(dateOnlySchema).optional(),
        visitsPerServiceDay: z.number().int().min(1).max(12).optional(),
        visitWindows: z.array(visitWindowSchema).max(12).optional(),
        tasks: z.array(needTaskInputSchema).max(200).optional(),
      })
      .strict()
      .nullable()
      .optional(),
    boarding: z
      .object({
        tasks: z.array(needTaskInputSchema).max(200).optional(),
        supplies: z.array(supplyInputSchema).max(100).optional(),
        requirements: z.array(requirementInputSchema).max(100).optional(),
        transportMode: z.enum(["OWNER", "PROVIDER", "TAXI", "DISCUSS"]).nullable().optional(),
        handoffDirection: z.enum(["OWNER_DROPOFF", "PROVIDER_PICKUP", "SPLIT", "DISCUSS"]).nullable().optional(),
        maxProviderDistanceMeters: z.number().int().positive().max(500_000).nullable().optional(),
      })
      .strict()
      .nullable()
      .optional(),
    custom: z
      .object({ tasks: z.array(needTaskInputSchema).max(200).optional() })
      .strict()
      .nullable()
      .optional(),
  })
  .strict();

export const serviceDraftPayloadSchema = z
  .object({
    title: z.string().trim().max(160).optional(),
    description: z.string().trim().max(4000).nullable().optional(),
    timeZone: z.string().refine(isIanaTimeZone, "INVALID_TIME_ZONE").nullable().optional(),
    location: mapLocationInputSchema.nullable().optional(),
    currency: currencySchema.nullable().optional(),
    availabilityRules: z.array(availabilityRuleSchema).max(100).optional(),
    availabilityExceptions: z.array(
      z.object({ date: dateOnlySchema, available: z.boolean(), note: z.string().max(500).nullable() }).strict(),
    ).optional(),
    petPolicies: z.array(petPolicySchema).max(100).optional(),
    offerings: z.array(
      z.object({ category: z.string().min(1).max(80), label: z.string().min(1).max(160), description: z.string().max(2000).nullable() }).strict(),
    ).optional(),
    priceRules: z.array(
      z.object({ label: z.string().min(1).max(160), unit: z.enum(["HOUR", "VISIT", "DAY", "FIXED"]), amountMinor: nonNegativeMinorAmount }).strict(),
    ).optional(),
    discounts: z.array(
      z.object({ label: z.string().min(1).max(160), kind: z.enum(["FIXED", "PERCENT"]), value: z.number().int().positive(), condition: z.string().max(500).nullable() }).strict(),
    ).optional(),
    attachmentIds: z.array(z.string().min(1)).max(30).optional(),
    homeVisit: z.object({ serviceRadiusMeters: z.number().int().positive().max(500_000).optional() }).strict().nullable().optional(),
    boarding: z
      .object({
        maxPetCapacity: z.number().int().positive().max(100).optional(),
        environmentDescription: z.string().trim().max(4000).optional(),
        residentPetNotes: z.string().trim().max(2000).nullable().optional(),
        suppliedItems: z.array(z.string().trim().min(1).max(160)).max(100).optional(),
      })
      .strict()
      .nullable()
      .optional(),
    custom: z.object({ serviceRadiusMeters: z.number().int().positive().max(500_000).nullable().optional() }).strict().nullable().optional(),
  })
  .strict();

const draftEnvelopeShape = {
  id: z.string().min(1),
  ownerId: z.string().min(1),
  mode: publishingModeSchema.nullable(),
  schemaVersion: z.literal(publishSchemaVersion),
  revision: z.number().int().nonnegative(),
  currentStep: z.string().min(1).max(80),
  status: z.enum(["ACTIVE", "PUBLISHED", "ABANDONED"]),
};

export const publishDraftEnvelopeSchema = z.discriminatedUnion("kind", [
  z.object({ ...draftEnvelopeShape, kind: z.literal("NEED"), payload: needDraftPayloadSchema }).strict(),
  z.object({ ...draftEnvelopeShape, kind: z.literal("SERVICE"), payload: serviceDraftPayloadSchema }).strict(),
]);

const publishDraftCommandShape = {
  id: z.string().uuid(),
  mode: publishingModeSchema.nullable(),
  currentStep: z.string().min(1).max(80),
};

export const publishDraftCreateSchema = z.discriminatedUnion("kind", [
  z.object({
    ...publishDraftCommandShape,
    kind: z.literal("NEED"),
    payload: needDraftPayloadSchema,
  }).strict(),
  z.object({
    ...publishDraftCommandShape,
    kind: z.literal("SERVICE"),
    payload: serviceDraftPayloadSchema,
  }).strict(),
]);

export const publishDraftSaveSchema = z.discriminatedUnion("kind", [
  z.object({
    ...publishDraftCommandShape,
    kind: z.literal("NEED"),
    expectedRevision: z.number().int().nonnegative(),
    payload: needDraftPayloadSchema,
  }).strict(),
  z.object({
    ...publishDraftCommandShape,
    kind: z.literal("SERVICE"),
    expectedRevision: z.number().int().nonnegative(),
    payload: serviceDraftPayloadSchema,
  }).strict(),
]);

export type NeedPublishInput = z.infer<typeof needPublishSchema>;
export type ServicePublishInput = z.infer<typeof servicePublishSchema>;
export type PublishDraftEnvelope = z.infer<typeof publishDraftEnvelopeSchema>;
export type PublishDraftCreateInput = z.infer<typeof publishDraftCreateSchema>;
export type PublishDraftSaveInput = z.infer<typeof publishDraftSaveSchema>;
