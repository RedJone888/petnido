"use client";

import Image from "next/image";
import type { IconType } from "react-icons";
import {
  PiBagSimple, PiBed, PiBird, PiCat, PiCheck, PiDog, PiFeather, PiFirstAidKit, PiFlag, PiForkKnife,
  PiGrains, PiHouseSimple, PiJar, PiLinkSimple, PiPackage, PiPawPrint,
  PiPintGlass, PiPlusCircle, PiSuitcase, PiTennisBall, PiToiletPaper, PiToolbox,
  PiCheckCircle, PiRabbit, PiSparkle, PiTowel, PiWarningCircle,
} from "react-icons/pi";

import cn from "@/lib/cn";
import type { Lang } from "@/domain/lang/types";
import { resolveOtherPetTypeKey } from "@/domain/pet/profile-options";
import { boardingNights } from "@/domain/publishing/boarding-date-math";
import type {
  BoardingRoutine, BudgetDraft, CareType, PetDraft, SupplyCostMode, TaskPlan, TaskPriority,
} from "@/domain/publishing/legacy-need-draft-v3";
import {
  CARE_TYPES,
  PET_TYPE_KEYS,
  PET_TYPE_ICONS,
  getCareTypeIcon,
  getPetTypeIcon,
  type PetTypeKey,
} from "@/domain/care/care-icons";
import {
  normalizePetTypeSelection,
  petTypeLabel,
} from "@/modules/need-publishing/domain/pet-types";
import {
  formatPetAge as formatDomainPetAge,
  formatPetGenderAndNeuter,
} from "@/domain/pet/presentation";
import { petAvatarPosition } from "@/domain/pet/avatar";

export { boardingNights } from "@/domain/publishing/boarding-date-math";

export type SavedPetOption = {
  id: string;
  name: string | null;
  type: string;
  customType: string | null;
  quantity: number;
  breed: string | null;
  birthDate: Date | string | null;
  weightGrams: number | null;
  sex: string | null;
  neutered: string | null;
  notes: string | null;
  photos: Array<{ id: string; url: string }>;
};

export const petTypes = PET_TYPE_KEYS.map((id) => ({
  id,
  label: { dog: "Dog", cat: "Cat", rabbit: "Rabbit", bird: "Bird", other: "Other" }[id],
  detail: id === "other" ? "Tell us the pet type" : "",
  icon: PET_TYPE_ICONS[id],
}));

export const timeOptions = [
  { value: "flexible", label: "Any time" },
  { value: "morning", label: "Morning" },
  { value: "midday", label: "Midday" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "exact", label: "Exact time" },
];

export function parseDateValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return Number.isFinite(date.getTime()) ? date : undefined;
}



export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}



export function toDateValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}



export function buildVisitDates({
  dates,
  visitFrequency,
  customInterval,
  firstVisitDate,
}: {
  dates: { startDate: string; endDate: string };
  visitFrequency: string;
  customInterval: number;
  firstVisitDate: string;
}) {
  const start = parseDateValue(dates.startDate);
  const end = parseDateValue(dates.endDate);
  if (!start || !end || start > end) return [];

  const requestedFirst = parseDateValue(firstVisitDate);
  const first =
    requestedFirst && requestedFirst >= start && requestedFirst <= end
      ? requestedFirst
      : start;
  const interval =
    visitFrequency === "every-2-days"
      ? 2
      : visitFrequency === "every-3-days"
        ? 3
        : visitFrequency === "custom"
          ? Math.max(1, customInterval || 1)
          : 1;
  const result: string[] = [];
  const cursor = new Date(first);
  let guard = 0;
  while (cursor <= end && guard < 3660) {
    const value = toDateValue(cursor);
    result.push(value);
    cursor.setDate(cursor.getDate() + interval);
    guard += 1;
  }
  return result;
}



export function buildVisitDateCandidates({
  dates,
  visitFrequency,
  customInterval,
  firstVisitDate,
}: {
  dates: { startDate: string; endDate: string };
  visitFrequency: string;
  customInterval: number;
  firstVisitDate: string;
}) {
  return buildVisitDates({
    dates,
    visitFrequency,
    customInterval,
    firstVisitDate,
  });
}



