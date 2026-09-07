"use client";
import { useNeedPreviewModel } from "./use-need-preview-model";

import { useLanguage } from "@/components/providers/language-provider";
import { AppImage } from "@/components/ui/app-image";
import type { ImageItem } from "@/domain/attachment/type";
import { petAvatarPosition } from "@/domain/pet/avatar";
import {
formatPetAge,
formatPetGenderAndNeuter,
formatPetWeight,
} from "@/domain/pet/presentation";
import { localizePetBreed } from "@/domain/pet/profile-options";
import {
type BoardingSupplyOption,
type BoardingSupplyPlan,
type BoardingTaskConfig,
type BudgetDraft,
type CareType,
type LocationDraft,
type PetDraft,
type ScreenId,
type SupplyCostMode,
type TaskPlan
} from "@/domain/publishing/legacy-need-draft-v3";
import cn from "@/lib/cn";
import { NeedCalendarView } from "@/modules/need-display/client/_components/need-calendar-view";
import { PetGroupTaskTable } from "@/modules/need-display/client/_components/pet-group-task-layout";
import {
buildStructuredSupplyRows,
customScheduleSummaryBadge,
formatTransportModeLabel,
formatVisitWindowTime,
getSupplyCategoryBadgeInfo,
groupPetsAndTasks,
modeColorMap,
taskPriorityInfo,
taskScheduleKindInfo
} from "@/modules/need-display/client/_utils/presentation-formatters";
import { getNeedDisplayMessages } from "@/modules/need-display/i18n";
import { useNeedPublishingMessages } from "@/modules/need-publishing/client";
import {
type NeedPricingSummary
} from "@/modules/need-publishing/domain/pricing";
import { localizeTaskLabel } from "@/modules/need-publishing/domain/task-catalog";
import {
AlertCircle,
Calendar,
CheckCircle2,
ChevronDown,
ChevronUp,
HeartPulse,
MapPin,
NotebookText,
Package,
Scale,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import {
PiBookOpen,
PiCalendarBlank,
PiClock,
PiFileText,
PiListChecks,
PiPawPrint,
PiPencilSimple,
PiShieldCheck,
PiWarning
} from "react-icons/pi";

const MapLibreMap = dynamic(() => import("@/components/location/MapLibreMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[15rem] bg-slate-100/90 animate-pulse rounded-xl flex items-center justify-center">
      <div className="h-6 w-6 rounded-full border-2 border-[#ff8243] border-t-transparent animate-spin" />
    </div>
  ),
});

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

  const [expandedVisits, setExpandedVisits] = useState<Record<number, boolean>>({});

  const toggleVisit = (idx: number) => {
    setExpandedVisits((prev) => {
      const isCurrentlyExpanded = prev[idx] ?? true;
      return { ...prev, [idx]: !isCurrentlyExpanded };
    });
  };

  const { modeCode, fullLocationLabel, totalDays, nightsTotal, totalVisitsCount, intervalDays, homeVisitFrequencyLabel, dateRangeLabel, displayPets, petTypeGroups, displayTitle, sitterSupplyCount, incompletePetLabels, displayTasks, displaySupplies, supplyGroups, displayRequirements, calendarItem, visitWindows, storyOverview, isCareOpen, isCareRange, travelMode, bigPriceText, bigPriceSubLabel, formulaText, statusNoteText, careUnitPriceDisplay, travelFeeDisplay, boardingTransportApplies, transportCostValueText, supplyCostValueText, mapLat, mapLon } = useNeedPreviewModel({ careType, pets, dates, tasks, boardingRoutines, boardingSupplies, boardingSupplyItems, boardingSupplyNotes, supplyCostMode, taskNotes, homeFitNotes, requirementsNotes, location, distance, transport, splitDirection, budget, pricing, tags, customRequirements, customCautions, visitFrequency, customInterval, firstVisitDate, visitsPerDay, visitTimes, exactTimes, validation, supportingImages, onEditStep });

  return (
    <div className="space-y-6">
      {/* Top Validation Alert */}
      {(!validation.pets ||
        !validation.dates ||
        !validation.tasks ||
        !validation.area ||
        !validation.budget) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-amber-900 shadow-xs">
          <div className="flex items-start gap-3">
            <PiWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="flex-1 text-xs sm:text-sm">
              <p className="font-bold">{flowCopy.publishError}</p>
              <ul className="mt-1.5 list-inside list-disc space-y-1 text-amber-800">
                {!validation.pets && (
                  <li>
                    {pets.length
                      ? copy.completePets.replace(
                          "{pets}",
                          incompletePetLabels.join(", "),
                        )
                      : copy.addPet}
                  </li>
                )}
                {!validation.dates && <li>{copy.careDates}</li>}
                {!validation.tasks && <li>{copy.validationNoTask}</li>}
                {!validation.area && <li>{copy.areaNotAdded}</li>}
                {!validation.budget && <li>{copy.amountNotSet}</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Responsive Layout matching public-need-detail.tsx */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_328px] xl:grid-cols-[minmax(0,1fr)_344px] 2xl:grid-cols-[minmax(0,1fr)_352px]">
        {/* Left Column: Full Content Sections */}
        <div className="min-w-0 space-y-6">
          {/* Header Section matching public detail page */}
          <div className="space-y-3 border-b border-[#EDE8E1]/80 pb-3">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <h1 className="font-sans text-2xl font-extrabold leading-tight tracking-[-0.02em] text-[#2B231D] sm:text-3xl">
                {displayTitle}
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-3 py-1 text-xs font-bold text-amber-850 shadow-2xs shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                <span>
                  {lang === "zh"
                    ? "待发布"
                    : lang === "ja"
                      ? "公開待ち"
                      : "Ready to publish"}
                </span>
              </span>
            </div>

            {/* Meta Line */}
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs sm:text-sm">
              <p className="flex items-center gap-1.5 font-bold text-[#2B231D]">
                <Calendar size={15} className="text-primary shrink-0" />
                <span>
                  {dateRangeLabel}
                  {careType === "visit" ? (
                    <span className="font-semibold text-[#5F5850]">
                      {" "}
                      · {homeVisitFrequencyLabel}
                    </span>
                  ) : null}
                </span>
              </p>
              {onEditStep ? (
                <button
                  type="button"
                  onClick={() => onEditStep("dates")}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary transition hover:underline"
                >
                  <PiPencilSimple size={14} />
                  {t.core.management.actions.edit}
                </button>
              ) : null}
            </div>
          </div>

          {/* Section: 📖 Overview */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PiBookOpen size={22} className="text-primary" />
                <h2 className="font-sans text-lg font-extrabold tracking-[-0.01em] text-[#2B231D] sm:text-xl">
                  {displayCopy.overview}
                </h2>
              </div>
            </div>
            <div className="pl-[30px] pr-3 sm:pr-4">
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#4A423A]">
                {storyOverview}
              </p>
            </div>
          </section>

          {/* Section: 🐾 Pets to care for */}
          <section className="space-y-3 border-t border-[#E7E0D8]/80 pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PiPawPrint size={22} className="text-primary" />
                <h2 className="font-sans text-lg font-extrabold tracking-[-0.01em] text-[#2B231D] sm:text-xl">
                  {displayCopy.pets}
                </h2>
              </div>
              {onEditStep && (
                <button
                  type="button"
                  onClick={() => onEditStep("pets")}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary transition hover:underline"
                >
                  <PiPencilSimple size={14} />
                  {t.core.management.actions.edit}
                </button>
              )}
            </div>

            <div className="space-y-5 pl-[30px] pr-3 sm:pr-4">
              {petTypeGroups.map((petGroup) => {
                const groupTypeLabel =
                  t.core.pets[
                    petGroup.petType.toLowerCase() as keyof typeof t.core.pets
                  ] ??
                  t.core.pets[
                    petGroup.petType as keyof typeof t.core.pets
                  ] ??
                  petGroup.petType;
                return (
                  <div key={petGroup.petType} className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.1em] text-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <h3>{groupTypeLabel}</h3>
                    </div>
                    <div className="space-y-6">
                      {petGroup.pets.map((pet, petIndex: number) => {
                        const petLabel =
                          t.core.pets[
                            pet.petType as keyof typeof t.core.pets
                          ] ?? pet.petType;
                        const breedLabel = pet.breed
                          ? localizePetBreed(pet.breed, lang, pet.petType)
                          : null;
                        const ageText = formatPetAge(pet.birthDate, lang);
                        const genderInfo = formatPetGenderAndNeuter(
                          pet.sex,
                          pet.neutered,
                          lang,
                        );
                        const weightText = formatPetWeight(
                          pet.weightGrams,
                          lang,
                        );

                        return (
                          <div
                            key={`${pet.name || pet.petType}-${petIndex}`}
                            className="flex w-full flex-col md:flex-row md:items-start gap-4 md:gap-7"
                          >
                            <div className="flex shrink-0 items-start gap-3.5 sm:min-w-[220px] md:max-w-[280px]">
                              {/* Pet Avatar */}
                              <div className="group relative h-20 w-20 shrink-0 sm:h-[5.5rem] sm:w-[5.5rem]">
                                <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-slate-100 bg-[#FFF8E8] shadow-2xs sm:h-[5.5rem] sm:w-[5.5rem]">
                                  {pet.image ? (
                                    <AppImage
                                      src={pet.image}
                                      alt={pet.name || petLabel}
                                      width={88}
                                      height={88}
                                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                    />
                                  ) : (
                                    <span
                                      role="img"
                                      aria-label={petLabel}
                                      className="block h-full w-full bg-[#fff8e8] bg-no-repeat"
                                      style={{
                                        backgroundImage:
                                          "url('/images/pet-default-avatars-v2.png')",
                                        backgroundPosition:
                                          petAvatarPosition(pet.petType),
                                        backgroundSize: "400% auto",
                                      }}
                                    />
                                  )}
                                </div>
                              </div>

                              {/* Name & Attributes */}
                              <div className="flex min-w-0 flex-col justify-center py-0.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-base font-extrabold leading-tight text-[#2B231D]">
                                    {pet.name || `${petLabel} #${petIndex + 1}`}
                                  </h3>
                                </div>

                                {breedLabel ? (
                                  <p
                                    className="mt-0.5 truncate text-xs font-medium text-[#706A60]"
                                    title={breedLabel}
                                  >
                                    {breedLabel}
                                  </p>
                                ) : null}

                                <div className="mt-2 flex min-w-0 flex-col gap-1.5 text-xs font-medium text-[#5F5850]">
                                  {ageText || weightText ? (
                                    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                                      {ageText ? (
                                        <span className="inline-flex items-center gap-1.5">
                                          <PiCalendarBlank className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                                          <span>{ageText}</span>
                                        </span>
                                      ) : null}
                                      {weightText ? (
                                        <span className="inline-flex items-center gap-1.5">
                                          <Scale className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                          <span>{weightText}</span>
                                        </span>
                                      ) : null}
                                    </div>
                                  ) : null}
                                  {genderInfo ? (
                                    <div className="flex min-w-0 items-start gap-1.5 leading-5">
                                      <HeartPulse className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" />
                                      <span className="min-w-0">
                                        {genderInfo.label}
                                      </span>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            {pet.careNotes ? (
                              <div className="flex min-w-0 flex-1 items-start gap-2 pt-1 text-xs text-[#706A60]">
                                <NotebookText
                                  size={15}
                                  className="mt-0.5 shrink-0 text-[#A59D91]"
                                />
                                <p className="min-w-0 whitespace-pre-wrap break-words leading-relaxed [overflow-wrap:anywhere]">
                                  {pet.careNotes}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section: 📅 Care schedule & tasks */}
          <section className="space-y-4 border-t border-[#E7E0D8]/80 pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {careType === "boarding" ? (
                  <PiListChecks size={22} className="text-primary" />
                ) : careType === "custom" ? (
                  <PiFileText size={22} className="text-primary" />
                ) : (
                  <PiClock size={22} className="text-primary" />
                )}
                <h2 className="font-sans text-lg font-extrabold tracking-[-0.01em] text-[#2B231D] sm:text-xl">
                  {displayCopy.tasks}
                </h2>
              </div>
              {onEditStep && (
                <button
                  type="button"
                  onClick={() => onEditStep("tasks")}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary transition hover:underline"
                >
                  <PiPencilSimple size={14} />
                  {t.core.management.actions.edit}
                </button>
              )}
            </div>

            {careType === "visit" && dates.notes ? (
              <div className="ml-[30px] mr-3 rounded-xl border border-amber-200/90 bg-[#FFF9EE] p-4 text-xs sm:text-sm text-[#514956] shadow-2xs sm:mr-4">
                <div className="flex items-center gap-1.5 font-bold text-[#8A5D34]">
                  <PiFileText size={16} />
                  <span>{displayCopy.scheduleNotesHeading}</span>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap leading-relaxed break-words">
                  {dates.notes}
                </p>
              </div>
            ) : null}

            {careType === "visit" ? (
              <div className="space-y-3.5 pl-[30px] pr-3 sm:pr-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 py-1 text-xs sm:grid-cols-4">
                  <div className="space-y-1">
                    <span className="block font-semibold text-[#8C8479]">
                      {displayCopy.frequency}
                    </span>
                    <span className="block text-base font-black text-[#2B231D]">
                      {displayCopy.everyDays(intervalDays)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="block font-semibold text-[#8C8479]">
                      {displayCopy.visitsPerDay(visitsPerDay)}
                    </span>
                    <span className="block text-base font-black text-[#2B231D]">
                      {visitsPerDay}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="block font-semibold text-[#8C8479]">
                      {displayCopy.totalVisits}
                    </span>
                    <span className="block text-base font-black text-[var(--primary)]">
                      {displayCopy.totalVisitsCount(totalVisitsCount)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="block font-semibold text-[#8C8479]">
                      {displayCopy.serviceDays}
                    </span>
                    <span className="block text-base font-black text-[#2B231D]">
                      {displayCopy.totalDaysCount(totalDays)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {Array.from({ length: visitsPerDay }).map((_, vIdx) => {
                    const window = visitWindows[vIdx];
                    const windowTimeLabel = formatVisitWindowTime(
                      window,
                      lang,
                      t,
                      needMessages,
                    );
                    const isExpanded = expandedVisits[vIdx] ?? true;

                    const visitTasks = displayTasks
                      .filter((task) => {
                        if (!task.visitNumbers || task.visitNumbers.length === 0)
                          return true;
                        return task.visitNumbers.includes(vIdx + 1);
                      })
                      .sort(
                        (a, b) =>
                          ((a.orderByVisit?.[vIdx + 1] ??
                            Number.MAX_SAFE_INTEGER) -
                            (b.orderByVisit?.[vIdx + 1] ??
                              Number.MAX_SAFE_INTEGER)),
                      );

                    const visitGroups = groupPetsAndTasks(
                      displayPets,
                      visitTasks,
                      lang,
                      t,
                    );
                    const displayedVisitTasks = visitGroups.flatMap(
                      (group) => group.tasks,
                    );
                    const sequenceByTask = new Map<object, number>(
                      displayedVisitTasks.map((task, taskIndex) => [
                        task as object,
                        taskIndex + 1,
                      ]),
                    );

                    return (
                      <div key={vIdx}>
                        <div
                          onClick={() => toggleVisit(vIdx)}
                          className={cn(
                            "flex w-full cursor-pointer select-none items-center justify-between bg-primary/[0.07] px-3.5 py-3 transition hover:bg-primary/[0.11]",
                            isExpanded ? "rounded-t-xl" : "rounded-xl",
                          )}
                        >
                          <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base font-extrabold text-[#2B231D]">
                            <span>{displayCopy.visit(vIdx + 1)}</span>
                            <span className="text-slate-300 font-normal">
                              ·
                            </span>
                            <span className="text-xs sm:text-sm font-semibold text-[#8C8479] inline-flex items-center gap-1.5">
                              <PiClock className="h-3.5 w-3.5 text-primary shrink-0" />
                              {windowTimeLabel}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                            <span>
                              {isExpanded
                                ? displayCopy.collapse
                                : displayCopy.expandTasks}
                            </span>
                            {isExpanded ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[620px] table-auto text-left text-xs">
                              <thead className="border-b border-[#EDE8E1] bg-[#FAF6F0] text-[#706A60]">
                                <tr>
                                  <th className="w-[180px] whitespace-nowrap px-3 py-2.5 font-bold">
                                    {displayCopy.applicablePets}
                                  </th>
                                  <th className="px-3 py-2.5 font-bold">
                                    {displayCopy.careTasks}
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#EDE8E1] bg-white">
                                {visitGroups.map((group, groupIndex) => (
                                  <tr
                                    key={`${group.key}-${groupIndex}`}
                                    className="bg-white"
                                  >
                                    <td className="w-[180px] border-r border-[#EDE8E1] bg-white px-3 py-3 align-top">
                                      <div className="flex max-w-[156px] flex-wrap items-start gap-2">
                                        {group.pets.map((pet, petIndex) => {
                                          const petName =
                                            pet.name ||
                                            `${group.petTypeLabel} #${petIndex + 1}`;
                                          return (
                                            <div
                                              key={`${petName}-${petIndex}`}
                                              className="flex w-12 max-w-[48px] flex-col items-center gap-1 text-center"
                                            >
                                              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-[#FFF8E8]">
                                                {pet.image ? (
                                                  <AppImage
                                                    src={pet.image}
                                                    alt={petName}
                                                    width={36}
                                                    height={36}
                                                    className="h-full w-full object-cover"
                                                  />
                                                ) : (
                                                  <span
                                                    aria-label={petName}
                                                    role="img"
                                                    className="block h-full w-full bg-no-repeat"
                                                    style={{
                                                      backgroundImage:
                                                        "url('/images/pet-default-avatars-v2.png')",
                                                      backgroundPosition:
                                                        petAvatarPosition(
                                                          pet.petType,
                                                        ),
                                                      backgroundSize:
                                                        "400% auto",
                                                    }}
                                                  />
                                                )}
                                              </div>
                                              <span
                                                className="w-full truncate text-[11px] font-bold text-[#2B231D]"
                                                title={petName}
                                              >
                                                {petName}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </td>
                                    <td className="bg-white p-0 align-middle">
                                      <div className="flex min-w-0 flex-1 flex-col justify-center divide-y divide-[#EDE8E1]">
                                        {group.tasks.map((task, taskIndex) => {
                                          const priority = task.priority
                                            ? taskPriorityInfo(
                                                task.priority,
                                                lang,
                                              )
                                            : null;
                                          return (
                                            <div
                                              key={`${task.category}-${task.label}-${taskIndex}`}
                                              className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5 sm:flex-nowrap"
                                            >
                                              <div className="flex shrink-0 items-center gap-2">
                                                <span className="w-5 shrink-0 text-center font-bold text-primary">
                                                  {sequenceByTask.get(
                                                    task as object,
                                                  ) ?? taskIndex + 1}
                                                </span>
                                                <span className="font-bold leading-5 text-[#2B231D]">
                                                  {localizeTaskLabel(
                                                    task.label,
                                                    lang,
                                                    {
                                                      category: task.category,
                                                      custom: task.category
                                                        .toUpperCase()
                                                        .startsWith("CUSTOM"),
                                                    },
                                                  )}
                                                </span>
                                                {priority ? (
                                                  <span
                                                    className={cn(
                                                      "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                                                      priority.className,
                                                    )}
                                                  >
                                                    {priority.text}
                                                  </span>
                                                ) : null}
                                              </div>
                                              <span className="min-w-0 flex-1 whitespace-pre-wrap break-words leading-5 text-[#514956] [overflow-wrap:anywhere]">
                                                {task.instructions ||
                                                  displayCopy.noNotes}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : careType === "boarding" ? (
              <div className="ml-[30px] mr-3 sm:mr-4">
                <table className="w-full table-auto text-left text-xs bg-white">
                  <thead className="bg-[#FAF6F0] border-b border-[#EDE8E1] text-[#706A60]">
                    <tr>
                      <th className="py-2.5 px-3 font-bold whitespace-nowrap">
                        {displayCopy.applicablePets}
                      </th>
                      <th className="py-2.5 px-3 font-bold">
                        {displayCopy.careTasks}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE8E1] bg-white">
                    {groupPetsAndTasks(displayPets, displayTasks, lang, t).map(
                      (group, groupIndex) => (
                        <tr
                          key={`${group.key}-${groupIndex}`}
                          className="bg-white"
                        >
                          <td className="py-3 px-3 align-middle bg-white border-r border-[#EDE8E1]">
                            <div className="flex max-w-[224px] flex-wrap items-center gap-2">
                              {group.pets.map((pet, petIndex) => {
                                const petName =
                                  pet.name || `${group.petTypeLabel} #${petIndex + 1}`;
                                return (
                                  <div
                                    key={`${petName}-${petIndex}`}
                                    className="flex w-12 max-w-[48px] flex-col items-center gap-1 text-center"
                                  >
                                    <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-200 bg-[#FFF8E8] shrink-0">
                                      {pet.image ? (
                                        <AppImage
                                          src={pet.image}
                                          alt={petName}
                                          width={36}
                                          height={36}
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <span
                                          aria-label={petName}
                                          role="img"
                                          className="block h-full w-full bg-no-repeat"
                                          style={{
                                            backgroundImage:
                                              "url('/images/pet-default-avatars-v2.png')",
                                            backgroundPosition:
                                              petAvatarPosition(pet.petType),
                                            backgroundSize: "400% auto",
                                          }}
                                        />
                                      )}
                                    </div>
                                    <span
                                      className="w-full truncate text-[11px] font-bold text-[#2B231D]"
                                      title={petName}
                                    >
                                      {petName}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-1 px-0 align-middle bg-white">
                            <div className="min-w-0 flex-1 flex flex-col justify-center divide-y divide-[#EDE8E1]">
                              {group.tasks.map((task, idx) => {
                                const schedule = taskScheduleKindInfo(
                                  task.scheduleKind,
                                  lang,
                                  modeCode,
                                );

                                return (
                                  <div
                                    key={`${task.category}-${task.label}-${idx}`}
                                    className="flex min-w-0 flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5 text-xs"
                                  >
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="w-5 shrink-0 text-center font-bold text-primary">
                                        {idx + 1}
                                      </span>
                                      <span className="font-bold leading-5 text-[#2B231D]">
                                        {localizeTaskLabel(task.label, lang, {
                                          category: task.category,
                                          custom: task.category
                                            .toUpperCase()
                                            .startsWith("CUSTOM"),
                                        })}
                                      </span>
                                      {schedule ? (
                                        <span
                                          className={cn(
                                            "inline-flex shrink-0 rounded-full border px-2 py-0.5 font-semibold text-[11px]",
                                            schedule.className,
                                          )}
                                        >
                                          {schedule.text}
                                        </span>
                                      ) : null}
                                    </div>
                                    <span className="min-w-0 flex-1 whitespace-pre-wrap break-words leading-5 text-[#514956] [overflow-wrap:anywhere]">
                                      {task.instructions || displayCopy.noNotes}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-5 pl-[30px] pr-3 sm:pr-4">
                {customScheduleSummaryBadge(
                  dates.startDate,
                  dates.endDate,
                  dates.timeOfDay,
                  dates.exactTime,
                  lang,
                  t,
                  needMessages,
                ) ? (
                  <div className="rounded-xl bg-[#FAF6F0] p-3.5 border border-[#EFE7DC] text-xs font-bold text-[#8A5D34]">
                    {customScheduleSummaryBadge(
                      dates.startDate,
                      dates.endDate,
                      dates.timeOfDay,
                      dates.exactTime,
                      lang,
                      t,
                      needMessages,
                    )}
                  </div>
                ) : null}

                <PetGroupTaskTable
                  groups={groupPetsAndTasks(displayPets, displayTasks, lang, t)}
                  lang={lang}
                  t={t}
                  mode={modeCode}
                />
              </div>
            )}

            {taskNotes?.trim() ? (
              <div className="ml-[30px] mr-3 rounded-xl border border-amber-200/90 bg-[#FFF9EE] p-4 text-xs sm:text-sm text-[#514956] shadow-2xs sm:mr-4">
                <div className="flex items-center gap-1.5 font-bold text-[#8A5D34]">
                  <PiFileText size={16} />
                  <span>{displayCopy.additionalCareNotes}</span>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap leading-relaxed">
                  {taskNotes.trim()}
                </p>
              </div>
            ) : null}
          </section>

          {/* Section: 📦 Supplies */}
          {careType === "boarding" ? (
            <section className="space-y-3 border-t border-[#E7E0D8]/80 pt-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package size={22} className="text-primary" />
                  <h2 className="font-sans text-lg font-extrabold tracking-[-0.01em] text-[#2B231D] sm:text-xl">
                    {displayCopy.supplies}
                  </h2>
                </div>
                {onEditStep && (
                  <button
                    type="button"
                    onClick={() => onEditStep("supplies")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary transition hover:underline"
                  >
                    <PiPencilSimple size={14} />
                    {t.core.management.actions.edit}
                  </button>
                )}
              </div>

              <div className="ml-[30px] mr-3 sm:mr-4">
                {displaySupplies.length ? (
                  <table className="w-full table-auto text-left text-xs bg-white">
                    <thead className="bg-[#FAF6F0] border-b border-[#EDE8E1] text-[#706A60]">
                      <tr>
                        <th className="py-2.5 px-3 font-bold whitespace-nowrap">
                          {displayCopy.applicablePets}
                        </th>
                        <th className="w-32 py-2.5 px-3 font-bold whitespace-nowrap sm:w-36">
                          {displayCopy.supplyCategory}
                        </th>
                        <th className="py-2.5 px-3 font-bold">
                          {displayCopy.supplyItem}
                        </th>
                        <th className="w-28 py-2.5 px-3 font-bold text-center whitespace-nowrap sm:w-32">
                          {displayCopy.supplyProvider}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDE8E1] bg-white">
                      {supplyGroups.flatMap((group, groupIndex) => {
                        const structuredSupplies = buildStructuredSupplyRows(
                          group.supplies,
                        );

                        return structuredSupplies.map((supply, supplyIndex) => {
                          const sitterProvides =
                            supply.providedBy === "PROVIDER";
                          const badge = getSupplyCategoryBadgeInfo(
                            supply.category,
                            lang,
                          );

                          return (
                            <tr
                              key={`${group.key}-${groupIndex}-${supply.id ?? supplyIndex}`}
                              className={
                                sitterProvides ? "bg-amber-50/40" : "bg-white"
                              }
                            >
                              {supplyIndex === 0 ? (
                                <td
                                  rowSpan={group.supplies.length}
                                  className="py-3 px-3 align-middle bg-white border-r border-[#EDE8E1]"
                                >
                                  <div className="flex max-w-[224px] flex-wrap items-center gap-2">
                                    {group.pets.map((pet, petIndex) => {
                                      const petName =
                                        pet.name || pet.petType;
                                      return (
                                        <div
                                          key={`${pet.id ?? petName}-${petIndex}`}
                                          className="flex w-12 max-w-[48px] flex-col items-center gap-1 text-center"
                                        >
                                          <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-200 bg-[#FFF8E8] shrink-0">
                                            {pet.image ? (
                                              <AppImage
                                                src={pet.image}
                                                alt={petName}
                                                width={36}
                                                height={36}
                                                className="h-full w-full object-cover"
                                              />
                                            ) : (
                                              <span
                                                role="img"
                                                aria-label={petName}
                                                className="block h-full w-full bg-no-repeat"
                                                style={{
                                                  backgroundImage:
                                                    "url('/images/pet-default-avatars-v2.png')",
                                                  backgroundPosition:
                                                    petAvatarPosition(
                                                      pet.petType,
                                                    ),
                                                  backgroundSize:
                                                    "400% auto",
                                                }}
                                              />
                                            )}
                                          </div>
                                          <span
                                            className="w-full truncate text-[11px] font-bold text-[#2B231D]"
                                            title={petName}
                                          >
                                            {petName}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </td>
                              ) : null}

                              {supply.categoryRowSpan &&
                              supply.categoryRowSpan > 0 ? (
                                <td
                                  rowSpan={supply.categoryRowSpan}
                                  className="py-3 px-3 align-middle bg-white border-r border-[#EDE8E1]"
                                >
                                  <span
                                    className={cn(
                                      "inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold tracking-tight shadow-2xs",
                                      badge.className,
                                    )}
                                  >
                                    <badge.Icon className="h-3.5 w-3.5 shrink-0" />
                                    <span>{badge.label}</span>
                                  </span>
                                </td>
                              ) : null}

                              <td className="py-3 px-3 align-middle font-bold text-[#2B231D] border-r border-[#EDE8E1]">
                                {supply.label}
                              </td>

                              {supply.providerRowSpan &&
                              supply.providerRowSpan > 0 ? (
                                <td
                                  rowSpan={supply.providerRowSpan}
                                  className="py-3 px-3 align-middle text-center bg-white"
                                >
                                  <span
                                    className={cn(
                                      "inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                                      sitterProvides
                                        ? "bg-amber-200 text-amber-950"
                                        : "border border-emerald-200/60 bg-emerald-50 text-emerald-800",
                                    )}
                                  >
                                    {sitterProvides
                                      ? displayCopy.sitterProvides
                                      : displayCopy.ownerProvides}
                                  </span>
                                </td>
                              ) : null}
                            </tr>
                          );
                        });
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p className="py-4 text-sm leading-6 text-[#706A60]">
                    {displayCopy.noSupplies}
                  </p>
                )}
                {boardingSupplyNotes ? (
                  <div className="mt-3.5 rounded-xl border border-amber-200/90 bg-[#FFF9EE] p-4 text-xs sm:text-sm shadow-2xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#8A5D34]">
                      <PiFileText size={16} />
                      <span>{displayCopy.additionalSupplyNotes}</span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap leading-relaxed text-[#514956]">
                      {boardingSupplyNotes}
                    </p>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {/* Section: 🛡️ Requirements / Home Fit */}
          {displayRequirements.length > 0 || requirementsNotes.trim() || homeFitNotes.trim() ? (
            <section className="space-y-3 border-t border-[#E7E0D8]/80 pt-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PiShieldCheck size={22} className="text-primary" />
                  <h2 className="font-sans text-lg font-extrabold tracking-[-0.01em] text-[#2B231D] sm:text-xl">
                    {careType === "boarding"
                      ? displayCopy.homeFit
                      : displayCopy.requirements}
                  </h2>
                </div>
                {onEditStep && (
                  <button
                    type="button"
                    onClick={() => onEditStep("requirements")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary transition hover:underline"
                  >
                    <PiPencilSimple size={14} />
                    {t.core.management.actions.edit}
                  </button>
                )}
              </div>

              {careType === "boarding" ? (
                (() => {
                  const required = displayRequirements.filter(
                    (req) => req.kind === "ENVIRONMENT_REQUIRED",
                  );
                  const avoid = displayRequirements.filter(
                    (req) =>
                      req.kind === "UNACCEPTABLE" || req.kind === "WARNING",
                  );
                  const additional = displayRequirements.filter(
                    (req) => req.kind === "OTHER_NEED",
                  );
                  const note = homeFitNotes.trim();

                  return (
                    <div className="space-y-4 pl-[30px] pr-3 sm:pr-4">
                      {required.length > 0 && (
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={17} className="shrink-0 text-emerald-600" />
                            <h3 className="text-sm font-bold text-[#2B231D] sm:text-base">
                              {displayCopy.homeRequired}
                            </h3>
                          </div>
                          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                            {required.map((req, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-950 sm:text-sm"
                              >
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-[10px] font-bold text-emerald-800">
                                  ✓
                                </span>
                                <span className="leading-snug">{req.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {avoid.length > 0 && (
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2">
                            <AlertCircle size={17} className="shrink-0 text-amber-600" />
                            <h3 className="text-sm font-bold text-[#2B231D] sm:text-base">
                              {displayCopy.homeAvoid}
                            </h3>
                          </div>
                          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                            {avoid.map((req, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2.5 rounded-xl border border-amber-200/60 bg-[#FFFDF9] px-3.5 py-2.5 text-xs font-semibold text-amber-950 sm:text-sm"
                              >
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-800">
                                  ✕
                                </span>
                                <span className="leading-snug">{req.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {additional.length > 0 || note ? (
                        <div className="rounded-xl border border-amber-200/90 bg-[#FFF9EE] p-4 text-xs sm:text-sm shadow-2xs">
                          <div className="flex items-center gap-1.5 font-bold text-[#8A5D34]">
                            <PiFileText size={16} />
                            <span>{displayCopy.additionalHomeFitNotes}</span>
                          </div>
                          <div className="mt-1.5 space-y-2 leading-relaxed text-[#514956]">
                            {additional.map((req, idx) => (
                              <p key={idx} className="whitespace-pre-wrap">
                                {req.label}
                              </p>
                            ))}
                            {note ? <p className="whitespace-pre-wrap">{note}</p> : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })()
              ) : (
                <div className="space-y-3 pl-[30px] pr-3 sm:pr-4">
                  {displayRequirements.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {displayRequirements.map((req, idx) => {
                        const caution =
                          req.kind === "UNACCEPTABLE" || req.kind === "WARNING";
                        return (
                          <div
                            key={idx}
                            className={cn(
                              "flex items-start gap-2.5 rounded-2xl border p-3.5 text-xs font-semibold shadow-2xs",
                              caution
                                ? "border-amber-200 bg-amber-50 text-amber-950"
                                : "border-emerald-200 bg-emerald-50 text-emerald-950",
                            )}
                          >
                            {caution ? (
                              <AlertCircle size={16} className="shrink-0 text-amber-700" />
                            ) : (
                              <CheckCircle2 size={16} className="shrink-0 text-emerald-700" />
                            )}
                            <div>
                              <p className="mb-1 font-black">
                                {caution ? displayCopy.cautions : displayCopy.sitterRequirements}
                              </p>
                              <span>{req.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                  {requirementsNotes.trim() ? (
                    <div className="rounded-xl border border-amber-200/90 bg-[#FFF9EE] p-4 text-xs text-[#514956] shadow-2xs sm:text-sm">
                      <div className="flex items-center gap-1.5 font-bold text-[#8A5D34]">
                        <PiFileText size={16} />
                        <span>{displayCopy.additionalRequirementNotes}</span>
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap leading-relaxed">
                        {requirementsNotes.trim()}
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </section>
          ) : null}

          {/* Section: 📍 Location & Map Section matching public-need-detail.tsx 100% */}
          <section className="space-y-3 border-t border-[#E7E0D8]/80 pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={22} className="text-primary" />
                <h2 className="font-sans text-lg font-extrabold tracking-[-0.01em] text-[#2B231D] sm:text-xl">
                  {careType === "visit"
                    ? displayCopy.homeLocation
                    : careType === "boarding"
                      ? displayCopy.boardingLocation
                      : displayCopy.customLocation}
                </h2>
              </div>
              {onEditStep && (
                <button
                  type="button"
                  onClick={() => onEditStep("area")}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary transition hover:underline"
                >
                  <PiPencilSimple size={14} />
                  {t.core.management.actions.edit}
                </button>
              )}
            </div>
            <div className="pl-[30px] pr-3 sm:pr-4">
              {careType === "boarding" ? (
                <div className="mb-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-primary">
                        {displayCopy.departureAreaLabel}:
                      </span>
                      <span className="font-bold text-[#2B231D]">
                        {fullLocationLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-primary">
                        {displayCopy.distancePreferenceLabel}:
                      </span>
                      <span className="font-bold text-[#2B231D]">
                        {distance && distance !== "No preference"
                          ? displayCopy.distancePreference(
                              distance.startsWith("Custom:")
                                ? distance.slice(7).trim()
                                : distance,
                            )
                          : displayCopy.noDistancePreference}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-primary">
                        {displayCopy.handoffLabel}:
                      </span>
                      <span className="font-bold text-[#2B231D]">
                        {formatTransportModeLabel(
                          transport === "owner"
                            ? "OWNER"
                            : transport === "sitter"
                              ? "PROVIDER"
                              : transport === "taxi"
                                ? "TAXI"
                                : "DISCUSS",
                          lang,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-3 flex items-center gap-2 text-xs sm:text-sm">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-primary">
                    {careType === "visit"
                      ? displayCopy.homeVisitAreaLabel
                      : displayCopy.serviceLocationLabel}
                    :
                  </span>
                  <span className="font-bold text-[#2B231D]">
                    {fullLocationLabel}
                  </span>
                </div>
              )}

              {/* Map View matching public-need-detail.tsx */}
              <div className="relative h-60 w-full overflow-hidden rounded-xl border border-[#EDE8E1]">
                <MapLibreMap
                  lat={mapLat}
                  lon={mapLon}
                  zoom={13}
                  editable={false}
                  showPrimaryMarker={true}
                  primaryMarkerLabel={displayCopy.ownerMapLocation}
                  primaryMarkerColor={modeColorMap[modeCode] || "#059669"}
                  fitToMarkers={Boolean(
                    careType === "boarding" &&
                      distance &&
                      distance !== "No preference",
                  )}
                  showPrivacyRadius={false}
                  searchRadiusKm={
                    careType === "boarding" && distance && distance !== "No preference"
                      ? (() => {
                          const match = distance.match(/(\d+(?:\.\d+)?)/);
                          return match ? parseFloat(match[1]) : null;
                        })()
                      : null
                  }
                  scrollZoom={true}
                />

                {/* Floating Legend Pin matching public-need-detail.tsx */}
                <div className="pointer-events-none absolute right-3 top-3 z-10 flex flex-col gap-1.5 rounded-2xl border border-slate-200/80 bg-white/95 px-3 py-2 text-[11px] font-bold text-slate-800 shadow-md backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-slate-900">
                    <svg
                      width="13"
                      height="17"
                      viewBox="0 0 28 35"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="shrink-0 drop-shadow-sm"
                      aria-hidden="true"
                    >
                      <path
                        d="M14 1C6.82 1 1 6.82 1 14C1 23.5 14 34 14 34C14 34 27 23.5 27 14C27 6.82 21.18 1 14 1Z"
                        fill={modeColorMap[modeCode] || "#059669"}
                        stroke="white"
                        strokeWidth="2"
                      />
                      <circle cx="14" cy="14" r="4.5" fill="white" />
                    </svg>
                    <span className="truncate">{displayCopy.ownerMapLocation}</span>
                  </div>
                </div>
              </div>

              <p className="mt-3 flex items-start gap-2 leading-6 text-sm text-amber-800">
                <AlertCircle
                  size={17}
                  className="mt-1 shrink-0 text-amber-600"
                />
                <span>
                  {careType === "visit"
                    ? displayCopy.homeLocationHint
                    : careType === "boarding"
                      ? displayCopy.boardingLocationHint
                      : displayCopy.customLocationHint}
                </span>
              </p>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: NeedActionSidebar matching public-need-detail.tsx & need-action-sidebar.tsx 100% */}
        <aside className="w-full px-0 py-0 lg:sticky lg:top-0 lg:w-[328px] lg:shrink-0 lg:px-1 lg:py-1 xl:w-[344px] 2xl:w-[352px]">
          <div className="space-y-3 rounded-3xl border border-[#EDE8E1] bg-white p-4 shadow-sm lg:max-h-[calc(100dvh-11rem)] lg:overflow-y-auto">
            {/* 1. Calendar Slot (matching NeedActionSidebar top position) */}
            <div>
              <NeedCalendarView item={calendarItem} lang={lang} />
              {modeCode !== "HOME_VISIT" && dates.notes ? (
                <div className="mt-3 max-h-28 overflow-y-auto rounded-xl bg-[#FAF6F0] p-3 text-xs leading-5 text-[#514956]">
                  <p className="font-bold text-[#8A5D34]">{displayCopy.scheduleNote}</p>
                  <p className="mt-1 whitespace-pre-wrap">{dates.notes}</p>
                </div>
              ) : null}
            </div>

            {/* 2. Amount & Breakdown Section (matching NeedActionSidebar middle position) */}
            <div className="space-y-3 pt-3 border-t border-[#F2EFE9]">
              {/* Big Price Display & Formula */}
              <div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="whitespace-nowrap font-sans text-xl font-black tracking-tight text-primary sm:text-2xl xl:text-[1.65rem]">
                    {bigPriceText}
                  </span>
                  {bigPriceSubLabel ? (
                    <span className="text-xs font-semibold text-slate-500">
                      {bigPriceSubLabel}
                    </span>
                  ) : null}
                  {pricing.isNegotiable && !isCareOpen && !isCareRange ? (
                    <span className="rounded-full bg-purple-50 border border-purple-200/80 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {displayCopy.negotiable}
                    </span>
                  ) : null}
                </div>

                {/* Formula & Note subline */}
                {formulaText || statusNoteText ? (
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                    {formulaText ? (
                      <span className="font-bold text-[#514956]">
                        {formulaText}
                      </span>
                    ) : null}
                    {formulaText && statusNoteText ? (
                      <span className="text-[#D8D0C5]">•</span>
                    ) : null}
                    {statusNoteText ? (
                      <span className="text-[11px] font-medium text-[#8C8479]">
                        {statusNoteText}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {/* Rate Breakdown Items (matching NeedActionSidebar breakdown rows) */}
              {modeCode === "HOME_VISIT" ? (
                <div className="space-y-2 text-xs font-semibold text-[#706A60] pt-1">
                  <div className="flex justify-between">
                    <span>{displayCopy.totalVisits}</span>
                    <span className="font-extrabold text-[#2B231D]">
                      {displayCopy.totalVisitsCount(totalVisitsCount)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>{displayCopy.careUnitPriceVisit}</span>
                    <span className="font-extrabold text-[#2B231D]">
                      {careUnitPriceDisplay}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>{displayCopy.travelFeeVisit}</span>
                    <span className="font-extrabold text-[#2D6A4F]">
                      {travelFeeDisplay}
                    </span>
                  </div>
                </div>
              ) : modeCode === "BOARDING" ? (
                <div className="space-y-2 text-xs font-semibold text-[#706A60] pt-1">
                  <div className="flex justify-between">
                    <span>{displayCopy.totalNights}</span>
                    <span className="font-extrabold text-[#2B231D]">
                      {displayCopy.totalNightsCount(nightsTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{displayCopy.nightlyRate}</span>
                    <span className="font-extrabold text-[#2B231D]">
                      {careUnitPriceDisplay}
                    </span>
                  </div>
                  {sitterSupplyCount > 0 && (
                    <div className="flex justify-between">
                      <span>{displayCopy.supplyFee}</span>
                      <span className="font-extrabold text-[#2D6A4F]">
                        {supplyCostValueText}
                      </span>
                    </div>
                  )}
                  {boardingTransportApplies && (
                    <div className="flex justify-between">
                      <span>{displayCopy.travelFee}</span>
                      <span className="font-extrabold text-[#2D6A4F]">
                        {transportCostValueText}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 text-xs font-semibold text-[#706A60] pt-1">
                  <div className="flex justify-between">
                    <span>{displayCopy.careServiceFee}</span>
                    <span className="font-extrabold text-[#2B231D]">
                      {careUnitPriceDisplay}
                    </span>
                  </div>
                  {travelMode !== "NONE" && (
                    <div className="flex justify-between">
                      <span>{displayCopy.travelFee}</span>
                      <span className="font-extrabold text-[#2D6A4F]">
                        {travelFeeDisplay}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick-Edit Action Link for Budget */}
            {onEditStep && (
              <div className="pt-3 border-t border-[#F2EFE9]">
                <button
                  type="button"
                  onClick={() => onEditStep("budget")}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 py-2.5 text-xs font-bold text-primary transition hover:bg-primary/10"
                >
                  <PiPencilSimple size={15} />
                  <span>{t.core.management.actions.edit} {flowCopy.steps.budget}</span>
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

// Compatibility exports
export const PreviewScreen = StepPreview;
export const GuidedNeedPreviewStep = StepPreview;
