import { z } from "zod";

import { petTypeCodes } from "@/modules/need-publishing/domain/pet-types";
import {
  boardingTaskFingerprint,
  customTaskFingerprint,
  homeVisitTaskFingerprint,
} from "@/modules/need-publishing/domain/task-fingerprint";
import { normalizeTaskIdentity } from "@/modules/need-publishing/domain/task-catalog";

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
const visitWindowTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$|^(morning|midday|afternoon|evening|bedtime)$/i);

function isIanaTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function dateAtTimeZone(instant: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(instant));
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export const mapLocationInputSchema = z
  .object({
    sourceLocationId: z.string().min(1).optional(),
    lat: z.number().finite().min(-90).max(90),
    lon: z.number().finite().min(-180).max(180),
    label: z.string().trim().min(1).max(240).nullable().optional(),
    regionLabel: z.string().trim().min(1).max(120).nullable().optional(),
    displayPrecision: z.enum([
      "MAP_POINT",
      "NEIGHBORHOOD",
      "DISTRICT",
      "CITY",
    ]),
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

const petSnapshotObjectSchema = z
  .object({
    clientPetKey: z.string().min(1).max(80),
    sourcePetId: z.string().min(1).nullable(),
    attachmentId: z.string().min(1).nullable().default(null),
    attachmentUrl: z.string().max(2048).nullable().default(null),
    profileAction: z.enum(["CREATE", "UPDATE", "NONE"]).optional(),
    quantity: z.number().int().positive().max(100).default(1),
    name: z.string().trim().min(1).max(80),
    petType: z.enum(petTypeCodes),
    customPetType: z.string().trim().min(1).max(80).nullable().default(null),
    breed: z.string().trim().max(100).nullable(),
    birthDate: dateOnlySchema.nullable(),
    weightGrams: z.number().int().positive().nullable(),
    sex: z.enum(["FEMALE", "MALE", "UNKNOWN"]),
    neutered: z.enum(["YES", "NO", "UNKNOWN"]),
    careNotes: z.string().trim().max(4000).nullable(),
  })
  .strict();

export const petSnapshotInputSchema = petSnapshotObjectSchema.superRefine(
  (pet, ctx) => {
    if (pet.petType === "OTHER" && !pet.customPetType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customPetType"],
        message: "OTHER_PET_TYPE_REQUIRES_CUSTOM_VALUE",
      });
    }
    if (pet.petType !== "OTHER" && pet.customPetType !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customPetType"],
        message: "CANONICAL_PET_TYPE_MUST_NOT_HAVE_CUSTOM_VALUE",
      });
    }
  },
);

const taskOrderByVisitSchema = z
  .record(z.string().regex(/^[1-9]\d*$/), z.number().int().nonnegative())
  .optional();

export const needTaskInputSchema = z
  .object({
    clientTaskKey: z.string().min(1).max(80),
    category: z.string().trim().min(1).max(80),
    label: z.string().trim().min(1).max(160),
    instructions: z.string().trim().max(4000).nullable(),
    priority: z.enum(["MUST", "NICE"]).nullable().optional(),
    petKeys: z.array(z.string().min(1)).min(1),
    scheduleKind: z.enum(["EACH_VISIT", "DAILY", "REPEATING", "ONCE", "AS_NEEDED"]).nullable().optional(),
    visitNumbers: z.array(z.number().int().positive()).default([]),
    order: z.number().int().nonnegative(),
    // Home-visit display order is scoped to each visit. `order` remains as a
    // backwards-compatible fallback for older drafts and non-visit modes.
    orderByVisit: taskOrderByVisitSchema,
  })
  .strict()
  .superRefine((task, ctx) => {
    if (task.scheduleKind === "EACH_VISIT" && task.visitNumbers.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "VISIT_TASK_REQUIRES_VISIT" });
    }
  });

