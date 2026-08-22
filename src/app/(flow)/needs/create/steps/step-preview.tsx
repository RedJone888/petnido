"use client";

import { useRouter } from "next/navigation";
import { PiArrowRight, PiEye, PiPawPrint, PiPencilSimple } from "react-icons/pi";
import { useLanguage } from "@/components/providers/language-provider";
import ImageUploader from "@/components/ui/image-uploader";
import type { ImageItem } from "@/domain/attachment/type";
import {
  countBoardingSupplyArrangements,
  type BoardingScheduleType,
  type BoardingSupplyOption,
  type BoardingSupplyPlan,
  type BoardingTaskConfig,
  type BudgetDraft,
  type CareType,
  type PetDraft,
  type SupplyCostMode,
  type TaskPlan,
} from "@/domain/publishing/legacy-need-draft-v3";
import cn from "@/lib/cn";
import {
  NEED_PREVIEW_STORAGE_KEY,
  type NeedPreviewSnapshot,
} from "../preview/types";
import {
  boardingNights,
  boardingRoutineScheduleLabel,
  boardingTransportCostLabel,
  boardingTransportLabel,
  budgetLabel,
  buildTitle,
  buildVisitDateCandidates,
  buildVisitDates,
  CompactReviewCard,
  currencySymbol,
  dateLabel,
  dateSpanDays,
  distanceLabel,
  estimateFormulaText,
  estimateTotalLabel,
  frequencyLabel,
  isPetProfileComplete,
  petDisplayType,
  petTypes,
  previewPetDetails,
  ReviewMetric,
  ReviewSection,
  ReviewStat,
  visitTimeLabel,
} from "../guided-need-flow-shared";