export function ChoiceRow({
  label,
  active,
  onClick,
  checkbox = false,
  fitContent = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  checkbox?: boolean;
  fitContent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[58px] items-center gap-3 rounded-[14px] border px-4 text-left text-sm font-bold transition",
        fitContent ? "w-auto" : "w-full",
        active
          ? "border-[var(--primary)] bg-[var(--primary-subtle)] text-[#35243f] ring-1 ring-[var(--primary)]"
          : "border-[#ded9e0] bg-white text-[#554e59] hover:border-[var(--primary-border)]",
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center border",
          checkbox ? "rounded-md" : "rounded-full",
          active
            ? "border-[var(--primary)] bg-[var(--primary)] text-white"
            : "border-[#bcb5bf]",
        )}
      >
        {active && <PiCheck size={14} />}
      </span>
      {label}
    </button>
  );
}


export function PillChoice({
  label,
  active,
  onClick,
  prominent = false,
  className = "",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  prominent?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 font-bold outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2",
        prominent ? "text-sm" : "text-xs",
        active
          ? "border-[var(--primary)] bg-[var(--primary)] text-white"
          : "border-[#ded9e0] bg-white text-[#706a78]",
        className,
      )}
    >
      {label}
    </button>
  );
}



export function TaskPriorityButtons({
  value,
  onChange,
  mustLabel,
  ifTimeLabel,
}: {
  value: TaskPriority;
  onChange: (value: TaskPriority) => void;
  mustLabel: string;
  ifTimeLabel: string;
}) {
  return (
    <div className="flex flex-nowrap gap-1">
      <button
        type="button"
        aria-pressed={value === "must"}
        onClick={() => onChange("must")}
        className={cn(
          "inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-full border px-2 text-[10px] font-bold shadow-sm transition",
          value === "must"
            ? "border-amber-400 bg-amber-100 text-amber-900 ring-1 ring-amber-200"
            : "border-[#d7d0da] bg-white text-[#706a78] hover:border-amber-300 hover:bg-amber-50",
        )}
      >
        <PiCheckCircle size={12} />
        {mustLabel}
      </button>
      <button
        type="button"
        aria-pressed={value === "nice"}
        onClick={() => onChange("nice")}
        className={cn(
          "inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-full border px-2 text-[10px] font-bold shadow-sm transition",
          value === "nice"
            ? "border-sky-300 bg-sky-100 text-sky-800 ring-1 ring-sky-100"
            : "border-[#d7d0da] bg-white text-[#706a78] hover:border-sky-300 hover:bg-sky-50",
        )}
      >
        <PiFlag size={11} />
        {ifTimeLabel}
      </button>
    </div>
  );
}


export function BudgetChoice({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 min-w-0 items-center gap-2.5 whitespace-normal rounded-xl border px-3.5 py-2 text-left text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2",
        active
          ? "border-[var(--primary-border)] bg-[var(--primary-subtle)] text-[var(--primary-strong)]"
          : "border-[#d8d1db] bg-white text-[#625c68] hover:border-[var(--primary-border)] hover:bg-[#fbf9fc]",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition",
          active
            ? "border-[var(--primary)] bg-[var(--primary)] text-white"
            : "border-[#bdb5c1] bg-white text-transparent",
        )}
      >
        <PiCheck size={11} />
      </span>
      <span>{label}</span>
    </button>
  );
}


export function Field({
  label,
  optional,
  hint,
  hintInline = false,
  hintInlineRight = false,
  as = "label",
  children,
}: {
  label: string;
  optional?: boolean;
  hint?: string;
  hintInline?: boolean;
  hintInlineRight?: boolean;
  as?: "label" | "div";
  children: React.ReactNode;
}) {
  const Wrapper = as;
  return (
    <Wrapper className="block">
      <span className="mb-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
        {label}
        {optional && (
          <span className="text-[9px] font-semibold normal-case tracking-normal text-[#aaa4ae]">
            Optional
          </span>
        )}
        {hint && hintInline && (
          <span
            className={cn(
              "text-[10px] font-semibold normal-case tracking-normal text-[#817a85]",
              hintInlineRight &&
                "basis-full whitespace-normal text-[11px] font-medium leading-4 text-[#9a939f] sm:ml-auto sm:basis-auto sm:whitespace-nowrap",
            )}
          >
            {hint}
          </span>
        )}
      </span>
      {children}
      {hint && !hintInline && (
        <span className="mt-1.5 block text-xs leading-5 text-[#817a85]">
          {hint}
        </span>
      )}
    </Wrapper>
  );
}