const needCommonShape = {
  schemaVersion: z.literal(publishSchemaVersion),
  draftId: z.string().min(1),
  revision: z.number().int().nonnegative(),
  idempotencyKey: z.string().uuid(),
  description: z.string().trim().max(4000).nullable(),
  // Notes about the requested care dates/timing. Keep this independent from
  // task instructions and mode-specific requirements.
  scheduleNotes: z.string().trim().max(2000).nullable().optional(),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
  timeZone: z.string().min(1).refine(isIanaTimeZone, "INVALID_TIME_ZONE"),
  pets: z.array(petSnapshotInputSchema).min(1).max(20),
  location: mapLocationInputSchema,
  budget: moneyInputSchema,
  additionalCosts: z.array(additionalCostInputSchema).max(2),
  attachmentIds: z.array(z.string().min(1)).max(30).default([]),
};

const visitWindowSchema = z
  .object({
    visitNumber: z.number().int().positive(),
    kind: z.enum(["FLEXIBLE", "PREFERRED"]),
    preferredLocalTime: visitWindowTimeSchema.nullable(),
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
    kind: z.enum(["ENVIRONMENT_REQUIRED", "UNACCEPTABLE", "OTHER_NEED", "WARNING", "NOTE"]),
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
      supplyNotes: z.string().trim().max(2000).nullable().optional(),
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
      requirements: z.array(requirementInputSchema).max(100),
      timePreference: z
        .enum(["FLEXIBLE", "MORNING", "MIDDAY", "AFTERNOON", "EVENING", "EXACT"])
        .nullable()
        .optional(),
      exactTime: localTimeSchema.nullable().optional(),
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
    const sourcePetIds = need.pets.flatMap((pet) =>
      pet.sourcePetId ? [pet.sourcePetId] : [],
    );
    if (new Set(sourcePetIds).size !== sourcePetIds.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "DUPLICATE_SOURCE_PET" });
    }
    for (const [index, pet] of need.pets.entries()) {
      if (pet.profileAction === "UPDATE" && !pet.sourcePetId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "PET_PROFILE_UPDATE_REQUIRES_SOURCE",
          path: ["pets", index, "profileAction"],
        });
      }
    }
    if (new Set(need.additionalCosts.map((cost) => cost.kind)).size !== need.additionalCosts.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "DUPLICATE_ADDITIONAL_COST" });
    }
    const tasks =
      need.mode === "HOME_VISIT"
        ? need.homeVisit.tasks
        : need.mode === "BOARDING"
          ? need.boarding.tasks
          : need.custom.tasks;
    if (new Set(tasks.map((task) => task.clientTaskKey)).size !== tasks.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "DUPLICATE_TASK_KEY" });
    }
    for (const task of tasks) {
      if (task.petKeys.some((key) => !petKeys.has(key))) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "TASK_PET_NOT_FOUND" });
      }
      if (need.mode === "HOME_VISIT") {
        if (!task.priority) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "HOME_TASK_REQUIRES_PRIORITY" });
        }
        if (!task.visitNumbers.length) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "HOME_TASK_REQUIRES_VISIT" });
        } else if (task.visitNumbers.some((number) => number > need.homeVisit.visitsPerServiceDay)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "TASK_VISIT_OUT_OF_RANGE" });
        }
        if (
          task.orderByVisit &&
          Object.keys(task.orderByVisit).some(
            (visit) => Number(visit) > need.homeVisit.visitsPerServiceDay,
          )
        ) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "TASK_VISIT_OUT_OF_RANGE" });
        }
      } else if (need.mode === "BOARDING") {
        if (!task.scheduleKind || task.scheduleKind === "EACH_VISIT") {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "BOARDING_TASK_REQUIRES_FREQUENCY" });
        }
      } else {
        // Older draft payloads may still carry generic priority/frequency
        // defaults. The publish transaction normalizes them away for CUSTOM;
        // they must not become a second source of identity here.
      }
    }
    const semanticFingerprints = tasks.map((task) => {
      const category = task.category ?? "";
      const upperCategory = category.toUpperCase();
      const custom =
        upperCategory === "CUSTOM" || upperCategory.startsWith("CUSTOM-");
      const identity = normalizeTaskIdentity({
        category,
        label: task.label,
        custom,
      });
      if (need.mode === "HOME_VISIT") {
        return homeVisitTaskFingerprint({
          assignmentPetKeys: task.petKeys,
          taskName: identity.label,
          taskCode: identity.code,
          custom: identity.custom,
          priority: task.priority ?? "",
          notes: task.instructions,
        });
      }
      if (need.mode === "BOARDING") {
        return boardingTaskFingerprint({
          assignmentPetKeys: task.petKeys,
          taskName: identity.label,
          taskCode: identity.code,
          custom: identity.custom,
          frequency: task.scheduleKind ?? "",
          notes: task.instructions,
        });
      }
      return customTaskFingerprint({
        assignmentPetKeys: task.petKeys,
        taskName: identity.label,
        taskCode: identity.code,
        custom: identity.custom,
        notes: task.instructions,
      });
    });
    if (new Set(semanticFingerprints).size !== semanticFingerprints.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "DUPLICATE_TASK_SEMANTIC_FINGERPRINT" });
    }
    if (need.mode === "HOME_VISIT") {
      const first = need.homeVisit.firstServiceDate;
      const start = dateAtTimeZone(need.startsAt, need.timeZone);
      const end = dateAtTimeZone(need.endsAt, need.timeZone);
      // `endsAt` is exclusive. The guided date range maps an inclusive final
      // calendar day to midnight at the start of the following local day.
      if (first < start || first >= end) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "FIRST_VISIT_OUT_OF_RANGE" });
      }
    }
    if (need.mode === "CUSTOM" && need.custom.timePreference === "EXACT") {
      if (!need.custom.exactTime) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "EXACT_TIME_REQUIRED" });
      }
    }
    const linkedInputs =
      need.mode === "BOARDING"
        ? [...need.boarding.supplies, ...need.boarding.requirements]
        : need.mode === "CUSTOM"
          ? need.custom.requirements
          : [];
    for (const linked of linkedInputs) {
      if (linked.petKey && !petKeys.has(linked.petKey)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "RELATED_PET_NOT_FOUND" });
      }
    }
    if (
      need.mode === "BOARDING" &&
      new Set(need.boarding.supplies.map((supply) => supply.clientSupplyKey)).size !==
        need.boarding.supplies.length
    ) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "DUPLICATE_SUPPLY_KEY" });
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
    if (new Set(rule.weekdays).size !== rule.weekdays.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "DUPLICATE_WEEKDAY" });
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

