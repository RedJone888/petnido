"use client";

import { useLanguage } from "@/components/providers/language-provider";
import type { ImageItem } from "@/domain/attachment/type";
import { formatDateSpan } from "@/domain/date/presentation";
import { buildPublicNeedTitle } from "@/domain/marketplace/need-title";
import { formatMoneyAmount } from "@/domain/money/presentation";
import {
  countBoardingSupplyArrangements,
  type BoardingSupplyOption,
  type BoardingSupplyPlan,
  type BoardingTaskConfig,
  type BudgetDraft,
  type CareType,
  type LocationDraft,
  type PetDraft,
  type ScreenId,
  type SupplyCostMode,
  type TaskPlan,
} from "@/domain/publishing/legacy-need-draft-v3";
import {
  formatHomeVisitFrequency,
  groupAdjacentSupplies,
} from "@/modules/need-display/client/_utils/presentation-formatters";
import { buildNeedOverview } from "@/modules/need-display/domain";
import { getNeedDisplayMessages } from "@/modules/need-display/i18n";
import { useNeedPublishingMessages } from "@/modules/need-publishing/client";
import { visitIntervalDays } from "@/modules/need-publishing/domain/draft-pricing-input";
import { normalizePetTypeSelection } from "@/modules/need-publishing/domain/pet-types";
import {
  formatNeedPricingFormula,
  type NeedPricingSummary,
} from "@/modules/need-publishing/domain/pricing";
import {
  boardingNights,
  buildVisitDates,
  dateSpanDays,
  distanceLabel,
  isPetProfileComplete,
  petDisplayType,
} from "../guided-need-flow-shared";