export function BudgetFieldLabel({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "default" | "muted";
}) {
  const [title, detail] = label.split(" · ");
  return (
    <span
      className={cn(
        "mb-2 flex items-baseline gap-1.5",
        variant === "muted"
          ? "text-xs font-bold text-[#514a58]"
          : "text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]",
      )}
    >
      <span className="whitespace-nowrap">{title}</span>
      {detail && (
        <span
          className={cn(
            "whitespace-nowrap normal-case tracking-normal",
            variant === "muted"
              ? "text-[10px] font-semibold text-[#817a85]"
              : "text-[9px] font-semibold text-[#9b939e]",
          )}
        >
          {detail}
        </span>
      )}
    </span>
  );
}


export function MoneyField({
  label,
  symbol,
  currencyLabel,
  value,
  onChange,
  error = "",
}: {
  label: string;
  symbol: string;
  currencyLabel: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <label className="block">
      <BudgetFieldLabel label={label} />
      <div className="relative">
        <div
          className={cn(
            "flex h-12 overflow-hidden rounded-xl border border-[#ddd6e0] bg-[#fcfbfd] transition focus-within:border-[var(--primary)] focus-within:bg-white focus-within:ring-4 focus-within:ring-[var(--primary-fixed)]",
            error &&
              "border-danger-border focus-within:border-danger-text focus-within:ring-danger-ring",
          )}
        >
          <span className="flex w-11 shrink-0 items-center justify-center border-r border-[#e5dfe7] bg-white/70 text-sm font-bold text-[var(--primary)]">
            {symbol}
          </span>
          <input
            inputMode="numeric"
            aria-invalid={Boolean(error)}
            value={value}
            onChange={(event) =>
              onChange(event.target.value.replace(/\D/g, ""))
            }
            className="money-input min-w-0 flex-1 bg-transparent px-3 text-base font-bold tabular-nums text-[#352f39] outline-none placeholder:font-medium placeholder:text-[#b5afb8]"
            placeholder="0"
          />
          <span className="flex shrink-0 items-center border-l border-[#e5dfe7] bg-white/55 px-3 text-[11px] font-semibold text-[#8f8793]">
            {currencyLabel}
          </span>
        </div>
        {error && (
          <span
            role="alert"
            className="pointer-events-none absolute left-0 top-[calc(100%+2px)] z-10 inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-danger-text"
          >
            <PiWarningCircle className="shrink-0" size={13} />
            {error}
          </span>
        )}
      </div>
    </label>
  );
}


export function CompactMoneyField({
  label,
  labelVariant = "default",
  symbol,
  currencyLabel,
  value,
  onChange,
  error = "",
}: {
  label: string;
  labelVariant?: "default" | "muted";
  symbol: string;
  currencyLabel: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <label className="block">
      <BudgetFieldLabel label={label} variant={labelVariant} />
      <div className="relative">
        <div
          className={cn(
            "flex h-12 overflow-hidden rounded-xl border border-[#ddd6e0] bg-[#fcfbfd] transition focus-within:border-[var(--primary)] focus-within:bg-white focus-within:ring-4 focus-within:ring-[var(--primary-fixed)]",
            error &&
              "border-danger-border focus-within:border-danger-text focus-within:ring-danger-ring",
          )}
        >
          <span className="flex w-10 shrink-0 items-center justify-center border-r border-[#e5dfe7] bg-white/70 text-sm font-bold text-[var(--primary)]">
            {symbol}
          </span>
          <input
            inputMode="numeric"
            aria-invalid={Boolean(error)}
            value={value}
            onChange={(event) =>
              onChange(event.target.value.replace(/\D/g, ""))
            }
            className="money-input min-w-0 flex-1 bg-transparent px-3 text-base font-bold tabular-nums text-[#352f39] outline-none placeholder:font-medium placeholder:text-[#b5afb8]"
            placeholder="0"
          />
          <span className="flex shrink-0 items-center border-l border-[#e5dfe7] bg-white/55 px-3 text-[11px] font-semibold text-[#8f8793]">
            {currencyLabel}
          </span>
        </div>
        {error && (
          <span
            role="alert"
            className="pointer-events-none absolute left-0 top-[calc(100%+2px)] z-10 inline-flex items-center gap-1 whitespace-nowrap text-[10px] font-medium text-danger-text"
          >
            <PiWarningCircle className="shrink-0" size={12} />
            {error}
          </span>
        )}
      </div>
    </label>
  );
}