export const servicePublishSchema = z
  .discriminatedUnion("mode", [
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
  ])
  .superRefine((service, ctx) => {
    const exceptionDates = service.availabilityExceptions.map((item) => item.date);
    if (new Set(exceptionDates).size !== exceptionDates.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "DUPLICATE_AVAILABILITY_EXCEPTION" });
    }
    const policies = service.petPolicies.map(
      (policy) => `${policy.petType}\u0000${policy.size}\u0000${policy.ageBand}`,
    );
    if (new Set(policies).size !== policies.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "DUPLICATE_PET_POLICY" });
    }
    if (new Set(service.attachmentIds).size !== service.attachmentIds.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "DUPLICATE_ATTACHMENT" });
    }
    if (service.discounts.some((discount) => discount.kind === "PERCENT" && discount.value > 100)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "INVALID_PERCENT_DISCOUNT" });
    }
  });

const draftMoneySchema = z
  .object({
    kind: z.enum(["EXACT", "RANGE", "OPEN"]).nullable().optional(),
    minAmountMinor: nonNegativeMinorAmount.nullable().optional(),
    maxAmountMinor: nonNegativeMinorAmount.nullable().optional(),
    currency: currencySchema.nullable().optional(),
    negotiable: z.boolean().optional(),
  })
  .strict();

