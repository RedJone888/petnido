import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

import type { NeedPublishInput } from "@/domain/publishing/contracts";
import {
  boardingTaskFingerprint,
  customTaskFingerprint,
  homeVisitTaskFingerprint,
} from "@/modules/need-publishing/domain/task-fingerprint";
import { normalizeTaskIdentity } from "@/modules/need-publishing/domain/task-catalog";

type Transaction = Prisma.TransactionClient;

function dateOnly(value: string | null) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function taskSemanticFingerprint(
  mode: NeedPublishInput["mode"],
  task: {
    petKeys: string[];
    category?: string | null;
    label: string;
    priority?: "MUST" | "NICE" | null;
    scheduleKind?:
      | "EACH_VISIT"
      | "DAILY"
      | "REPEATING"
      | "ONCE"
      | "AS_NEEDED"
      | null;
    instructions?: string | null;
  },
) {
  const category = task.category ?? "";
  const upperCategory = category.toUpperCase();
  const custom = upperCategory === "CUSTOM" || upperCategory.startsWith("CUSTOM-");
  const identity = normalizeTaskIdentity({
    category,
    label: task.label,
    custom,
  });
  if (mode === "HOME_VISIT") {
    return homeVisitTaskFingerprint({
      assignmentPetKeys: task.petKeys,
      taskName: identity.label,
      taskCode: identity.code,
      custom: identity.custom,
      priority: task.priority ?? "",
      notes: task.instructions,
    });
  }
  if (mode === "BOARDING") {
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
}

async function verifyOwnedReferences(
  tx: Transaction,
  ownerId: string,
  input: NeedPublishInput,
) {
  if (input.location.sourceLocationId) {
    const location = await tx.userLocation.findFirst({
      where: {
        id: input.location.sourceLocationId,
        userId: ownerId,
        archivedAt: null,
      },
      select: { id: true },
    });
    if (!location) {
      throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
    }
  }

  const sourcePetIds = input.pets.flatMap((pet) =>
    pet.sourcePetId ? [pet.sourcePetId] : [],
  );
  if (sourcePetIds.length) {
    const count = await tx.pet.count({
      where: { id: { in: sourcePetIds }, ownerId, archivedAt: null },
    });
    if (count !== sourcePetIds.length) {
      throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
    }
  }

  if (input.attachmentIds.length) {
    const count = await tx.attachment.count({
      where: {
        id: { in: input.attachmentIds },
        userId: ownerId,
        status: { in: [0, 1] },
      },
    });
    if (count !== input.attachmentIds.length) {
      throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
    }
  }
}

async function saveLocationDefault(
  tx: Transaction,
  ownerId: string,
  input: NeedPublishInput,
) {
  let savedLocationId = input.location.sourceLocationId ?? null;
  let locationCreated = false;
  if (!savedLocationId) {
    const existing = await tx.userLocation.findFirst({
      where: {
        userId: ownerId,
        archivedAt: null,
        lat: input.location.lat,
        lon: input.location.lon,
      },
      select: { id: true },
    });
    if (existing) {
      savedLocationId = existing.id;
    } else {
      const activeCount = await tx.userLocation.count({
        where: { userId: ownerId, archivedAt: null },
      });
      const resolvedRegionLabel =
        input.location.regionLabel?.trim() ||
        `${Number(input.location.lat).toFixed(4)}, ${Number(input.location.lon).toFixed(4)}`;
      const created = await tx.userLocation.create({
        data: {
          userId: ownerId,
          label: null,
          lat: input.location.lat,
          lon: input.location.lon,
          regionLabel: resolvedRegionLabel,
          displayPrecision: input.location.displayPrecision,
          isDefault: activeCount === 0,
        },
        select: { id: true },
      });
      savedLocationId = created.id;
      locationCreated = true;
    }
  }

  return {
    savedLocationId,
    locationCreated,
  };
}

/**
 * Apply the explicit pet-profile choice made in the Pets step before taking
 * the immutable Need snapshot. A CREATE action always makes a new profile
 * (including when the draft was copied from an existing profile); UPDATE
 * changes the owned source profile; NONE deliberately keeps this request
 * snapshot-only. The returned map is the only source used for snapshot links.
 */
async function syncPetProfiles(
  tx: Transaction,
  ownerId: string,
  pets: NeedPublishInput["pets"],
) {
  const sourceIds = new Map<string, string | null>();
  for (const pet of pets) {
    const action = pet.profileAction ?? (pet.sourcePetId ? "UPDATE" : "CREATE");
    if (action === "UPDATE") {
      if (!pet.sourcePetId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "PET_PROFILE_UPDATE_REQUIRES_SOURCE",
        });
      }
      const updated = await tx.pet.updateMany({
        where: {
          id: pet.sourcePetId,
          ownerId,
          archivedAt: null,
        },
        data: {
          name: pet.name,
          type: pet.petType,
          customType: pet.customPetType,
          quantity: pet.quantity,
          breed: pet.breed,
          birthDate: dateOnly(pet.birthDate),
          weightGrams: pet.weightGrams,
          sex: pet.sex,
          neutered: pet.neutered,
          notes: pet.careNotes,
        },
      });
      if (updated.count !== 1) {
        throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
      }
      sourceIds.set(pet.clientPetKey, pet.sourcePetId);
      continue;
    }

    if (action === "CREATE") {
      const created = await tx.pet.create({
        data: {
          ownerId,
          name: pet.name,
          type: pet.petType,
          customType: pet.customPetType,
          quantity: pet.quantity,
          breed: pet.breed,
          birthDate: dateOnly(pet.birthDate),
          weightGrams: pet.weightGrams,
          sex: pet.sex,
          neutered: pet.neutered,
          notes: pet.careNotes,
        },
        select: { id: true },
      });
      sourceIds.set(pet.clientPetKey, created.id);
      continue;
    }

    sourceIds.set(pet.clientPetKey, null);
  }
  return sourceIds;
}