export function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.13em] text-[#8a5d34]">
        {title}
      </h3>
      {children}
    </section>
  );
}


export function CompactReviewCard({
  title,
  value,
  detail = "",
  invalid = false,
  children,
}: {
  title: string;
  value: string;
  detail?: string;
  invalid?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section
      data-invalid={invalid || undefined}
      className={cn(
        "min-w-0 rounded-xl border px-3.5 py-3",
        invalid
          ? "border-danger-border bg-[#fffafa]"
          : "border-[#eee9ef] bg-[#fdfcfa]",
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a5d34]">
        {title}
      </p>
      <p
        className={cn(
          "mt-1 text-sm font-bold leading-5",
          invalid ? "text-danger-text" : "text-[#302a34]",
        )}
      >
        {value}
      </p>
      {detail && (
        <p className="mt-0.5 text-[11px] font-semibold leading-4 text-[#706a78]">
          {detail}
        </p>
      )}
      {children}
    </section>
  );
}


export function ReviewMetric({
  label,
  value,
  detail,
  invalid = false,
}: {
  label: string;
  value: string;
  detail?: string;
  invalid?: boolean;
}) {
  return (
    <div className="min-w-0" aria-invalid={invalid}>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-sm font-bold leading-5",
          invalid ? "text-danger-text" : "text-[#302a34]",
        )}
      >
        {value}
      </p>
      {detail && (
        <p
          className={cn(
            "mt-0.5 text-[10px] font-semibold",
            invalid ? "text-danger-text" : "text-[#817a85]",
          )}
        >
          {detail}
        </p>
      )}
    </div>
  );
}


export function ReviewStat({
  label,
  value,
  accent = false,
  invalid = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  invalid?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        invalid
          ? "border-danger-border bg-danger-bg"
          : "border-transparent bg-[#f7f4f7]",
      )}
    >
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 truncate text-sm font-bold",
          accent && "text-[var(--primary)]",
          invalid && "text-danger-text",
        )}
      >
        {value}
      </p>
    </div>
  );
}



export const inputClass =
  "h-12 w-full rounded-[12px] border border-[#ded9e0] bg-white px-4 text-sm outline-none transition placeholder:text-[#aaa4ae] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-fixed)]";


export const textareaClass = cn(inputClass, "block h-24 resize-none py-3");


export function findScrollContainer(element: HTMLElement) {
  let parent = element.parentElement;
  while (parent) {
    const overflowY = getComputedStyle(parent).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") return parent;
    parent = parent.parentElement;
  }
  return document.scrollingElement as HTMLElement;
}


export function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}


export function toggleNumber(values: number[], value: number) {
  return values.includes(value)
    ? values.length > 1
      ? values.filter((item) => item !== value)
      : values
    : [...values, value].sort((a, b) => a - b);
}


export function petDisplayType(pet: PetDraft, lang: Lang = "en") {
  const normalized = normalizePetTypeSelection(
    pet.typeCode ?? pet.type,
    pet.otherType,
  );
  return normalized.petType === "OTHER"
    ? normalized.customPetType || petTypeLabel("OTHER", lang)
    : petTypeLabel(normalized.petType, lang);
}



export function petGroupKey(pet: PetDraft) {
  const normalized = normalizePetTypeSelection(
    pet.typeCode ?? pet.type,
    pet.otherType,
  );
  return normalized.petType === "OTHER"
    ? `OTHER:${normalized.customPetType?.normalize("NFKC").trim().toLocaleLowerCase() ?? "unassigned"}`
    : normalized.petType;
}



export function savedPetAvatarPosition(pet: SavedPetOption) {
  const type = pet.type.trim().toUpperCase();
  const legacyOtherTypeKeys: Record<string, string> = {
    HAMSTER: "hamster",
    GUINEA_PIG: "guinea-pig",
    CHINCHILLA: "chinchilla",
  };
  const key =
    legacyOtherTypeKeys[type] ??
    (type === "OTHER" ? (pet.customType ?? "OTHER") : type);
  return petAvatarPosition(key);
}