export function useNeedPreviewModel({
  careType,
  pets,
  dates,
  tasks,
  boardingRoutines,
  boardingSupplies,
  boardingSupplyItems,
  boardingSupplyNotes,
  supplyCostMode,
  taskNotes,
  homeFitNotes,
  requirementsNotes,
  location,
  distance,
  transport,
  splitDirection,
  budget,
  pricing,
  tags,
  customRequirements,
  customCautions,
  visitFrequency,
  customInterval,
  firstVisitDate,
  visitsPerDay,
  visitTimes,
  exactTimes,
  validation,
  supportingImages,
  onEditStep,
}: {
  careType: CareType;
  pets: PetDraft[];
  dates: {
    startDate: string;
    endDate: string;
    notes: string;
    timeOfDay?: string;
    exactTime?: string;
  };
  tasks: TaskPlan[];
  boardingRoutines: BoardingTaskConfig[];
  boardingSupplies: BoardingSupplyPlan;
  boardingSupplyItems: BoardingSupplyOption[];
  boardingSupplyNotes: string;
  supplyCostMode: SupplyCostMode;
  taskNotes: string;
  homeFitNotes: string;
  requirementsNotes: string;
  location: LocationDraft;
  distance: string;
  transport: string;
  splitDirection: "owner-dropoff" | "sitter-dropoff";
  budget: BudgetDraft;
  pricing: NeedPricingSummary;
  tags: string[];
  customRequirements: string[];
  customCautions: string[];
  visitFrequency: string;
  customInterval: number;
  firstVisitDate: string;
  visitsPerDay: number;
  visitTimes: string[];
  exactTimes: string[];
  validation: {
    pets: boolean;
    dates: boolean;
    tasks: boolean;
    area: boolean;
    budget: boolean;
  };
  supportingImages: ImageItem[];
  onBeforeOpenDetail?: () => void;
  onEditStep?: (stepId: ScreenId) => void;
}) {
  const { t, lang } = useLanguage();
  const needMessages = useNeedPublishingMessages();
  const displayCopy = getNeedDisplayMessages(lang);
  const copy = needMessages.needPublishingAdvanced.preview;
  const flowCopy = needMessages.needPublishing;

  const modeCode: "HOME_VISIT" | "BOARDING" | "CUSTOM" =
    careType === "visit"
      ? "HOME_VISIT"
      : careType === "boarding"
        ? "BOARDING"
        : "CUSTOM";
  const fullLocationLabel =
    location.label?.trim() || location.regionLabel?.trim() || copy.areaNotAdded;
  const regionLabel = location.regionLabel?.trim() || copy.areaNotAdded;

  const totalDays = dateSpanDays(dates);
  const nightsTotal = boardingNights(dates);
  const totalVisitsCount =
    buildVisitDates({
      dates,
      visitFrequency,
      customInterval,
      firstVisitDate,
    }).length * visitsPerDay;

  const intervalDays = visitIntervalDays(visitFrequency, customInterval);

  const homeVisitFrequencyLabel = formatHomeVisitFrequency(
    intervalDays,
    visitsPerDay,
    lang,
  );

  const dateRangeLabel = dates.startDate
    ? formatDateSpan(dates.startDate, dates.endDate || dates.startDate, lang)
    : "";

  // Map Pet drafts into standard DTO format for components
  const displayPets = pets.map((pet) => {
    const normalizedType = normalizePetTypeSelection(
      pet.typeCode ?? pet.type,
      pet.otherType,
    );
    return {
      id: pet.id,
      name: pet.name?.trim() || null,
      petType: normalizedType.petType,
      quantity: pet.quantity || 1,
      breed: pet.breed || null,
      birthDate: pet.birthDate || null,
      weightGrams: pet.weight
        ? Math.round(Number(pet.weight) * (pet.weightUnit === "kg" ? 1000 : 1))
        : null,
      sex: pet.sex || null,
      neutered: pet.neutered || null,
      careNotes: pet.notes?.trim() || null,
      image: pet.photo || null,
      customPetType: normalizedType.customPetType,
    };
  });

  const petTypeGroups = displayPets.reduce<
    Array<{ petType: string; pets: typeof displayPets }>
  >((groups, pet) => {
    const existing = groups.find((g) => g.petType === pet.petType);
    if (existing) existing.pets.push(pet);
    else groups.push({ petType: pet.petType, pets: [pet] });
    return groups;
  }, []);

  // Title generation: directly using buildPublicNeedTitle to match public-need-detail.tsx 100%
  const displayTitle = buildPublicNeedTitle(
    {
      mode: modeCode,
      pets: displayPets as any,
      location: { regionLabel },
    } as any,
    lang,
  );

  const ownerSupplyCount = countBoardingSupplyArrangements(
    pets,
    boardingSupplyItems,
    boardingSupplies,
    "owner",
  );
  const sitterSupplyCount = countBoardingSupplyArrangements(
    pets,
    boardingSupplyItems,
    boardingSupplies,
    "sitter",
  );
  const ownerSupplyItems = boardingSupplyItems.filter(
    (item) => boardingSupplies[item.key] === "owner",
  );
  const sitterSupplyItems = boardingSupplyItems.filter(
    (item) => boardingSupplies[item.key] === "sitter",
  );

  const incompletePetLabels = pets.flatMap((pet, index) =>
    !isPetProfileComplete(pet)
      ? [pet.name || petDisplayType(pet) || `Pet ${index + 1}`]
      : [],
  );

  const homeMustHaveTags =
    careType === "boarding"
      ? tags.filter((tag) => !tag.startsWith("Avoid: "))
      : [];
  const homeAvoidTags =
    careType === "boarding"
      ? tags
          .filter((tag) => tag.startsWith("Avoid: "))
          .map((tag) => tag.slice(7))
      : [];

  // Map Tasks into standard DTO format for PetGroupTaskDirectLayout
  const displayTasks: Array<{
    category: string;
    label: string;
    instructions: string | null;
    priority: string;
    scheduleKind: string;
    visitNumbers?: number[];
    orderByVisit?: Record<number, number>;
    pets: Array<{ name: string | null; petType: string }>;
  }> =
    careType === "boarding"
      ? boardingRoutines.flatMap((config) =>
          config.routines.map((routine) => {
            const matchedPets = displayPets.filter(
              (p) => routine.petIds.includes(p.id) || displayPets.length === 1,
            );
            return {
              category: config.custom
                ? "CUSTOM"
                : (config.templateId ?? "CARE"),
              label: config.label,
              instructions: routine.instructions?.trim() || null,
              priority: routine.priority === "must" ? "MUST" : "NICE",
              scheduleKind: routine.scheduleType
                .toUpperCase()
                .replaceAll("-", "_"),
              pets: matchedPets.map((p) => ({
                name: p.name,
                petType: p.petType,
              })),
            };
          }),
        )
      : tasks.map((task) => ({
          category: task.custom ? "CUSTOM" : (task.templateId ?? "CARE"),
          label: task.label,
          instructions: task.notes?.trim() || null,
          priority: task.priority === "must" ? "MUST" : "NICE",
          scheduleKind: careType === "visit" ? "EACH_VISIT" : "CUSTOM",
          visitNumbers:
            task.visitNumbers && task.visitNumbers.length > 0
              ? task.visitNumbers
              : Array.from({ length: visitsPerDay }, (_, i) => i + 1),
          orderByVisit: task.orderByVisit,
          pets: displayPets
            .filter((p) => task.petIds.includes(p.id))
            .map((p) => ({ name: p.name, petType: p.petType })),
        }));

  // Map Supplies into standard DTO format for groupAdjacentSupplies
  const displaySupplies = [
    ...ownerSupplyItems.map((item) => {
      const matchedPet = displayPets.find((p) => p.id === item.petId);
      return {
        id: item.key,
        label: item.label,
        category: item.category ?? displayCopy.supplies,
        providedBy: "OWNER" as const,
        pet: matchedPet
          ? {
              id: matchedPet.id,
              name: matchedPet.name,
              petType: matchedPet.petType,
              image: matchedPet.image,
            }
          : null,
      };
    }),
    ...sitterSupplyItems.map((item) => {
      const matchedPet = displayPets.find((p) => p.id === item.petId);
      return {
        id: item.key,
        label: item.label,
        category: item.category ?? displayCopy.supplies,
        providedBy: "PROVIDER" as const,
        pet: matchedPet
          ? {
              id: matchedPet.id,
              name: matchedPet.name,
              petType: matchedPet.petType,
              image: matchedPet.image,
            }
          : null,
      };
    }),
  ];
  const supplyGroups = groupAdjacentSupplies(displaySupplies, displayPets);

  // Map Requirements into standard DTO format
  const displayRequirements =
    careType === "boarding"
      ? [
          ...homeMustHaveTags.map((tag) => ({
            kind: "ENVIRONMENT_REQUIRED",
            label: tag,
          })),
          ...homeAvoidTags.map((tag) => ({
            kind: "UNACCEPTABLE",
            label: tag,
          })),
          ...customRequirements.map((req) => ({
            kind: "OTHER_NEED",
            label: req,
          })),
          ...customCautions.map((caution) => ({
            kind: "WARNING",
            label: caution,
          })),
        ]
      : [
          ...customRequirements.map((req) => ({
            kind: "OTHER_NEED",
            label: req,
          })),
          ...customCautions.map((caution) => ({
            kind: "WARNING",
            label: caution,
          })),
        ];

  // Calendar Item DTO matching NeedActionSidebar expectations
  const calendarItem = {
    mode: modeCode,
    startsAt: dates.startDate || new Date().toISOString().slice(0, 10),
    endsAt:
      dates.endDate || dates.startDate || new Date().toISOString().slice(0, 10),
    // Preview dates are still the inclusive calendar dates selected by the user.
    source: "PREVIEW" as const,
    schedule: {
      homeVisit:
        careType === "visit"
          ? {
              intervalDays,
              visitsPerServiceDay: visitsPerDay,
              visitWindows: Array.from({ length: visitsPerDay }, (_, i) => ({
                kind:
                  !visitTimes[i] || visitTimes[i] === "flexible"
                    ? "FLEXIBLE"
                    : "PREFERRED",
                preferredLocalTime:
                  visitTimes[i] === "exact"
                    ? exactTimes[i]
                    : visitTimes[i] === "flexible" || !visitTimes[i]
                      ? null
                      : visitTimes[i],
              })),
            }
          : null,
      boarding:
        careType === "boarding"
          ? {
              maxProviderDistanceMeters: (() => {
                if (!distance || distance === "No preference") return null;
                const match = distance.match(/(\d+(?:\.\d+)?)/);
                return match ? Math.round(parseFloat(match[1]) * 1000) : null;
              })(),
              transportMode:
                transport === "owner"
                  ? "OWNER"
                  : transport === "sitter"
                    ? "PROVIDER"
                    : transport === "taxi"
                      ? "TAXI"
                      : "DISCUSS",
              supplyNotes: boardingSupplyNotes || null,
            }
          : null,
      custom:
        careType === "custom"
          ? {
              timePreference: dates.timeOfDay || "flexible",
              exactTime: dates.exactTime || null,
            }
          : null,
    },
  } as any;

  // Visit windows
  const visitWindows = Array.from({ length: visitsPerDay }, (_, i) => ({
    kind:
      !visitTimes[i] || visitTimes[i] === "flexible" ? "FLEXIBLE" : "PREFERRED",
    preferredLocalTime:
      visitTimes[i] === "exact"
        ? exactTimes[i]
        : visitTimes[i] === "flexible" || !visitTimes[i]
          ? null
          : visitTimes[i],
  }));

  // Overview Story Paragraph
  const storyOverview = buildNeedOverview(
    {
      mode: modeCode as any,
      pets: displayPets as any,
      tasks: displayTasks as any,
      location: { regionLabel } as any,
    } as any,
    lang,
    {
      intervalDays,
      visitsPerDay,
      distanceLabel: distance ? distanceLabel(distance) : null,
      ownerSupplyLabels: ownerSupplyItems.map((s) => s.label),
      sitterSupplyLabels: sitterSupplyItems.map((s) => s.label),
      timeLabel:
        dates.timeOfDay === "exact" && dates.exactTime
          ? dates.exactTime
          : dates.timeOfDay
            ? (flowCopy.timeOptions[
                dates.timeOfDay as keyof typeof flowCopy.timeOptions
              ] ?? dates.timeOfDay)
            : null,
    },
  );

  // Exact pricing & breakdown calculation from NeedActionSidebar
  const isCareOpen = pricing.budgetKind === "OPEN";
  const isCareRange = pricing.budgetKind === "RANGE";
  const careUnitRateMin = pricing.unitRateMinor;
  const careUnitRateMax = pricing.unitMaxRateMinor;

  const travelMode = pricing.travelMode;
  const isTravelActual = travelMode === "ACTUAL";
  const isTravelFixed =
    travelMode === "FIXED" && (pricing.fixedTravelPerVisitMinor ?? 0) > 0;
  const travelUnit = pricing.fixedTravelPerVisitMinor ?? 0;

  let bigPriceText = "";
  let bigPriceSubLabel: string | null = null;
  let formulaText: string | null = null;
  let statusNoteText: string | null = null;

  if (modeCode === "HOME_VISIT") {
    if (isCareOpen) {
      if (isTravelFixed && travelUnit > 0) {
        const travelTotal = travelUnit * totalVisitsCount;
        bigPriceText = formatMoneyAmount(travelTotal, pricing.currency);
        bigPriceSubLabel = displayCopy.estimatedTotal;
      } else {
        bigPriceText = displayCopy.discuss;
        bigPriceSubLabel = null;
      }
    } else if (isCareRange && careUnitRateMax) {
      const minTotal =
        pricing.estimatedTotalMinMinor ??
        ((careUnitRateMin ?? 0) + (isTravelFixed ? travelUnit : 0)) *
          totalVisitsCount;
      const maxTotal =
        pricing.estimatedTotalMaxMinor ??
        ((careUnitRateMax ?? 0) + (isTravelFixed ? travelUnit : 0)) *
          totalVisitsCount;
      bigPriceText = `${formatMoneyAmount(minTotal, pricing.currency)} – ${formatMoneyAmount(maxTotal, pricing.currency)}`;
      bigPriceSubLabel = displayCopy.estimatedTotal;
    } else {
      const exactTotal =
        pricing.estimatedTotalMinMinor ??
        ((careUnitRateMin ?? 0) + (isTravelFixed ? travelUnit : 0)) *
          totalVisitsCount;
      bigPriceText = formatMoneyAmount(exactTotal, pricing.currency);
      bigPriceSubLabel = displayCopy.estimatedTotal;
    }

    if (!isTravelActual && !isCareOpen) {
      formulaText = isTravelFixed
        ? displayCopy.formulaCareAndTravelTimesVisits
        : displayCopy.formulaCareTimesVisits;
      statusNoteText = null;
    } else if (isTravelActual && !isCareOpen) {
      formulaText = displayCopy.formulaCareTimesVisits;
      statusNoteText = displayCopy.excludesTravel;
    } else if (!isTravelActual && isCareOpen) {
      if (isTravelFixed) {
        formulaText = displayCopy.formulaTravelTimesVisits;
        statusNoteText = displayCopy.excludesCare;
      } else {
        formulaText = null;
        statusNoteText = null;
      }
    } else if (isTravelActual && isCareOpen) {
      formulaText = null;
      statusNoteText = displayCopy.excludesTravel;
    }
  } else if (modeCode === "BOARDING") {
    if (isCareOpen) {
      bigPriceText = displayCopy.discuss;
      bigPriceSubLabel = null;
    } else if (isCareRange && careUnitRateMax) {
      bigPriceText = `${formatMoneyAmount(pricing.estimatedTotalMinMinor ?? 0, pricing.currency)} – ${formatMoneyAmount(pricing.estimatedTotalMaxMinor ?? 0, pricing.currency)}`;
      bigPriceSubLabel = displayCopy.estimatedTotal;
      formulaText = displayCopy.formulaNightlyTimesNights;
    } else {
      bigPriceText = formatMoneyAmount(
        pricing.estimatedTotalMinMinor ?? 0,
        pricing.currency,
      );
      bigPriceSubLabel = displayCopy.estimatedTotal;
      formulaText = displayCopy.formulaNightlyTimesNights;
    }
  } else {
    bigPriceText =
      pricing.budgetKind === "OPEN"
        ? displayCopy.discuss
        : pricing.budgetKind === "RANGE" && pricing.estimatedTotalMaxMinor
          ? `${formatMoneyAmount(pricing.estimatedTotalMinMinor ?? 0, pricing.currency)} – ${formatMoneyAmount(pricing.estimatedTotalMaxMinor, pricing.currency)}`
          : formatMoneyAmount(
              pricing.estimatedTotalMinMinor ?? 0,
              pricing.currency,
            );
    bigPriceSubLabel =
      pricing.budgetKind === "OPEN" ? null : displayCopy.estimatedTotal;
  }

  formulaText =
    pricing.budgetKind === "OPEN" && bigPriceSubLabel === null
      ? null
      : formatNeedPricingFormula(pricing, lang);

  const careUnitPriceDisplay =
    pricing.budgetKind === "OPEN"
      ? displayCopy.discuss
      : pricing.budgetKind === "RANGE" && pricing.unitMaxRateMinor
        ? `${formatMoneyAmount(pricing.unitRateMinor ?? 0, pricing.currency)} – ${formatMoneyAmount(pricing.unitMaxRateMinor, pricing.currency)}`
        : `${formatMoneyAmount(pricing.unitRateMinor ?? 0, pricing.currency)}`;

  const travelFeeDisplay =
    travelMode === "FIXED" && travelUnit > 0
      ? `${formatMoneyAmount(travelUnit, pricing.currency)}`
      : travelMode === "ACTUAL"
        ? displayCopy.actualCost
        : displayCopy.none;

  const minorAmountForCurrency = (value: string, currency: string) => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) return 0;
    const decimals = currency === "JPY" || currency === "KRW" ? 0 : 2;
    return Math.round(amount * 10 ** decimals);
  };

  const boardingTransportApplies =
    careType === "boarding" &&
    (transport === "sitter" || transport === "split");

  const transportCostValueText = !boardingTransportApplies
    ? displayCopy.none
    : budget.travelMode === "fixed" &&
        budget.travelAmount.trim() !== "" &&
        Number(budget.travelAmount) >= 0
      ? `+${formatMoneyAmount(minorAmountForCurrency(budget.travelAmount, pricing.currency), pricing.currency, lang)}`
      : budget.travelMode === "actual"
        ? displayCopy.actualCost
        : displayCopy.discuss;

  const supplyCostValueText =
    sitterSupplyCount === 0
      ? displayCopy.none
      : supplyCostMode === "fixed" &&
          budget.supplyAmount.trim() !== "" &&
          Number(budget.supplyAmount) >= 0
        ? `+${formatMoneyAmount(minorAmountForCurrency(budget.supplyAmount, pricing.currency), pricing.currency, lang)}`
        : supplyCostMode === "reimburse"
          ? displayCopy.actualCost
          : displayCopy.discuss;

  const mapLat = location.lat ?? 34.6545;
  const mapLon = location.lng ?? 135.5155;

  return {
    modeCode,
    fullLocationLabel,
    totalDays,
    nightsTotal,
    totalVisitsCount,
    intervalDays,
    homeVisitFrequencyLabel,
    dateRangeLabel,
    displayPets,
    petTypeGroups,
    displayTitle,
    sitterSupplyCount,
    incompletePetLabels,
    displayTasks,
    displaySupplies,
    supplyGroups,
    displayRequirements,
    calendarItem,
    visitWindows,
    storyOverview,
    isCareOpen,
    isCareRange,
    travelMode,
    bigPriceText,
    bigPriceSubLabel,
    formulaText,
    statusNoteText,
    careUnitPriceDisplay,
    travelFeeDisplay,
    boardingTransportApplies,
    transportCostValueText,
    supplyCostValueText,
    mapLat,
    mapLon,
  };
}
