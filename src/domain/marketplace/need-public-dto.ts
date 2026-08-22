import type { Prisma } from "@prisma/client";

export const publicNeedV2Include = {
  owner: {
    select: {
      id: true,
      name: true,
      image: true,
      createdAt: true,
      profile: { select: { bio: true } },
      _count: {
        select: {
          needs: true,
          needsV2: true,
        },
      },
    },
  },
  locationSnapshot: true,
  pets: {
    orderBy: { id: "asc" as const },
    select: {
      name: true,
      petType: true,
      quantity: true,
      breed: true,
      birthDate: true,
      weightGrams: true,
      sex: true,
      neutered: true,
      careNotes: true,
      sourcePet: {
        select: {
          breed: true,
          birthDate: true,
          weightGrams: true,
          sex: true,
          neutered: true,
          notes: true,
          photos: {
            where: { status: 1 },
            orderBy: { order: "asc" as const },
            take: 1,
            select: { url: true },
          },
        },
      },
    },
  },
  tasks: {
    orderBy: { order: "asc" as const },
    select: {
      category: true,
      label: true,
      instructions: true,
      priority: true,
      scheduleKind: true,
      visitNumbers: true,
      petLinks: {
        select: {
          pet: {
            select: {
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
  dateExceptions: { orderBy: { date: "asc" as const } },
  supplies: {
    orderBy: { id: "asc" as const },
    select: { category: true, label: true, providedBy: true },
  },
  requirements: {
    orderBy: { id: "asc" as const },
    select: { kind: true, label: true },
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

export const publicLegacyNeedSelect = {
  id: true,
  title: true,
  category: true,
  requirement: true,
  startDate: true,
  endDate: true,
  frequencyType: true,
  customDays: true,
  customTimes: true,
  addressLat: true,
  addressLon: true,
  currency: true,
  fosterRange: true,
  transportMethod: true,
  status: true,
  archivedAt: true,
  totalPrice: true,
  createdAt: true,
  owner: {
    select: {
      id: true,
      name: true,
      image: true,
      createdAt: true,
      profile: { select: { bio: true } },
      _count: {
        select: {
          needs: true,
          needsV2: true,
        },
      },
    },
  },
  photos: {
    where: { status: 1 },
    orderBy: { order: "asc" as const },
    select: { id: true, url: true },
  },
  needPets: {
    orderBy: { id: "asc" as const },
    select: {
      petCategory: true,
      petType: true,
      count: true,
      tags: true,
      photos: {
        where: { status: 1 },
        orderBy: { order: "asc" as const },
        take: 1,
        select: { url: true },
      },
    },
  },
} as const;

export type PublicLegacyNeedSource = Prisma.NeedGetPayload<{
  select: typeof publicLegacyNeedSelect;
}>;

function ownerDto(owner: PublicNeedV2Source["owner"] | PublicLegacyNeedSource["owner"]) {
  const countObj = (owner as { _count?: { needs?: number; needsV2?: number } })._count;
  const requestsCount = (countObj?.needs ?? 0) + (countObj?.needsV2 ?? 0);
  return {
    id: owner.id,
    nickname: owner.name,
    image: owner.image,
    memberSince: owner.createdAt,
    bio: owner.profile?.bio ?? null,
    requestsCount: requestsCount > 0 ? requestsCount : 1,
  };
}

function legacyAmountMinor(amount: number, currency: string) {
  return Math.round(amount * (currency === "JPY" || currency === "KRW" ? 1 : 100));
}

export function toPublicNeedV2Dto(
  need: PublicNeedV2Source,
  distanceMeters: number | null,
  regionLabelOverride?: string | null,
) {
  return {
    publicId: `v2:${need.id}`,
    source: "V2" as const,
    mode: need.mode,
    title: need.title,
    description: need.description,
    startsAt: need.startsAt,
    endsAt: need.endsAt,
    timeZone: need.timeZone,
    location: {
      regionLabel: need.locationSnapshot.regionLabel || regionLabelOverride || null,
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
      name: pet.name,
      petType: pet.petType,
      quantity: pet.quantity,
      breed: pet.breed || pet.sourcePet?.breed || null,
      birthDate: (pet.birthDate || pet.sourcePet?.birthDate)?.toISOString() || null,
      weightGrams: pet.weightGrams ?? pet.sourcePet?.weightGrams ?? null,
      sex: pet.sex || pet.sourcePet?.sex || null,
      neutered: pet.neutered || pet.sourcePet?.neutered || null,
      careNotes: pet.careNotes || pet.sourcePet?.notes || null,
      image: pet.sourcePet?.photos[0]?.url ?? null,
    })),
    tasks: need.tasks.map((task) => ({
      category: task.category,
      label: task.label,
      instructions: task.instructions ?? null,
      priority: task.priority,
      scheduleKind: task.scheduleKind,
      visitNumbers: task.visitNumbers,
      pets: task.petLinks.map((link) => ({
        name: link.pet.name,
        petType: link.pet.petType,
      })),
    })),
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
            excludedDates: need.dateExceptions.map((item) => item.date),
          }
        : null,
      boarding: need.boardingDetail
        ? {
            transportMode: need.boardingDetail.transportMode,
            handoffDirection: need.boardingDetail.handoffDirection,
            maxProviderDistanceMeters: need.boardingDetail.maxProviderDistanceMeters,
          }
        : null,
      custom: need.customTimePreference
        ? {
            timePreference: need.customTimePreference,
            exactTime: need.customExactTime,
          }
        : null,
    },
    supplies: need.supplies,
    requirements: need.requirements,
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

export function toPublicLegacyNeedDto(
  need: PublicLegacyNeedSource,
  distanceMeters: number | null,
) {
  const mode = need.category === "VISIT" ? "HOME_VISIT" : need.category === "FOSTER" ? "BOARDING" : "CUSTOM";
  return {
    publicId: `legacy:${need.id}`,
    source: "LEGACY" as const,
    mode,
    title: need.title,
    description: need.requirement,
    startsAt: need.startDate,
    endsAt: need.endDate,
    timeZone: null,
    location: {
      regionLabel: null,
      displayPrecision: "MAP_POINT",
      distanceMeters,
      mapPoint: { lat: need.addressLat, lon: need.addressLon },
    },
    budget: {
      kind: "EXACT" as const,
      minAmountMinor: legacyAmountMinor(need.totalPrice, need.currency),
      maxAmountMinor: null,
      currency: need.currency,
      negotiable: false,
    },
    pets: need.needPets.map((pet) => ({
      name: null,
      petType: pet.petType || pet.petCategory,
      quantity: pet.count,
      breed: null,
      birthDate: null,
      weightGrams: null,
      sex: null,
      neutered: null,
      careNotes: null,
      image: pet.photos[0]?.url ?? null,
    })),
    tasks: need.needPets.flatMap((pet) => pet.tags).map((tag) => ({
      category: tag,
      label: tag,
      instructions: null,
      priority: mode === "HOME_VISIT" ? ("MUST" as const) : null,
      scheduleKind: mode === "BOARDING" ? ("DAILY" as const) : null,
      visitNumbers: [],
      pets: [],
    })),
    schedule: {
      homeVisit: need.category === "VISIT"
        ? {
            intervalDays: need.customDays ?? null,
            firstServiceDate: need.startDate,
            visitsPerServiceDay: need.customTimes ?? null,
            visitWindows: [],
            excludedDates: [],
          }
        : null,
      boarding: need.category === "FOSTER"
        ? {
            transportMode: need.transportMethod,
            handoffDirection: null,
            maxProviderDistanceMeters: null,
          }
        : null,
    },
    supplies: [],
    requirements: [],
    additionalCosts: [],
    attachments: need.photos.map((attachment, order) => ({
      id: attachment.id,
      url: attachment.url,
      purpose: "GENERAL",
      order,
    })),
    owner: ownerDto(need.owner),
    createdAt: need.createdAt,
  };
}

export type PublicNeedV2Dto = ReturnType<typeof toPublicNeedV2Dto>;
export type PublicLegacyNeedDto = ReturnType<typeof toPublicLegacyNeedDto>;
export type PublicNeedItemDto = PublicNeedV2Dto | PublicLegacyNeedDto;