export function draftPetAvatarPosition(pet: PetDraft) {
  const type = pet.type.trim().toUpperCase();
  const key = type === "OTHER" ? (pet.otherType || "OTHER") : type;
  return petAvatarPosition(key);
}



export function PetDraftAvatar({ pet }: { pet: PetDraft }) {
  return pet.photo ? (
    <Image
      src={pet.photo}
      alt={pet.name || petDisplayType(pet) || "Pet"}
      width={80}
      height={80}
      unoptimized
      className="h-full w-full object-cover"
    />
  ) : (
    <span
      aria-hidden="true"
      className="block h-full w-full bg-[#fff8e8] bg-no-repeat"
      style={{
        backgroundImage: "url('/images/pet-default-avatars-v2.png')",
        backgroundPosition: draftPetAvatarPosition(pet),
        backgroundSize: "400% auto",
      }}
    />
  );
}



export function SavedPetAvatar({ pet }: { pet: SavedPetOption }) {
  return pet.photos[0]?.url ? (
    <Image
      src={pet.photos[0].url}
      alt={pet.name || pet.customType || pet.type}
      width={80}
      height={80}
      unoptimized
      className="h-full w-full object-cover"
    />
  ) : (
    <span
      aria-hidden="true"
      className="block h-full w-full bg-[#fff8e8] bg-no-repeat"
      style={{
        backgroundImage: "url('/images/pet-default-avatars-v2.png')",
        backgroundPosition: savedPetAvatarPosition(pet),
        backgroundSize: "400% auto",
      }}
    />
  );
}



export function isValidPetBirthDate(value: string) {
  const birthDate = parseDateValue(value);
  if (!birthDate) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return birthDate <= today;
}



export function formatPetAge(value: string) {
  return formatDomainPetAge(value, "en") || "";
}



export function petCardDetails(pet: PetDraft) {
  return [
    pet.breed.trim(),
    formatPetAge(pet.birthDate),
    pet.weight.trim() ? `${pet.weight.trim()} ${pet.weightUnit}` : "",
    formatPetSex(pet.sex),
    formatNeuteredStatus(pet),
  ]
    .filter(Boolean)
    .slice(0, 3)
    .join(" · ");
}



export function formatPetSex(value: string, lang: Lang = "en") {
  const info = formatPetGenderAndNeuter(value, null, lang);
  return info?.sexLabel || "";
}

export function formatNeuteredStatus(pet: PetDraft, lang: Lang = "en") {
  const info = formatPetGenderAndNeuter(pet.sex, pet.neutered, lang);
  return info?.neuteredLabel || "";
}

export function previewPetDetails(pet: PetDraft, lang: Lang = "en") {
  const info = formatPetGenderAndNeuter(pet.sex, pet.neutered, lang);
  const neuteredLabel =
    pet.sex === "female"
      ? (info?.neuteredLabel || "Spayed")
      : pet.sex === "male"
        ? (info?.neuteredLabel || "Neutered")
        : (info?.neuteredLabel || "Spayed/neutered");

  return [
    { label: "Breed", value: pet.breed.trim() },
    { label: "Age", value: formatPetAge(pet.birthDate) },
    {
      label: "Weight",
      value: pet.weight.trim() ? `${pet.weight.trim()} ${pet.weightUnit}` : "",
    },
    { label: "Sex", value: formatPetSex(pet.sex, lang) },
    { label: "Neutered", value: formatNeuteredStatus(pet, lang) },
  ].filter((detail) => detail.value);
}

export function previewNeuteredStatus(pet: PetDraft, lang: Lang = "en") {
  return formatNeuteredStatus(pet, lang);
}



export function buildPetCareGroups(
  pets: PetDraft[],
  displayType: (pet: PetDraft) => string = petDisplayType,
) {
  const groups = new Map<string, PetDraft[]>();
  pets.forEach((pet) => {
    const key = petGroupKey(pet);
    groups.set(key, [...(groups.get(key) ?? []), pet]);
  });
  return Array.from(groups.entries()).map(([key, members]) => ({
    key,
    petIds: members.map((pet) => pet.id),
    label: `${displayType(members[0]) || "Pet"}: ${members.map((pet) => pet.name || "Unnamed").join(" & ")}`,
  }));
}