export function StepPreview({
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
  area,
  distance,
  transport,
  splitDirection,
  budget,
  tags,
  customRequirements,
  customCautions,
  visitFrequency,
  customInterval,
  firstVisitDate,
  excludedVisitDates,
  visitsPerDay,
  visitTimes,
  exactTimes,
  validation,
  authenticated,
  supportingImages,
  onSupportingImagesChange,
  onBeforeOpenDetail,
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
  area: string;
  distance: string;
  transport: string;
  splitDirection: "owner-dropoff" | "sitter-dropoff";
  budget: BudgetDraft;
  tags: string[];
  customRequirements: string[];
  customCautions: string[];
  visitFrequency: string;
  customInterval: number;
  firstVisitDate: string;
  excludedVisitDates: string[];
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
  authenticated: boolean;
  supportingImages: ImageItem[];
  onSupportingImagesChange: (images: ImageItem[]) => void;
  onBeforeOpenDetail: () => void;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const copy = t.core.needPublishingAdvanced.preview;
  const careTypeCopy = t.core.needPublishing.careTypes[careType];
  const title = buildTitle(careType, pets, careTypeCopy?.title);
  const boardingTransportNeedsBudget =
    careType === "boarding" &&
    (transport === "sitter" || transport === "split");
  const travelAllowanceInvalid =
    (careType === "visit" || boardingTransportNeedsBudget) &&
    budget.travelMode === "fixed" &&
    Number(budget.travelAmount) <= 0;
  const transportBudgetMissing =
    boardingTransportNeedsBudget && budget.travelMode === "none";
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
  const supplyAllowanceInvalid =
    careType === "boarding" &&
    sitterSupplyCount > 0 &&
    supplyCostMode === "fixed" &&
    Number(budget.supplyAmount) <= 0;
  const estimatedTotal = !validation.dates
    ? copy.totalDaysMissing
    : !validation.budget
      ? travelAllowanceInvalid
        ? copy.amountNotSet
        : transportBudgetMissing
          ? copy.transportCosts
          : supplyAllowanceInvalid
            ? copy.amountNotSet
            : budget.mode === "range" &&
                Number(budget.amount) > 0 &&
                Number(budget.maximum) > 0
              ? copy.amountNotSet
              : copy.amountNotSet
      : estimateTotalLabel({
          careType,
          dates,
          budget,
          transport,
          supplyCostMode: sitterSupplyCount > 0 ? supplyCostMode : undefined,
          visitFrequency,
          customInterval,
          firstVisitDate,
          excludedVisitDates,
          visitsPerDay,
        });
  const totalDays = dateSpanDays(dates);
  const totalNights = boardingNights(dates);
  const totalVisits =
    buildVisitDates({
      dates,
      visitFrequency,
      customInterval,
      firstVisitDate,
      excludedVisitDates,
    }).length * visitsPerDay;
  const priceLabel = budgetLabel(
    budget,
    careType === "visit"
      ? "per visit"
      : careType === "boarding"
        ? "per night"
        : "total",
  );
  const estimateInvalid = !validation.dates || !validation.budget;
  const formula = estimateFormulaText(
    careType,
    budget.travelMode,
    transport,
    sitterSupplyCount > 0 ? supplyCostMode : undefined,
  );
  const transportLabel = boardingTransportLabel(transport, splitDirection);
  const transportCostLabel = boardingTransportCostLabel(transport, budget);
  const supplyCostLabel = !sitterSupplyCount
    ? copy.noSitterItems
    : supplyCostMode === "reimburse"
      ? copy.reimburseSeparate
      : supplyCostMode === "fixed"
        ? budget.supplyAmount
          ? `${currencySymbol(budget.currency)}${Number(budget.supplyAmount).toLocaleString()} total`
          : copy.amountNotSet
        : t.core.needPublishingAdvanced.budget.discussAfter;
  const incompletePetLabels = pets.flatMap((pet, index) =>
    !isPetProfileComplete(pet)
      ? [pet.name || petDisplayType(pet) || `Pet ${index + 1}`]
      : [],
  );
  const hasTaskWithoutPetMatch = tasks.some(
    (task) =>
      !task.petIds.some((petId) => pets.some((pet) => pet.id === petId)),
  );
  const hasVisitWithoutTasks =
    careType === "visit" &&
    Array.from({ length: visitsPerDay }, (_, index) => index + 1).some(
      (visit) =>
        !tasks.some((task) => (task.visitNumbers ?? [1]).includes(visit)),
    );
  const petsWithoutTasks = pets.filter(
    (pet) => !tasks.some((task) => task.petIds.includes(pet.id)),
  );
  const petsWithoutTaskLabels = petsWithoutTasks.map(
    (pet) => pet.name || petDisplayType(pet) || `Pet ${pets.indexOf(pet) + 1}`,
  );
  const boardingRoutineItems = boardingRoutines.flatMap((config) =>
    config.routines.map((routine) => ({ config, routine })),
  );
  const boardingRoutineGroups = (
    [
      { type: "daily", label: copy.daily },
      { type: "repeating", label: copy.repeating },
      { type: "once", label: copy.oneTime },
      { type: "as-needed", label: copy.asNeeded },
    ] satisfies Array<{ type: BoardingScheduleType; label: string }>
  )
    .map((group) => ({
      ...group,
      count: boardingRoutineItems.filter(
        (item) => item.routine.scheduleType === group.type,
      ).length,
    }))
    .filter((group) => group.count > 0);
  const boardingRoutineNames = Array.from(
    new Set(boardingRoutineItems.map(({ config }) => config.label)),
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
  const boardingPetsWithoutTasks = pets.filter(
    (pet) =>
      !boardingRoutineItems.some((item) =>
        item.routine.petIds.includes(pet.id),
      ),
  );
  const boardingInvalidRoutine = boardingRoutineItems.some(
    (item) =>
      !item.routine.petIds.some((petId) =>
        pets.some((pet) => pet.id === petId),
      ),
  );
  const taskValidationMessages =
    careType === "boarding"
      ? !boardingRoutineItems.length
        ? [copy.validationNoRoutine]
        : [
            ...(boardingInvalidRoutine ? [copy.validationRoutine] : []),
            ...(boardingPetsWithoutTasks.length
              ? [
                  copy.validationMissingRoutine.replace(
                    "{pets}",
                    boardingPetsWithoutTasks
                      .map((pet) => pet.name || petDisplayType(pet))
                      .join(", "),
                  ),
                ]
              : []),
          ]
      : !tasks.length
        ? [copy.validationNoTask]
        : [
            ...(hasTaskWithoutPetMatch ? [copy.validationAssign] : []),
            ...(hasVisitWithoutTasks ? [copy.validationVisit] : []),
            ...(petsWithoutTasks.length
              ? [
                  copy.validationMissingTask.replace(
                    "{pets}",
                    petsWithoutTaskLabels.join(", "),
                  ),
                ]
              : []),
          ];
  const previewPets = pets.map((pet, index) => ({
    id: pet.id,
    label: pet.name || petDisplayType(pet) || `Pet ${index + 1}`,
    type: petDisplayType(pet) || "Pet",
    quantity: pet.quantity,
    photo: pet.photo || undefined,
    details: previewPetDetails(pet),
    notes: pet.notes.trim() || undefined,
  }));
  const previewTask = (task: TaskPlan) => ({
    id: task.id,
    label: task.label,
    priority: task.priority,
    petLabels: task.petIds.flatMap(
      (petId) => previewPets.find((pet) => pet.id === petId)?.label ?? [],
    ),
    notes: task.notes?.trim() || undefined,
  });
  const openDetailPreview = () => {
    const snapshot: NeedPreviewSnapshot = {
      version: 1,
      careType,
      serviceTitle: careTypeCopy.title,
      title,
      area: area || copy.areaNotAdded,
      areaDetail:
        careType === "boarding"
          ? distanceLabel(distance)
          : t.core.common.approximateArea,
      dates: {
        label: dateLabel(dates),
        startDate: dates.startDate,
        endDate: dates.endDate,
        notes: dates.notes.trim(),
        totalDays,
        totalNights,
      },
      pets: previewPets,
      pricing: {
        priceLabel,
        supplyCostLabel,
        transportCostLabel:
          careType === "visit"
            ? budget.travelMode === "none"
              ? copy.notProvided
              : budget.travelMode === "actual"
                ? copy.reimburseSeparate
                : budget.travelAmount
                  ? `${currencySymbol(budget.currency)}${Number(budget.travelAmount).toLocaleString()} per visit`
                  : copy.amountNotSet
            : careType === "boarding"
              ? transportCostLabel
              : copy.notProvided,
        estimatedTotal,
        formula,
      },
      additionalCareNotes: taskNotes.trim(),
      visit:
        careType === "visit"
          ? {
              scheduleLabel: `${visitsPerDay} ${visitsPerDay === 1 ? copy.visit : copy.visits} / ${frequencyLabel(visitFrequency, customInterval)}`,
              totalVisits,
              visitDates: buildVisitDates({
                dates,
                visitFrequency,
                customInterval,
                firstVisitDate,
                excludedVisitDates,
              }),
              visitDateCandidates: buildVisitDateCandidates({
                dates,
                visitFrequency,
                customInterval,
                firstVisitDate,
              }),
              excludedVisitDates,
              visits: Array.from({ length: visitsPerDay }, (_, index) => ({
                number: index + 1,
                time: visitTimeLabel(visitTimes[index], exactTimes[index]),
                tasks: tasks
                  .filter((task) =>
                    (task.visitNumbers ?? [1]).includes(index + 1),
                  )
                  .map(previewTask),
              })),
            }
          : undefined,
      boarding:
        careType === "boarding"
          ? {
              routines: boardingRoutineItems.map(({ config, routine }) => ({
                id: routine.id,
                label: config.label,
                priority: routine.priority,
                petLabels: routine.petIds.flatMap(
                  (petId) =>
                    previewPets.find((pet) => pet.id === petId)?.label ?? [],
                ),
                scheduleType: routine.scheduleType,
                schedule: boardingRoutineScheduleLabel(routine),
                instructions: routine.instructions.trim(),
              })),
              homeFit: {
                needs: homeMustHaveTags,
                ok: [],
                avoid: homeAvoidTags,
                notes: homeFitNotes.trim(),
              },
              supplies: {
                owner: ownerSupplyItems.map((item) => ({
                  id: item.key,
                  label: item.label,
                  petLabel:
                    previewPets.find((pet) => pet.id === item.petId)?.label ??
                    "Pet",
                })),
                sitter: sitterSupplyItems.map((item) => ({
                  id: item.key,
                  label: item.label,
                  petLabel:
                    previewPets.find((pet) => pet.id === item.petId)?.label ??
                    "Pet",
                })),
                notes: boardingSupplyNotes.trim(),
              },
              transportLabel,
            }
          : undefined,
      custom:
        careType === "custom"
          ? {
              tasks: tasks.map(previewTask),
              requirements: customRequirements,
              cautions: customCautions,
              timePreferenceLabel: dates.timeOfDay
                ? [
                    t.core.needPublishing.timeOptions[
                      dates.timeOfDay as keyof typeof t.core.needPublishing.timeOptions
                    ] ?? dates.timeOfDay,
                    ...(dates.timeOfDay === "exact" && dates.exactTime
                      ? [dates.exactTime]
                      : []),
                  ].join(" · ")
                : undefined,
            }
          : undefined,
    };
    onBeforeOpenDetail();
    window.sessionStorage.setItem(
      NEED_PREVIEW_STORAGE_KEY,
      JSON.stringify(snapshot),
    );
    router.push(`/needs/create/preview?careType=${careType}`);
  };
  return (
    <>
      <article className="overflow-hidden rounded-[18px] border border-[#ded9e0] bg-white">
        <div className="bg-[var(--primary)] p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/65">
            {copy.serviceType} · {careTypeCopy.title}
          </p>
          <h2 className="mt-2 text-2xl font-bold leading-8">{title}</h2>
          <p
            className={cn(
              "mt-2 text-sm",
              validation.area
                ? "text-white/75"
                : "font-semibold text-[#ffd8dd]",
            )}
          >
            {area
              ? careType === "boarding"
                ? `${area} · ${distanceLabel(distance)}`
                : area
              : copy.areaNotAdded}
          </p>
        </div>
        <div className="space-y-4 p-5">
          {!validation.pets && (
            <div
              role="alert"
              className="rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm font-semibold text-danger-text"
            >
              {pets.length
                ? copy.completePets.replace(
                    "{pets}",
                    incompletePetLabels.join(", "),
                  )
                : copy.addPet}
            </div>
          )}
          <section className="rounded-xl border border-[#ded9e0] bg-[#faf9f7] p-4">
            <div className="mb-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                {copy.supportingPhotos}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#706a78]">
                {copy.photosDetail}
              </p>
            </div>
            {authenticated ? (
              <ImageUploader
                value={supportingImages}
                onChange={onSupportingImagesChange}
                onRemove={(id) =>
                  onSupportingImagesChange(
                    supportingImages.filter((image) => image.id !== id),
                  )
                }
                maxCount={12}
                folder="needs"
                size="sm"
              />
            ) : (
              <p className="text-xs font-semibold text-[#817a85]">
                {copy.signInPhotos}
              </p>
            )}
          </section>
          {careType === "custom" && (
            <div
              className={cn(
                "rounded-xl border px-4 py-3",
                validation.dates
                  ? "border-transparent bg-[#f7f4f7]"
                  : "border-danger-border bg-danger-bg",
              )}
            >
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                {copy.careDates}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p
                  className={cn(
                    "text-sm font-bold",
                    !validation.dates && "text-danger-text",
                  )}
                >
                  {dateLabel(dates)}
                </p>
                <p
                  className={cn(
                    "text-xs font-semibold",
                    validation.dates ? "text-[#817a85]" : "text-danger-text",
                  )}
                >
                  {totalDays
                    ? totalDays === 1
                      ? copy.totalDays.replace("{n}", String(totalDays))
                      : copy.totalDaysPlural.replace("{n}", String(totalDays))
                    : copy.totalDaysMissing}
                </p>
              </div>
            </div>
          )}
          {careType === "visit" && (
            <section>
              <div className="grid grid-cols-2 gap-x-5 gap-y-4 md:grid-cols-[minmax(230px,1.8fr)_minmax(180px,1.35fr)_minmax(90px,0.65fr)]">
                <ReviewMetric
                  label={copy.careDates}
                  value={dateLabel(dates)}
                  detail={
                    totalDays
                      ? totalDays === 1
                        ? copy.totalDays.replace("{n}", String(totalDays))
                        : copy.totalDaysPlural.replace("{n}", String(totalDays))
                      : copy.totalDaysMissing
                  }
                  invalid={!validation.dates}
                />
                <ReviewMetric
                  label={copy.visitSchedule}
                  value={`${visitsPerDay} ${visitsPerDay === 1 ? copy.visit : copy.visits} / ${frequencyLabel(visitFrequency, customInterval)}`}
                />
                <ReviewMetric
                  label={copy.totalVisits}
                  value={String(totalVisits || "—")}
                  invalid={!validation.dates}
                />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-[#eee9ef] pt-3 sm:grid-cols-[minmax(160px,0.9fr)_minmax(230px,1.35fr)]">
                <ReviewMetric
                  label={copy.pricePerVisit}
                  value={priceLabel}
                  invalid={
                    budget.mode !== "open" &&
                    (budget.mode === "exact"
                      ? Number(budget.amount) <= 0
                      : Number(budget.amount) <= 0 ||
                        Number(budget.maximum) <= Number(budget.amount))
                  }
                />
                <ReviewMetric
                  label={copy.travelCosts}
                  value={
                    budget.travelMode === "none"
                      ? copy.notProvided
                      : budget.travelMode === "actual"
                        ? copy.reimburseSeparate
                        : budget.travelAmount
                          ? `${currencySymbol(budget.currency)}${Number(budget.travelAmount).toLocaleString()} per visit`
                          : copy.amountNotSet
                  }
                  invalid={travelAllowanceInvalid}
                />
              </div>
            </section>
          )}
          {careType === "boarding" && (
            <section className="space-y-3">
              <div className="grid gap-x-8 gap-y-4 sm:grid-cols-[minmax(260px,1.8fr)_minmax(110px,0.55fr)]">
                <ReviewMetric
                  label={copy.stayDates}
                  value={dateLabel(dates)}
                  invalid={!validation.dates}
                />
                <ReviewMetric
                  label={copy.totalNights}
                  value={totalNights ? String(totalNights) : "—"}
                  invalid={!validation.dates}
                />
              </div>
              <div className="grid gap-x-6 gap-y-4 border-t border-[#eee9ef] pt-3 sm:grid-cols-3">
                <ReviewMetric
                  label={copy.pricePerNight}
                  value={priceLabel}
                  invalid={!validation.budget}
                />
                <ReviewMetric
                  label={copy.supplyCosts}
                  value={supplyCostLabel}
                  invalid={supplyAllowanceInvalid}
                />
                <ReviewMetric
                  label={copy.transportCosts}
                  value={transportCostLabel}
                  invalid={travelAllowanceInvalid || transportBudgetMissing}
                />
              </div>
            </section>
          )}
          {careType === "custom" && (
            <ReviewStat
              label={copy.agreedTotal}
              value={priceLabel}
              invalid={!validation.budget}
            />
          )}
          <div
            className={cn(
              "rounded-xl border px-4 py-3",
              estimateInvalid
                ? "border-danger-border bg-danger-bg"
                : "border-[#dfd4e5] bg-[#fcfafc]",
            )}
          >
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
              {copy.estimatedTotal}
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 sm:flex-nowrap">
              <p
                className={cn(
                  "shrink-0 text-lg font-bold",
                  estimateInvalid ? "text-danger-text" : "text-[var(--primary)]",
                )}
              >
                {estimatedTotal}
              </p>
              <p className="w-full text-[11px] font-semibold leading-5 text-[#817a85] sm:w-auto sm:whitespace-nowrap">
                {formula}
              </p>
            </div>
          </div>
          {careType === "visit" && (
            <ReviewSection title={copy.visitPlan}>
              <p className="mb-3 text-sm font-semibold">
                {visitsPerDay === 1
                  ? copy.onEachCareDay.replace("{n}", String(visitsPerDay))
                  : copy.onEachCareDayPlural.replace(
                      "{n}",
                      String(visitsPerDay),
                    )}
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {Array.from({ length: visitsPerDay }, (_, index) => {
                  const visit = index + 1;
                  const visitHasMissingTasks = !tasks.some((task) =>
                    (task.visitNumbers ?? [1]).includes(visit),
                  );
                  return (
                    <div
                      key={visit}
                      className={cn(
                        "rounded-xl border p-3",
                        visitHasMissingTasks
                          ? "border-danger-border bg-[#fffafa]"
                          : "border-[#eee9ef] bg-[#fdfcfa]",
                      )}
                    >
                      <p className="text-xs font-bold text-[var(--primary)]">
                        {copy.visit} {visit}
                      </p>
                      <p className="mt-1 text-xs text-[#706a78]">
                        {visitTimeLabel(visitTimes[index], exactTimes[index])}
                      </p>
                      {visitHasMissingTasks && (
                        <p className="mt-2 text-[11px] font-semibold text-danger-text">
                          {copy.noTasksVisit}
                        </p>
                      )}
                      <div className="mt-2 space-y-1.5 border-t border-[#eee9ef] pt-2">
                        {pets.map((pet, petIndex) => {
                          const taskCount = tasks.filter(
                            (task) =>
                              (task.visitNumbers ?? [1]).includes(visit) &&
                              task.petIds.includes(pet.id),
                          ).length;
                          if (!taskCount) return null;
                          const PetIcon =
                            petTypes.find((type) => type.id === pet.type)
                              ?.icon ?? PiPawPrint;
                          return (
                            <div
                              key={pet.id}
                              className="flex items-center justify-between gap-2 text-[11px]"
                            >
                              <span className="flex min-w-0 items-center gap-1.5 font-semibold text-[#625a67]">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary-fixed)] text-[var(--primary)]">
                                  <PetIcon size={13} />
                                </span>
                                <span className="truncate">
                                  {pet.name ||
                                    petDisplayType(pet) ||
                                    `Pet ${petIndex + 1}`}
                                </span>
                                <span className="shrink-0 rounded-full bg-[var(--primary-fixed)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--primary)]">
                                  ×{pet.quantity}
                                </span>
                              </span>
                              <span className="shrink-0 text-[#817a85]">
                                {taskCount}{" "}
                                {taskCount === 1 ? copy.task : copy.tasks}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ReviewSection>
          )}
          {!validation.tasks && (
            <div
              role="alert"
              className="space-y-1 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm font-semibold text-danger-text"
            >
              {taskValidationMessages.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
          )}
          {careType !== "boarding" && taskNotes.trim() && (
            <ReviewSection title={copy.additionalCareNotes}>
              <p className="whitespace-pre-wrap text-sm leading-6 text-[#625a67]">
                {taskNotes.trim()}
              </p>
            </ReviewSection>
          )}
          {careType === "boarding" && (
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.13em] text-[#8a5d34]">
                {copy.boardingDetails}
              </h3>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                <CompactReviewCard
                  title={copy.careRoutines}
                  value={
                    boardingRoutineItems.length
                      ? `${boardingRoutineItems.length} ${boardingRoutineItems.length === 1 ? copy.routine : copy.routines}`
                      : copy.noneAdded
                  }
                  detail={boardingRoutineGroups
                    .map((group) => `${group.count} ${group.label}`)
                    .join(" · ")}
                  invalid={!validation.tasks}
                >
                  {boardingRoutineNames.length > 0 && (
                    <p className="mt-2 truncate text-[11px] font-medium text-[#817a85]">
                      {boardingRoutineNames.slice(0, 3).join(" · ")}
                      {boardingRoutineNames.length > 3
                        ? ` · +${boardingRoutineNames.length - 3} more`
                        : ""}
                    </p>
                  )}
                  {taskNotes.trim() && (
                    <p className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-[var(--primary-muted)]">
                      <PiPencilSimple size={12} />
                      {copy.careNotesAdded}
                    </p>
                  )}
                </CompactReviewCard>
                <CompactReviewCard
                  title={copy.homeFit}
                  value={
                    tags.length
                      ? `${tags.length} ${copy.preferences}`
                      : copy.noPreferences
                  }
                  detail={[
                    homeMustHaveTags.length
                      ? `${homeMustHaveTags.length} ${copy.needs}`
                      : "",
                    homeAvoidTags.length
                      ? `${homeAvoidTags.length} ${copy.avoid}`
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                >
                  {homeFitNotes.trim() && (
                    <p className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-[var(--primary-muted)]">
                      <PiPencilSimple size={12} />
                      {copy.notesAdded}
                    </p>
                  )}
                </CompactReviewCard>
                <CompactReviewCard
                  title={copy.supplies}
                  value={
                    ownerSupplyCount || sitterSupplyCount
                      ? `${ownerSupplyCount + sitterSupplyCount} ${ownerSupplyCount + sitterSupplyCount === 1 ? copy.item : copy.items} ${copy.arrangements}`
                      : copy.noArrangements
                  }
                  detail={
                    ownerSupplyCount || sitterSupplyCount
                      ? `${copy.owner} ${ownerSupplyCount} · ${copy.sitter} ${sitterSupplyCount}`
                      : ""
                  }
                >
                  {boardingSupplyNotes.trim() && (
                    <p className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-[var(--primary-muted)]">
                      <PiPencilSimple size={12} />
                      {copy.notesAdded}
                    </p>
                  )}
                </CompactReviewCard>
                <CompactReviewCard
                  title={copy.transportCosts}
                  value={transportLabel}
                />
              </div>
            </section>
          )}
          {careType === "custom" && (
            <ReviewSection title={copy.carePlan}>
              <p
                className={cn(
                  "text-sm font-semibold",
                  !validation.tasks && "text-danger-text",
                )}
              >
                {tasks.length} {tasks.length === 1 ? copy.task : copy.tasks}{" "}
                {copy.added}
                {tags.length ? ` · ${tags.length} ${copy.requirements}` : ""}
              </p>
            </ReviewSection>
          )}
        </div>
      </article>
      <button
        type="button"
        onClick={openDetailPreview}
        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-[var(--primary)] bg-white text-sm font-bold text-[var(--primary)] outline-none transition hover:bg-[var(--primary-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
      >
        <PiEye size={17} />
        {copy.previewDetails} <PiArrowRight size={15} />
      </button>
    </>
  );
}

// Compatibility exports
export const PreviewScreen = StepPreview;
export const GuidedNeedPreviewStep = StepPreview;