export async function publishNeedV2Transaction(
  tx: Transaction,
  ownerId: string,
  input: NeedPublishInput,
  now: Date,
  options: { validationArrayEncoding?: boolean } = {},
) {
  const draft = await tx.publishDraftV2.findFirst({
    where: { id: input.draftId, ownerId },
    select: {
      id: true,
      kind: true,
      mode: true,
      schemaVersion: true,
      revision: true,
      status: true,
      publishedNeedId: true,
      editingNeedId: true,
    },
  });
  if (!draft) {
    throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
  }
  if (
    draft.status === "PUBLISHED" &&
    (draft.publishedNeedId || draft.editingNeedId)
  ) {
    return {
      needId: draft.publishedNeedId ?? draft.editingNeedId!,
      replayed: true,
      edited: Boolean(draft.editingNeedId),
    };
  }
  if (
    draft.kind !== "NEED" ||
    draft.status !== "ACTIVE" ||
    draft.schemaVersion !== input.schemaVersion ||
    draft.mode !== input.mode ||
    draft.revision !== input.revision
  ) {
    throw new TRPCError({ code: "CONFLICT", message: "DRAFT_REVISION_CONFLICT" });
  }
  if (new Date(input.endsAt) <= now) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "NEED_ALREADY_EXPIRED" });
  }

  await verifyOwnedReferences(tx, ownerId, input);

  const editTarget = draft.editingNeedId
    ? await tx.needV2.findFirst({
        where: {
          id: draft.editingNeedId,
          ownerId,
          archivedAt: null,
          state: { in: ["OPEN", "CLOSED", "MATCHED"] },
        },
        select: { id: true, locationSnapshotId: true, state: true },
      })
    : null;
  if (draft.editingNeedId && !editTarget) {
    throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
  }
  if (editTarget?.state === "MATCHED") {
    throw new TRPCError({
      code: "CONFLICT",
      message: "NEED_MATCHED_EDIT_REQUIRES_CANCEL_MATCH",
    });
  }

  const existingNeed = draft.editingNeedId
    ? null
    : await tx.needV2.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        select: {
          id: true,
          ownerId: true,
          sourceDraft: { select: { id: true } },
        },
      });
  if (existingNeed) {
    if (
      existingNeed.ownerId !== ownerId ||
      existingNeed.sourceDraft?.id !== input.draftId
    ) {
      throw new TRPCError({ code: "CONFLICT", message: "IDEMPOTENCY_KEY_REUSED" });
    }
    return { needId: existingNeed.id, replayed: true, edited: false };
  }

  const profileDefaults = await saveLocationDefault(tx, ownerId, input);
  const petSourceIds = await syncPetProfiles(tx, ownerId, input.pets);

  const commonNeedData = {
    mode: input.mode,
    description: input.description,
    scheduleNotes: input.scheduleNotes ?? null,
    startsAt: new Date(input.startsAt),
    endsAt: new Date(input.endsAt),
    timeZone: input.timeZone,
    ...(input.mode === "CUSTOM"
      ? {
          customTimePreference: input.custom.timePreference ?? null,
          customExactTime: input.custom.exactTime ?? null,
        }
      : {}),
    budgetKind: input.budget.kind,
    minAmountMinor:
      input.budget.minAmountMinor === null
        ? null
        : BigInt(input.budget.minAmountMinor),
    maxAmountMinor:
      input.budget.maxAmountMinor === null
        ? null
        : BigInt(input.budget.maxAmountMinor),
    currency: input.budget.currency,
    negotiable: input.budget.negotiable,
  };
  let need: { id: string };
  if (editTarget) {
    await tx.locationSnapshotV2.update({
      where: { id: editTarget.locationSnapshotId },
      data: {
        sourceLocationId: input.location.sourceLocationId ?? null,
        lat: input.location.lat,
        lon: input.location.lon,
        regionLabel: input.location.regionLabel ?? null,
        displayPrecision: input.location.displayPrecision,
      },
    });
    await tx.needV2Attachment.deleteMany({ where: { needId: editTarget.id } });
    await tx.needTaskV2.deleteMany({ where: { needId: editTarget.id } });
    await tx.needSupplyV2.deleteMany({ where: { needId: editTarget.id } });
    await tx.needRequirementV2.deleteMany({ where: { needId: editTarget.id } });
    await tx.needPetSnapshotV2.deleteMany({ where: { needId: editTarget.id } });
    await tx.needVisitWindowV2.deleteMany({ where: { needId: editTarget.id } });
    await tx.homeVisitNeedDetailV2.deleteMany({ where: { needId: editTarget.id } });
    await tx.boardingNeedDetailV2.deleteMany({ where: { needId: editTarget.id } });
    await tx.needAdditionalCostV2.deleteMany({ where: { needId: editTarget.id } });
    need = await tx.needV2.update({
      where: { id: editTarget.id },
      data: commonNeedData,
      select: { id: true },
    });
  } else {
    const location = await tx.locationSnapshotV2.create({
      data: {
        sourceLocationId: input.location.sourceLocationId ?? null,
        lat: input.location.lat,
        lon: input.location.lon,
        regionLabel: input.location.regionLabel ?? null,
        displayPrecision: input.location.displayPrecision,
      },
      select: { id: true },
    });
    need = await tx.needV2.create({
      data: {
        idempotencyKey: input.idempotencyKey,
        ownerId,
        state: "OPEN",
        locationSnapshotId: location.id,
        ...commonNeedData,
      },
      select: { id: true },
    });
  }

  await tx.needPetSnapshotV2.createMany({
    data: input.pets.map((pet) => ({
      needId: need.id,
      clientPetKey: pet.clientPetKey,
      sourcePetId: petSourceIds.get(pet.clientPetKey) ?? null,
      quantity: pet.quantity,
      name: pet.name,
      petType: pet.petType,
      customPetType: pet.customPetType,
      breed: pet.breed,
      birthDate: dateOnly(pet.birthDate),
      weightGrams: pet.weightGrams,
      sex: pet.sex,
      neutered: pet.neutered,
      careNotes: pet.careNotes,
    })),
  });
  const petRows = await tx.needPetSnapshotV2.findMany({
    where: { needId: need.id },
    select: { id: true, clientPetKey: true },
  });
  const petIds = new Map(petRows.map((pet) => [pet.clientPetKey, pet.id]));
  const tasks =
    input.mode === "HOME_VISIT"
      ? input.homeVisit.tasks
      : input.mode === "BOARDING"
        ? input.boarding.tasks
        : input.custom.tasks;
  for (const task of tasks) {
    const category = task.category ?? "";
    const upperCategory = category.toUpperCase();
    const custom = upperCategory === "CUSTOM" || upperCategory.startsWith("CUSTOM-");
    const identity = normalizeTaskIdentity({
      category,
      label: task.label,
      custom,
    });
    const visitOrders =
      input.mode === "HOME_VISIT"
        ? task.visitNumbers.map((visitNumber, visitIndex) => ({
            needId: need.id,
            visitNumber,
            // Older clients only sent the global task order. Keep that value
            // as a deterministic fallback while new clients provide an order
            // for every visit independently.
            order:
              task.orderByVisit?.[String(visitNumber)] ??
              task.order ??
              visitIndex,
          }))
        : [];
    await tx.needTaskV2.create({
      data: {
        needId: need.id,
        clientTaskKey: task.clientTaskKey,
        semanticFingerprint: taskSemanticFingerprint(input.mode, {
          ...task,
          category: identity.custom ? "CUSTOM" : identity.code,
          label: identity.label,
        }),
        fingerprintVersion: 1,
        category: identity.custom ? "CUSTOM" : identity.code.toUpperCase(),
        label: identity.label,
        instructions: task.instructions,
        // Persist only fields that belong to the active mode. Older clients
        // may still send generic defaults, but those defaults must never leak
        // into a boarding/custom NeedTaskV2 row.
        priority: input.mode === "HOME_VISIT" ? task.priority ?? null : null,
        scheduleKind:
          input.mode === "BOARDING" ? task.scheduleKind ?? null : null,
        visitNumbers: (options.validationArrayEncoding
          ? JSON.stringify(
              input.mode === "HOME_VISIT" ? task.visitNumbers : [],
            )
          : input.mode === "HOME_VISIT"
            ? task.visitNumbers
            : []) as never,
        // Home-visit order is scoped to each visit and is persisted in
        // HomeVisitTaskOrderV2. Never retain a misleading global default on
        // the task row; boarding/custom keep their mode-level order.
        order: input.mode === "HOME_VISIT" ? null : task.order,
        ...(visitOrders.length
          ? { visitOrders: { create: visitOrders } }
          : {}),
        petLinks: {
          create: task.petKeys.map((petKey) => ({
            pet: { connect: { id: petIds.get(petKey)! } },
          })),
        },
      },
    });
  }

  if (input.mode === "HOME_VISIT") {
    await tx.homeVisitNeedDetailV2.create({
      data: {
        needId: need.id,
        intervalDays: input.homeVisit.intervalDays,
        firstServiceDate: dateOnly(input.homeVisit.firstServiceDate)!,
        visitsPerServiceDay: input.homeVisit.visitsPerServiceDay,
      },
    });
    await tx.needVisitWindowV2.createMany({
      data: input.homeVisit.visitWindows.map((window) => ({
        needId: need.id,
        visitNumber: window.visitNumber,
        kind: window.kind,
        preferredLocalTime: window.preferredLocalTime,
      })),
    });
  }

  const requirements =
    input.mode === "BOARDING"
      ? input.boarding.requirements
      : input.mode === "CUSTOM"
        ? input.custom.requirements
        : [];
  if (input.mode === "BOARDING") {
    await tx.boardingNeedDetailV2.create({
      data: {
        needId: need.id,
        transportMode: input.boarding.transportMode,
        handoffDirection: input.boarding.handoffDirection,
        maxProviderDistanceMeters: input.boarding.maxProviderDistanceMeters,
        supplyNotes: input.boarding.supplyNotes ?? null,
      },
    });
    if (input.boarding.supplies.length) {
      await tx.needSupplyV2.createMany({
        data: input.boarding.supplies.map((supply) => ({
          needId: need.id,
          clientSupplyKey: supply.clientSupplyKey,
          petId: supply.petKey ? petIds.get(supply.petKey)! : null,
          category: supply.category,
          label: supply.label,
          providedBy: supply.providedBy,
        })),
      });
    }
  }
  if (requirements.length) {
    await tx.needRequirementV2.createMany({
      data: requirements.map((requirement) => ({
        needId: need.id,
        petId: requirement.petKey ? petIds.get(requirement.petKey)! : null,
        kind: requirement.kind,
        label: requirement.label,
      })),
    });
  }
  if (input.additionalCosts.length) {
    await tx.needAdditionalCostV2.createMany({
      data: input.additionalCosts.map((cost) => ({
        needId: need.id,
        kind: cost.kind,
        mode: cost.mode,
        amountMinor:
          cost.amountMinor === null ? null : BigInt(cost.amountMinor),
      })),
    });
  }
  if (input.attachmentIds.length) {
    await tx.needV2Attachment.createMany({
      data: input.attachmentIds.map((attachmentId, order) => ({
        needId: need.id,
        attachmentId,
        purpose: "GENERAL",
        order,
      })),
    });
    await tx.attachment.updateMany({
      where: { id: { in: input.attachmentIds }, userId: ownerId, status: 0 },
      data: { status: 1 },
    });
  }

  const finalized = await tx.publishDraftV2.updateMany({
    where: {
      id: input.draftId,
      ownerId,
      kind: "NEED",
      mode: input.mode,
      status: "ACTIVE",
      schemaVersion: input.schemaVersion,
      revision: input.revision,
    },
    data: {
      status: "PUBLISHED",
      publishedNeedId: editTarget ? undefined : need.id,
      publishedAt: now,
      lastValidatedAt: now,
    },
  });
  if (finalized.count !== 1) {
    throw new TRPCError({ code: "CONFLICT", message: "DRAFT_REVISION_CONFLICT" });
  }

  return {
    needId: need.id,
    replayed: false,
    edited: Boolean(editTarget),
    profileDefaults,
  };
}