export function taskPetLabelText(
  task: Pick<TaskPlan, "petIds">,
  pets: PetDraft[],
  petCareGroups: Array<{ petIds: string[] }>,
  displayType: (pet: PetDraft) => string = petDisplayType,
) {
  const selectedIds = new Set(task.petIds);
  if (pets.length && pets.every((pet) => selectedIds.has(pet.id))) {
    return "All pets";
  }

  const petsById = new Map(pets.map((pet) => [pet.id, pet]));
  return petCareGroups
    .flatMap((group) => group.petIds)
    .filter((petId) => selectedIds.has(petId))
    .map((petId) => {
      const pet = petsById.get(petId);
      if (!pet) return "";
      return pet.name || displayType(pet) || `Pet ${pets.indexOf(pet) + 1}`;
    })
    .filter(Boolean)
    .join(", ");
}



export function petIdsLabel(
  petIds: string[],
  pets: PetDraft[],
  displayType: (pet: PetDraft) => string = petDisplayType,
) {
  const petsById = new Map(pets.map((pet) => [pet.id, pet]));
  return petIds
    .map((petId) => {
      const pet = petsById.get(petId);
      if (!pet) return "";
      return pet.name || displayType(pet) || `Pet ${pets.indexOf(pet) + 1}`;
    })
    .filter(Boolean)
    .join(", ");
}



export function groupTasksByPetSet(tasks: TaskPlan[]) {
  const groups = new Map<string, { petIds: string[]; tasks: TaskPlan[] }>();
  tasks.forEach((task) => {
    const petIds = [...task.petIds];
    const key = [...petIds].sort().join("|") || "none";
    const group = groups.get(key) ?? { petIds, tasks: [] };
    group.tasks.push(task);
    group.tasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    groups.set(key, group);
  });
  return Array.from(groups.values());
}

export {
  groupTaskRowsByPetGroup,
  type PetTaskGroupItem,
  type PetTaskState,
  type TaskRowItem,
} from "./task-grouping";



export function togglePetGroup(selectedPetIds: string[], groupPetIds: string[]) {
  const allSelected = groupPetIds.every((petId) =>
    selectedPetIds.includes(petId),
  );
  return allSelected
    ? selectedPetIds.filter((petId) => !groupPetIds.includes(petId))
    : Array.from(new Set([...selectedPetIds, ...groupPetIds]));
}



export function petProfileMissingFields(pet: PetDraft) {
  return [
    ...(!pet.type ? ["Choose a pet type."] : []),
    ...(pet.type.trim().toUpperCase() === "OTHER" && !pet.otherType.trim()
      ? ["Tell us what kind of pet this is."]
      : []),
    ...(!pet.name.trim() ? ["Enter your pet’s name."] : []),
  ];
}



export function isPetProfileComplete(pet: PetDraft) {
  return petProfileMissingFields(pet).length === 0;
}



export function supplyItemIcon(label: string): IconType {
  const value = label.toLowerCase();
  if (value.includes("medication")) return PiFirstAidKit;
  if (value.includes("food bowl") || value.includes("food dish"))
    return PiForkKnife;
  if (value.includes("water")) return PiPintGlass;
  if (value.includes("hay")) return PiGrains;
  if (["wet food", "can", "pouch"].some((word) => value.includes(word)))
    return PiJar;
  if (["dry food", "pellet"].some((word) => value.includes(word)))
    return PiBagSimple;
  if (["treat", "supplement"].some((word) => value.includes(word)))
    return PiPlusCircle;
  if (["bed", "blanket", "bedding"].some((word) => value.includes(word)))
    return PiBed;
  if (["liner", "cover"].some((word) => value.includes(word))) return PiTowel;
  if (["litter", "toilet", "poop"].some((word) => value.includes(word)))
    return PiToiletPaper;
  if (["leash", "harness", "collar"].some((word) => value.includes(word)))
    return PiLinkSimple;
  if (
    ["cage", "enclosure", "habitat", "pen"].some((word) => value.includes(word))
  )
    return PiHouseSimple;
  if (value.includes("perch")) return PiFeather;
  if (value.includes("scratch")) return PiPawPrint;
  if (["toy", "enrichment"].some((word) => value.includes(word)))
    return PiTennisBall;
  if (["carrier", "crate", "container"].some((word) => value.includes(word)))
    return PiSuitcase;
  if (["food", "feed"].some((word) => value.includes(word))) return PiPackage;
  return PiToolbox;
}