const draftTaskSchema = z
  .object({
    clientTaskKey: z.string().min(1).max(80),
    category: z.string().trim().max(80).optional(),
    label: z.string().trim().max(160).optional(),
    instructions: z.string().trim().max(4000).nullable().optional(),
    priority: z.enum(["MUST", "NICE"]).nullable().optional(),
    petKeys: z.array(z.string().min(1)).optional(),
    scheduleKind: z.enum(["EACH_VISIT", "DAILY", "REPEATING", "ONCE", "AS_NEEDED"]).nullable().optional(),
    visitNumbers: z.array(z.number().int().positive()).optional(),
    // Drafts saved before per-visit ordering may contain an explicit null.
    // Accept it on read and normalize it away in the legacy workspace mapper.
    order: z.number().int().nonnegative().nullable().optional(),
    orderByVisit: taskOrderByVisitSchema,
  })
  .strict();

const draftAdditionalCostSchema = z
  .object({
    kind: z.enum(["TRAVEL", "SUPPLY"]),
    mode: z.enum(["NONE", "FIXED", "ACTUAL", "DISCUSS"]).optional(),
    amountMinor: nonNegativeMinorAmount.nullable().optional(),
  })
  .strict();

const draftVisitWindowSchema = z
  .object({
    visitNumber: z.number().int().positive(),
    kind: z.enum(["FLEXIBLE", "PREFERRED"]).optional(),
    preferredLocalTime: visitWindowTimeSchema.nullable().optional(),
  })
  .strict();

export const needDraftPayloadSchema = z
  .object({
    // The publish serializer still reads the active branch fields above, but
    // drafts also carry the complete browser workspace so switching modes or
    // resuming on another device never silently discards inactive branches.
    workspace: z
      .object({
        version: z.literal(1),
        common: z.record(z.unknown()),
        draftByMode: z.record(z.record(z.unknown())),
      })
      .strict()
      .optional(),
    // Accepted only to read drafts created before derived titles were
    // removed. New serializers never write this field and published NeedV2
    // records do not persist it.
    title: z.string().trim().max(160).optional(),
    description: z.string().trim().max(4000).nullable().optional(),
    scheduleNotes: z.string().trim().max(2000).nullable().optional(),
    startsAt: z.string().datetime({ offset: true }).nullable().optional(),
    endsAt: z.string().datetime({ offset: true }).nullable().optional(),
    timeZone: z.string().refine(isIanaTimeZone, "INVALID_TIME_ZONE").nullable().optional(),
    pets: z.array(petSnapshotObjectSchema.partial()).max(20).optional(),
    location: mapLocationInputSchema.nullable().optional(),
    budget: draftMoneySchema.nullable().optional(),
    additionalCosts: z.array(draftAdditionalCostSchema).max(2).optional(),
    attachmentIds: z.array(z.string().min(1)).max(30).optional(),
    homeVisit: z
      .object({
        intervalDays: z.number().int().positive().optional(),
        firstServiceDate: dateOnlySchema.nullable().optional(),
        visitsPerServiceDay: z.number().int().min(1).max(12).optional(),
        visitWindows: z.array(draftVisitWindowSchema).max(12).optional(),
        tasks: z.array(draftTaskSchema).max(200).optional(),
      })
      .strict()
      .nullable()
      .optional(),
    boarding: z
      .object({
        tasks: z.array(draftTaskSchema).max(200).optional(),
        supplies: z.array(supplyInputSchema).max(100).optional(),
        supplyNotes: z.string().trim().max(2000).nullable().optional(),
        requirements: z.array(requirementInputSchema).max(100).optional(),
        transportMode: z.enum(["OWNER", "PROVIDER", "TAXI", "DISCUSS"]).nullable().optional(),
        handoffDirection: z.enum(["OWNER_DROPOFF", "PROVIDER_PICKUP", "SPLIT", "DISCUSS"]).nullable().optional(),
        maxProviderDistanceMeters: z.number().int().positive().max(500_000).nullable().optional(),
      })
      .strict()
      .nullable()
      .optional(),
    custom: z
      .object({
        tasks: z.array(draftTaskSchema).max(200).optional(),
        requirements: z.array(requirementInputSchema).max(100).optional(),
        timePreference: z
          .enum(["FLEXIBLE", "MORNING", "MIDDAY", "AFTERNOON", "EVENING", "EXACT"])
          .nullable()
          .optional(),
        exactTime: localTimeSchema.nullable().optional(),
      })
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
  id: z.string().min(1),
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
