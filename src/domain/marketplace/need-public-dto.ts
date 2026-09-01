import type { Prisma } from "@prisma/client";
import {
  customRequirementNoteFromDraftPayload,
  isLegacyCustomRequirementNote,
} from "@/domain/publishing/requirement-notes";
import { buildNeedDisplayTitle } from "@/modules/need-publishing/domain/display-title";
import { normalizeTaskIdentity } from "@/modules/need-publishing/domain/task-catalog";

export const publicNeedV2Include = {
  sourceDraft: { select: { payloadJson: true } },
  owner: {
    select: {
      id: true,
      name: true,
      image: true,
      createdAt: true,
      profile: { select: { bio: true } },
      _count: {
        select: { needsV2: true },
      },
    },
  },
  locationSnapshot: true,
  pets: {
    orderBy: { order: "asc" as const },
    select: {
      id: true,
      order: true,
      name: true,
      petType: true,
      customPetType: true,
      quantity: true,
      breed: true,
      birthDate: true,
      weightGrams: true,
      sex: true,
      neutered: true,
      careNotes: true,
      attachments: {
        orderBy: { order: "asc" as const },
        take: 1,
        select: { attachment: { select: { url: true } } },
      },
      sourcePet: {
        select: {
          breed: true,
          birthDate: true,
          weightGrams: true,
          sex: true,
          neutered: true,
          notes: true,
        },
      },
    },
  },
  tasks: {
    orderBy: { order: "asc" as const },
    select: {
      id: true,
      category: true,
      label: true,
      instructions: true,
      priority: true,
      scheduleKind: true,
      visitNumbers: true,
      order: true,
      visitOrders: {
        orderBy: { visitNumber: "asc" as const },
      },
      petLinks: {
        select: {
          pet: {
            select: {
              id: true,
              name: true,
              petType: true,
            },
          },
        },
      },
    },
  },
  homeVisitDetail: true,
  boardingDetail: true,
  visitWindows: { orderBy: { visitNumber: "asc" as const } },
  supplies: {
    orderBy: { id: "asc" as const },
    select: {
      id: true,
      category: true,
      label: true,
      providedBy: true,
      pet: { select: { id: true, name: true, petType: true } },
    },
  },
  requirements: {
    orderBy: { id: "asc" as const },
    select: {
      id: true,
      kind: true,
      label: true,
      pet: { select: { id: true, name: true, petType: true } },
    },
  },
  additionalCosts: { orderBy: { kind: "asc" as const } },
  attachments: {
    orderBy: { order: "asc" as const },
    include: { attachment: { select: { id: true, url: true } } },
  },
} as const;

export type PublicNeedV2Source = Prisma.NeedV2GetPayload<{
  include: typeof publicNeedV2Include;
}>;

function ownerDto(owner: PublicNeedV2Source["owner"]) {
  const requestsCount = owner._count.needsV2;
  return {
    id: owner.id,
    nickname: owner.name,
    image: owner.image,
    memberSince: owner.createdAt,
    bio: owner.profile?.bio ?? null,
    requestsCount: requestsCount > 0 ? requestsCount : 1,
  };
}