export function dateLabel(dates: { startDate: string; endDate: string }) {
  if (dates.startDate && dates.endDate)
    return dates.startDate === dates.endDate
      ? formatDate(dates.startDate)
      : `${formatDate(dates.startDate)} – ${formatDate(dates.endDate)}`;
  if (dates.startDate) return `From ${formatDate(dates.startDate)}`;
  if (dates.endDate) return `Until ${formatDate(dates.endDate)}`;
  return "Dates not added";
}


export function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date)
    : value;
}


export function currencySymbol(currency: string) {
  return (
    { JPY: "¥", USD: "$", EUR: "€", CNY: "¥", TWD: "NT$", KRW: "₩", GBP: "£" }[currency] || currency
  );
}


export function currencyUnitLabel(currency: string) {
  return (
    { JPY: "yen", USD: "dollars", EUR: "euros", CNY: "yuan", TWD: "dollars", KRW: "won", GBP: "pounds" }[
      currency
    ] || currency
  );
}


export function budgetLabel(budget: BudgetDraft, unit: string) {
  if (budget.mode === "open") return "Open to suggestions";
  const symbol = currencySymbol(budget.currency);
  if (budget.mode === "range")
    return budget.amount || budget.maximum
      ? `${symbol}${budget.amount || "0"}–${symbol}${budget.maximum || "?"} ${unit}`
      : "Range not set";
  return budget.amount ? `${symbol}${budget.amount} ${unit}` : "Not set";
}


export function visitTimeLabel(value = "flexible", exact = "") {
  const option =
    timeOptions.find((item) => item.value === value)?.label || "Any time";
  return value === "exact" && exact ? exact : option;
}


export function boardingRoutineScheduleLabel(routine: BoardingRoutine) {
  if (routine.scheduleType === "daily") return "Daily";
  if (routine.scheduleType === "repeating") return "Regularly";
  if (routine.scheduleType === "once") return "Once during the stay";
  return "As needed";
}


export function frequencyLabel(value: string, customInterval: number) {
  if (value === "every-day") return "Every day";
  if (value === "every-2-days") return "Every 2 days";
  if (value === "every-3-days") return "Every 3 days";
  if (value === "custom") return `Every ${customInterval} days`;
  return "Schedule not added";
}


export function dateSpanDays(dates: { startDate: string; endDate: string }) {
  if (!dates.startDate) return 0;
  const start = new Date(`${dates.startDate}T00:00:00`);
  const end = new Date(`${dates.endDate || dates.startDate}T00:00:00`);
  const diff = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  return Number.isFinite(diff) ? Math.max(1, diff) : 0;
}


export function distanceLabel(distance: string) {
  if (distance === "No preference") return "No fixed limit";
  if (distance.startsWith("Custom:"))
    return `Within ${distance.slice(7).trim()}`;
  return `Within ${distance}`;
}


export function boardingTransportLabel(
  transport: string,
  splitDirection: "owner-dropoff" | "sitter-dropoff",
) {
  if (transport === "owner") return "Owner handles drop-off and pickup";
  if (transport === "sitter") return "Sitter handles pickup and return";
  if (transport === "split")
    return splitDirection === "owner-dropoff"
      ? "Owner drops off · sitter returns"
      : "Sitter picks up · owner collects";
  if (transport === "taxi") return "Pet taxi";
  return "Discuss later";
}


export function boardingTransportCostLabel(transport: string, budget: BudgetDraft) {
  if (transport === "owner") return "No sitter transport cost";
  if (transport === "taxi") return "Paid to pet taxi";
  if (transport === "discuss") return "To be discussed";
  if (budget.travelMode === "actual") return "Reimburse actual cost";
  if (budget.travelMode === "discuss") return "To be discussed";
  if (budget.travelMode === "fixed" && budget.travelAmount)
    return `${currencySymbol(budget.currency)}${Number(budget.travelAmount).toLocaleString()} total`;
  return "Not selected";
}