export function toPublicNeedV2Dto(
  need: PublicNeedV2Source,
  distanceMeters: number | null,
) {
  const legacyCustomNote =
    need.mode === "CUSTOM"
      ? customRequirementNoteFromDraftPayload(need.sourceDraft?.payloadJson)
      : null;
  const mappedTasks = need.tasks.map((task) => ({
    id: task.id,
    ...(() => {
      const category = task.category ?? "";
      const upperCategory = category.toUpperCase();
      const custom =
        upperCategory === "CUSTOM" || upperCategory.startsWith("CUSTOM-");
      const identity = normalizeTaskIdentity({
        category,
        label: task.label,
        custom,
      });
      return {
        category: identity.custom
          ? custom
            ? "CUSTOM"
            : category
          : identity.code.toUpperCase(),
        label: identity.label,
      };
    })(),
    instructions: task.instructions ?? null,
    priority: task.priority,
    scheduleKind: task.scheduleKind,
    visitNumbers: task.visitNumbers,
    order: task.order,
    orderByVisit: Object.fromEntries(
      task.visitOrders.map((visitOrder) => [
        visitOrder.visitNumber,
        visitOrder.order,
      ]),
    ),
    pets: task.petLinks.map((link) => ({
      id: link.pet.id,
      name: link.pet.name,
      petType: link.pet.petType,
    })),
  }));

  return {
    id: need.id,
    publicId: `v2:${need.id}`,
    source: "V2" as const,
    mode: need.mode,
    state: need.state,
    updatedAt: need.updatedAt,
    title: buildNeedDisplayTitle({
      mode: need.mode,
      pets: need.pets,
      tasks: mappedTasks,
    }),
    description: need.description,
    scheduleNotes: need.scheduleNotes,
    startsAt: need.startsAt,
    endsAt: need.endsAt,
    timeZone: need.timeZone,
    location: {
      label: need.locationSnapshot.label || need.locationSnapshot.regionLabel || null,
      regionLabel: need.locationSnapshot.regionLabel || null,
      displayPrecision: need.locationSnapshot.displayPrecision,
      distanceMeters,
      mapPoint: {
        lat: Number(need.locationSnapshot.lat),
        lon: Number(need.locationSnapshot.lon),
      },
    },
    budget: {
      kind: need.budgetKind,
      minAmountMinor: need.minAmountMinor === null ? null : Number(need.minAmountMinor),
      maxAmountMinor: need.maxAmountMinor === null ? null : Number(need.maxAmountMinor),
      currency: need.currency,
      negotiable: need.negotiable,
    },
    pets: need.pets.map((pet) => ({
      id: pet.id,
      order: pet.order,
      name: pet.name,
      petType: pet.petType,
      customPetType: pet.customPetType,
      quantity: pet.quantity,
      breed: pet.breed || pet.sourcePet?.breed || null,
      birthDate: (pet.birthDate || pet.sourcePet?.birthDate)?.toISOString() || null,
      weightGrams: pet.weightGrams ?? pet.sourcePet?.weightGrams ?? null,
      sex: pet.sex || pet.sourcePet?.sex || null,
      neutered: pet.neutered || pet.sourcePet?.neutered || null,
      careNotes: pet.careNotes || pet.sourcePet?.notes || null,
      image: pet.attachments[0]?.attachment.url ?? null,
    })),
    tasks: mappedTasks,
    schedule: {
      homeVisit: need.homeVisitDetail
        ? {
            intervalDays: need.homeVisitDetail.intervalDays,
            firstServiceDate: need.homeVisitDetail.firstServiceDate,
            visitsPerServiceDay: need.homeVisitDetail.visitsPerServiceDay,
            visitWindows: need.visitWindows.map((window) => ({
              visitNumber: window.visitNumber,
              kind: window.kind,
              preferredLocalTime: window.preferredLocalTime,
            })),
          }
        : null,
      boarding: need.boardingDetail
        ? {
            transportMode: need.boardingDetail.transportMode,
            handoffDirection: need.boardingDetail.handoffDirection,
            maxProviderDistanceMeters: need.boardingDetail.maxProviderDistanceMeters,
            supplyNotes: need.boardingDetail.supplyNotes,
          }
        : null,
      custom: need.customTimePreference
        ? {
            timePreference: need.customTimePreference,
            exactTime: need.customExactTime,
          }
        : null,
    },
    supplies: need.supplies.map((supply) => ({
      id: supply.id,
      category: supply.category,
      label: supply.label,
      providedBy: supply.providedBy,
      pet: supply.pet,
    })),
    requirements: need.requirements.map((requirement) => ({
      id: requirement.id,
      kind: isLegacyCustomRequirementNote(requirement, legacyCustomNote)
        ? ("NOTE" as const)
        : requirement.kind,
      label: requirement.label,
      pet: requirement.pet,
    })),
    additionalCosts: need.additionalCosts.map((cost) => ({
      kind: cost.kind,
      mode: cost.mode,
      amountMinor: cost.amountMinor === null ? null : Number(cost.amountMinor),
    })),
    attachments: need.attachments.map((item) => ({
      id: item.attachment.id,
      url: item.attachment.url,
      purpose: item.purpose,
      order: item.order,
    })),
    owner: ownerDto(need.owner),
    createdAt: need.createdAt,
  };
}

export type PublicNeedV2Dto = ReturnType<typeof toPublicNeedV2Dto>;
export type PublicNeedItemDto = PublicNeedV2Dto;
