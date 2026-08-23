"use client";

import { useEffect, useState, type ElementType, type ReactNode } from "react";
import { DayPicker } from "react-day-picker";
import { enUS, ja, zhCN } from "date-fns/locale";
import {
  CalendarDays,
  HeartPulse,
  NotebookText,
  Pencil,
  Plus,
  Scale,
  Trash2,
} from "lucide-react";
import {
  PiCalendarBlank,
  PiCaretDown,
  PiCheckCircle,
  PiGenderFemale,
  PiGenderMale,
  PiPawPrint,
  PiQuestion,
  PiWarningCircle,
  PiXCircle,
} from "react-icons/pi";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/Popover";
import { DatePicker } from "@/components/ui/date-picker";
import { ModalShell } from "@/components/ui/modal-shell";
import { useLanguage } from "@/components/providers/language-provider";
import ImageUploader from "@/components/ui/image-uploader";
import { AppImage } from "@/components/ui/app-image";
import type { ImageItem } from "@/domain/attachment/type";
import type { Lang } from "@/domain/lang/types";
import {
  getOtherPetTypeOptions,
  getPetBreedSuggestions,
  localizeOtherPetType,
  localizePetBreed,
  resolveOtherPetTypeKey,
} from "@/domain/pet/profile-options";
import cn from "@/lib/cn";
import {
  normalizePetTypeSelection,
  petTypeLabel,
} from "@/modules/need-publishing/domain/pet-types";

export const petProfileTypes = [
  "DOG",
  "CAT",
  "RABBIT",
  "BIRD",
  "OTHER",
] as const;

export type PetProfileType = (typeof petProfileTypes)[number];
export type PetProfileTypeSelection = "" | PetProfileType;

export type PetProfileEditorValue = {
  id: string | null;
  name: string;
  type: PetProfileTypeSelection;
  customType: string;
  breed: string;
  birthDate: string;
  weight: string;
  weightUnit: "kg" | "g";
  sex: "" | "FEMALE" | "MALE" | "UNKNOWN";
  neutered: "" | "YES" | "NO" | "UNKNOWN";
  photos: ImageItem[];
  notes: string;
};

export type PetProfileEditorErrors = {
  name?: string;
  type?: string;
  customType?: string;
  photo?: string;
};

export type PetProfileCardValue = {
  id: string;
  name: string;
  type: string;
  customType?: string | null;
  breed?: string | null;
  birthDate?: Date | string | null;
  weightGrams?: number | null;
  sex?: string | null;
  neutered?: string | null;
  notes?: string | null;
  photoUrl?: string | null;
};

export const emptyPetProfileEditorValue: PetProfileEditorValue = {
  id: null,
  name: "",
  type: "",
  customType: "",
  breed: "",
  birthDate: "",
  weight: "",
  weightUnit: "kg",
  sex: "",
  neutered: "",
  photos: [],
  notes: "",
};

export function PetProfileAddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.08] px-4 py-2 text-sm font-bold text-primary transition hover:border-primary/30 hover:bg-primary/[0.13] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Plus className="mr-2 h-4 w-4" />
      {label}
    </button>
  );
}

type OptionIcon = ElementType<{ className?: string }>;

function PetSpriteIcon({
  className,
  position,
}: {
  className?: string;
  position: string;
}) {
  return (
    <span
      className={cn(
        "block shrink-0 rounded-full bg-[#fff8e8] bg-no-repeat",
        className,
      )}
      style={{
        backgroundImage: "url('/images/pet-default-avatars-v2.png')",
        backgroundPosition: position,
        backgroundSize: "400% auto",
      }}
    />
  );
}

const DogIcon = ({ className }: { className?: string }) => (
  <PetSpriteIcon className={className} position="0% 5.556%" />
);
const CatIcon = ({ className }: { className?: string }) => (
  <PetSpriteIcon className={className} position="33.333% 5.556%" />
);
const RabbitIcon = ({ className }: { className?: string }) => (
  <PetSpriteIcon className={className} position="66.667% 5.556%" />
);
const BirdIcon = ({ className }: { className?: string }) => (
  <PetSpriteIcon className={className} position="100% 5.556%" />
);
const OtherIcon = ({ className }: { className?: string }) => (
  <PetSpriteIcon className={className} position="33.333% 94.444%" />
);
const HamsterIcon = ({ className }: { className?: string }) => (
  <PetSpriteIcon className={className} position="0% 50%" />
);
const GuineaPigIcon = ({ className }: { className?: string }) => (
  <PetSpriteIcon className={className} position="33.333% 50%" />
);
const FerretIcon = ({ className }: { className?: string }) => (
  <PetSpriteIcon className={className} position="66.667% 50%" />
);
const TurtleIcon = ({ className }: { className?: string }) => (
  <PetSpriteIcon className={className} position="100% 50%" />
);
const ChinchillaIcon = ({ className }: { className?: string }) => (
  <PetSpriteIcon className={className} position="0% 94.444%" />
);

const petTypeIcons: Record<PetProfileType, OptionIcon> = {
  DOG: DogIcon,
  CAT: CatIcon,
  RABBIT: RabbitIcon,
  BIRD: BirdIcon,
  OTHER: OtherIcon,
};

const otherTypeIcons: Record<string, OptionIcon> = {
  hamster: HamsterIcon,
  "guinea-pig": GuineaPigIcon,
  ferret: FerretIcon,
  turtle: TurtleIcon,
  chinchilla: ChinchillaIcon,
};

const legacyPetTypeIcons: Record<string, OptionIcon> = {
  CHINCHILLA: ChinchillaIcon,
  GUINEA_PIG: GuineaPigIcon,
  HAMSTER: HamsterIcon,
  TURTLE: TurtleIcon,
  FERRET: FerretIcon,
};

type SelectOption = { value: string; label: string; icon?: OptionIcon };

const selectPrompts: Record<Lang, string> = {
  en: "Select",
  zh: "请选择",
  ja: "選択してください",
};

function IconSelect({
  value,
  options,
  onChange,
  placeholder,
  triggerClassName,
  invalid = false,
  ariaDescribedBy,
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder: string;
  triggerClassName?: string;
  invalid?: boolean;
  ariaDescribedBy?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const SelectedIcon = selected?.icon;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-describedby={ariaDescribedBy}
          data-invalid={invalid || undefined}
          className={cn(
            "mt-2 flex h-11 w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-3 text-left text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-purple-100",
            invalid &&
              "border-danger-border focus:border-danger-text focus:ring-danger-ring",
            triggerClassName,
          )}
        >
          <span
            className={
              selected ? "flex min-w-0 items-center gap-2" : "text-slate-400"
            }
          >
            {SelectedIcon ? (
              <SelectedIcon className="h-5 w-5 shrink-0 text-primary" />
            ) : null}
            <span className="truncate">{selected?.label ?? placeholder}</span>
          </span>
          <PiCaretDown className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-[1200] w-[var(--radix-popover-trigger-width)] min-w-0 p-1.5"
      >
        <div className="space-y-1">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value || "empty"}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-purple-50",
                  option.value === value &&
                    "bg-purple-50 font-semibold text-primary",
                )}
              >
                {Icon ? (
                  <Icon className="h-5 w-5 shrink-0" />
                ) : (
                  <span className="h-5 w-5 shrink-0" />
                )}
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function OtherTypeField({
  value,
  options,
  onChange,
  placeholder,
  ariaLabel,
  connected = false,
  invalid = false,
  ariaDescribedBy,
}: {
  value: string;
  options: Array<{ key: string; label: string }>;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  connected?: boolean;
  invalid?: boolean;
  ariaDescribedBy?: string;
}) {
  const [open, setOpen] = useState(false);
  const matchedOption = options.find(
    (option) =>
      option.label.toLocaleLowerCase() === value.trim().toLocaleLowerCase(),
  );
  const MatchedIcon = matchedOption
    ? (otherTypeIcons[matchedOption.key] ?? PiPawPrint)
    : null;
  return (
    <div className="relative" onBlur={() => setOpen(false)}>
      <div
        className={cn(
          "relative mt-2 h-11 overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-purple-100",
          connected && "rounded-l-none border-l-0",
          invalid &&
            "border-danger-border focus-within:border-danger-text focus-within:ring-danger-ring",
        )}
      >
        {MatchedIcon ? (
          <MatchedIcon className="pointer-events-none absolute left-3 top-1/2 h-6 w-6 -translate-y-1/2" />
        ) : null}
        <input
          maxLength={80}
          aria-label={ariaLabel}
          aria-invalid={invalid}
          aria-describedby={ariaDescribedBy}
          placeholder={placeholder}
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          className={cn(
            "h-full w-full border-0 bg-transparent px-3 pr-10 text-sm text-slate-900 outline-none focus:ring-0",
            MatchedIcon && "pl-11",
          )}
        />
        {value ? (
          <button
            type="button"
            aria-label={ariaLabel}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onChange("");
              setOpen(true);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        ) : null}
      </div>
      {open ? (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-[80] w-full rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg">
          {options.map((option) => {
            const Icon = otherTypeIcons[option.key] ?? PiPawPrint;
            return (
              <button
                key={option.key}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option.label);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-purple-50"
              >
                <Icon className="h-6 w-6" />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function SuggestionField({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onBlur={() => setOpen(false)}>
      <div className="relative mt-2 h-11 overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-purple-100">
        <input
          maxLength={120}
          aria-label={ariaLabel}
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          className="h-full w-full border-0 bg-transparent px-3 pr-10 text-sm text-slate-900 outline-none focus:ring-0"
        />
        {value ? (
          <button
            type="button"
            aria-label={ariaLabel}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onChange("");
              setOpen(true);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        ) : null}
      </div>
      {open && options.length ? (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-[80] w-full rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className="block w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-purple-50"
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const calendarLocales = { en: enUS, zh: zhCN, ja } as const;

function CalendarHeaderSelect({
  value,
  options,
  onChange,
}: {
  value: number;
  options: Array<{ value: number; label: string; disabled?: boolean }>;
  onChange: (value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-8 min-w-0 items-center gap-1 px-1 text-sm font-extrabold text-slate-800 outline-none transition hover:text-primary"
        >
          <span className="truncate">{selected?.label}</span>
          <PiCaretDown className="h-4 w-4 shrink-0 text-primary" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-[1200] w-[var(--radix-popover-trigger-width)] min-w-[90px] p-1"
      >
        <div className="max-h-96 overflow-y-auto overscroll-contain pr-0.5">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={option.disabled}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "block h-8 w-full rounded-lg px-2 text-left text-xs hover:bg-purple-50",
                option.value === value &&
                  "bg-purple-50 font-semibold text-primary",
                option.disabled &&
                  "cursor-not-allowed text-slate-300 hover:bg-transparent",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function LegacyDateSelect({
  value,
  onChange,
  lang,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  lang: Lang;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;
  const [month, setMonth] = useState(selected ?? today);
  useEffect(() => {
    if (selected) setMonth(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const monthOptions = Array.from({ length: 12 }, (_, monthIndex) => ({
    value: monthIndex,
    label: new Intl.DateTimeFormat(
      lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : "en-US",
      { month: "short" },
    ).format(new Date(2020, monthIndex, 1)),
    disabled: month.getFullYear() === currentYear && monthIndex > currentMonth,
  }));
  const yearOptions = Array.from({ length: 101 }, (_, index) => ({
    value: currentYear - index,
    label: String(currentYear - index),
  }));
  const formatted = selected
    ? new Intl.DateTimeFormat(
        lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : "en-US",
      ).format(selected)
    : placeholder;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="mt-2 flex h-11 w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-3 text-left text-sm outline-none focus:border-primary focus:ring-2 focus:ring-purple-100"
        >
          <span className={selected ? "text-slate-900" : "text-slate-400"}>
            {formatted}
          </span>
          <PiCalendarBlank className="h-5 w-5 text-primary" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-[1200] w-[220px] max-w-[calc(100vw-24px)] p-2 [--rdp-accent-background-color:#f3e8ff] [--rdp-accent-color:#6d28d9]"
      >
        <div className="mb-1 flex items-center gap-2 px-1">
          <CalendarHeaderSelect
            value={month.getMonth()}
            options={monthOptions}
            onChange={(nextMonth) =>
              setMonth(new Date(month.getFullYear(), nextMonth, 1))
            }
          />
          <CalendarHeaderSelect
            value={month.getFullYear()}
            options={yearOptions}
            onChange={(year) =>
              setMonth(
                new Date(
                  year,
                  year === currentYear
                    ? Math.min(month.getMonth(), currentMonth)
                    : month.getMonth(),
                  1,
                ),
              )
            }
          />
        </div>
        <DayPicker
          mode="single"
          month={month}
          onMonthChange={setMonth}
          hideNavigation
          locale={calendarLocales[lang]}
          selected={selected}
          disabled={{ after: today }}
          classNames={{
            root: "w-full text-xs",
            months: "w-full",
            month: "w-full",
            month_caption: "hidden",
            month_grid: "w-full border-collapse",
            weekdays: "grid grid-cols-7",
            weekday:
              "w-7 py-1 text-center text-[10px] font-medium text-slate-400",
            week: "mt-0.5 grid grid-cols-7",
            day: "h-7 w-7 p-0 text-center",
            day_button:
              "h-7 w-7 rounded-full border border-transparent p-0 text-xs hover:bg-purple-50",
            selected:
              "[&>button]:border-primary [&>button]:bg-white [&>button]:font-bold [&>button]:text-primary",
            disabled:
              "[&>button]:cursor-not-allowed [&>button]:text-slate-300 [&>button]:hover:bg-transparent",
          }}
          onSelect={(date) => {
            if (!date) return;
            onChange(
              `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
            );
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function DateSelect({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const maxDate = new Date();
  maxDate.setHours(0, 0, 0, 0);
  return (
    <DatePicker
      value={value}
      onChange={onChange}
      maxDate={maxDate}
      placeholder={placeholder}
      triggerClassName="mt-2 h-11"
      popoverClassName="w-[calc(min(100vw-24px,64rem)-32px)] max-w-none sm:w-[calc(min(100vw-48px,64rem)-48px)]"
    />
  );
}

function UnitSelect({
  value,
  onChange,
}: {
  value: "kg" | "g";
  onChange: (value: "kg" | "g") => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="pet-weight-control relative flex h-full w-[76px] items-center justify-between px-3 text-sm text-slate-800 outline-none before:absolute before:left-0 before:top-1/2 before:h-6 before:w-px before:-translate-y-1/2 before:bg-slate-200 hover:bg-slate-50"
        >
          <span>{value}</span>
          <PiCaretDown className="h-4 w-4 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="z-[1200] w-[var(--radix-popover-trigger-width)] min-w-0 p-1"
      >
        <button
          type="button"
          onClick={() => {
            onChange("kg");
            setOpen(false);
          }}
          className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-purple-50"
        >
          kg
        </button>
        <button
          type="button"
          onClick={() => {
            onChange("g");
            setOpen(false);
          }}
          className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-purple-50"
        >
          g
        </button>
      </PopoverContent>
    </Popover>
  );
}

function FieldCaption({
  label,
  optional,
}: {
  label: string;
  optional?: string;
}) {
  return (
    <span className="flex items-baseline gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
      {label}
      {optional ? (
        <span className="text-[10px] font-medium normal-case tracking-normal text-slate-400">
          {optional}
        </span>
      ) : null}
    </span>
  );
}

const fieldClass =
  "mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-purple-100 disabled:bg-slate-100";
const textareaClass =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-purple-100 disabled:bg-slate-100";
export function PetProfileEditorDialog({
  value,
  mode,
  errors = {},
  busy = false,
  extraContent,
  submitLabel,
  renderPhotoControl,
  localPhotoOnly = false,
  onChange,
  onCancel,
  onSubmit,
}: {
  value: PetProfileEditorValue;
  mode: "create" | "edit";
  errors?: PetProfileEditorErrors;
  busy?: boolean;
  extraContent?: ReactNode;
  submitLabel?: string;
  renderPhotoControl?: (value: PetProfileEditorValue) => ReactNode;
  localPhotoOnly?: boolean;
  onChange: (value: PetProfileEditorValue) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const { t, lang } = useLanguage();
  const copy = t.settings.pets;
  const breedSuggestions = getPetBreedSuggestions(
    lang,
    value.type,
    value.customType,
  );
  const otherTypeOptions = getOtherPetTypeOptions(lang);
  const neuteredLabel =
    value.sex === "FEMALE"
      ? copy.neuteredFemale
      : value.sex === "MALE"
        ? copy.neuteredMale
        : copy.neuteredGeneric;
  const title = mode === "edit" ? copy.edit : copy.newPet;
  const dialog = (
    <ModalShell
      title={title}
      titleId="pet-profile-editor-title"
      closeLabel={copy.close}
      cancelLabel={copy.cancel}
      saveLabel={submitLabel ?? copy.saveOnly}
      savingLabel={copy.saving}
      saving={busy}
      saveDisabled={value.photos.some((photo) => photo.isUploading)}
      onClose={onCancel}
      onCancel={onCancel}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      bodyClassName="space-y-6"
      panelClassName="max-h-[80dvh]"
    >
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <label className="relative col-span-2 lg:col-span-1">
          <FieldCaption label={copy.name} />
          <input
            id="pet-name"
            maxLength={80}
            value={value.name}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "pet-name-error" : undefined}
            onChange={(event) =>
              onChange({ ...value, name: event.target.value })
            }
            className={cn(
              fieldClass,
              errors.name &&
                "border-danger-border focus:border-danger-text focus:ring-danger-ring",
            )}
          />
          {errors.name ? (
            <p
              id="pet-name-error"
              role="alert"
              className="absolute left-0 top-full mt-1 inline-flex items-center gap-1 text-xs font-semibold text-danger-text"
            >
              <PiWarningCircle className="shrink-0" size={13} />
              {errors.name}
            </p>
          ) : null}
        </label>
        <div
          className={cn(
            "relative",
            value.type === "OTHER" && "col-span-2 lg:col-span-2",
          )}
        >
          <FieldCaption label={copy.type} />
          <div className={value.type === "OTHER" ? "grid grid-cols-2" : ""}>
            <IconSelect
              value={value.type}
              placeholder={selectPrompts[lang]}
              invalid={Boolean(errors.type)}
              ariaDescribedBy={
                errors.type || errors.customType ? "pet-type-error" : undefined
              }
              triggerClassName={
                value.type === "OTHER" ? "rounded-r-none" : undefined
              }
              options={petProfileTypes.map((type) => ({
                value: type,
                label: copy.typeLabels[type],
                icon: petTypeIcons[type],
              }))}
              onChange={(nextType) =>
                onChange({
                  ...value,
                  type: nextType as PetProfileType,
                  customType: nextType === "OTHER" ? value.customType : "",
                  breed: "",
                })
              }
            />
            {value.type === "OTHER" ? (
              <OtherTypeField
                value={value.customType}
                options={otherTypeOptions}
                placeholder={copy.customTypePlaceholder}
                ariaLabel={copy.customType}
                connected
                invalid={Boolean(errors.customType)}
                ariaDescribedBy={
                  errors.customType ? "pet-type-error" : undefined
                }
                onChange={(customType) =>
                  onChange({ ...value, customType, breed: "" })
                }
              />
            ) : null}
          </div>
          {errors.type || errors.customType ? (
            <p
              id="pet-type-error"
              role="alert"
              className="absolute left-0 top-full mt-1 inline-flex items-center gap-1 text-xs font-semibold text-danger-text"
            >
              <PiWarningCircle className="shrink-0" size={13} />
              {errors.type || errors.customType}
            </p>
          ) : null}
        </div>
        <div className={cn(value.type === "OTHER" && "col-span-2 lg:col-span-1")}>
          <FieldCaption label={copy.breed} optional={copy.optional} />
          <SuggestionField
            value={value.breed}
            options={breedSuggestions}
            ariaLabel={copy.breed}
            onChange={(breed) => onChange({ ...value, breed })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <div>
          <FieldCaption label={copy.birthDate} optional={copy.optional} />
          <DateSelect
            value={value.birthDate}
            onChange={(birthDate) => onChange({ ...value, birthDate })}
            placeholder={copy.optional}
          />
        </div>
        <div>
          <FieldCaption label={copy.weight} optional={copy.optional} />
          <div className="mt-2 flex h-11 overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-purple-100">
            <input
              aria-label={copy.weight}
              type="number"
              min={value.weightUnit === "kg" ? 0.001 : 1}
              step={value.weightUnit === "kg" ? "0.001" : "1"}
              value={value.weight}
              onChange={(event) =>
                onChange({ ...value, weight: event.target.value })
              }
              className="pet-weight-control min-w-0 flex-1 appearance-none border-0 bg-transparent px-3 text-sm text-slate-900 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <UnitSelect
              value={value.weightUnit}
              onChange={(weightUnit) => onChange({ ...value, weightUnit })}
            />
          </div>
        </div>
        <div>
          <FieldCaption label={copy.sex} optional={copy.optional} />
          <IconSelect
            value={value.sex}
            placeholder={selectPrompts[lang]}
            options={[
              { value: "MALE", label: copy.male, icon: PiGenderMale },
              {
                value: "FEMALE",
                label: copy.female,
                icon: PiGenderFemale,
              },
              { value: "UNKNOWN", label: copy.unknown, icon: PiQuestion },
            ]}
            onChange={(sex) =>
              onChange({
                ...value,
                sex: sex as PetProfileEditorValue["sex"],
              })
            }
          />
        </div>
        <div>
          <FieldCaption label={neuteredLabel} optional={copy.optional} />
          <IconSelect
            value={value.neutered}
            placeholder={selectPrompts[lang]}
            options={[
              { value: "YES", label: copy.yes, icon: PiCheckCircle },
              { value: "NO", label: copy.no, icon: PiXCircle },
              { value: "UNKNOWN", label: copy.unknown, icon: PiQuestion },
            ]}
            onChange={(neutered) =>
              onChange({
                ...value,
                neutered: neutered as PetProfileEditorValue["neutered"],
              })
            }
          />
        </div>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-4">
        <label className="lg:col-span-3">
          <FieldCaption label={copy.notes} optional={copy.optional} />
          <textarea
            rows={4}
            maxLength={3000}
            value={value.notes}
            onChange={(event) =>
              onChange({ ...value, notes: event.target.value })
            }
            className={`${textareaClass} h-24 resize-none`}
          />
        </label>
        <div>
          <FieldCaption label={copy.photo} optional={copy.optional} />
          <div className="mt-2">
            {renderPhotoControl ? (
              renderPhotoControl(value)
            ) : (
              <ImageUploader
                value={value.photos}
                onChange={(photos) => onChange({ ...value, photos })}
                onRemove={(id) =>
                  onChange({
                    ...value,
                    photos: value.photos.filter((photo) => photo.id !== id),
                  })
                }
                maxCount={1}
                folder="pets"
                size="md"
                localOnly={localPhotoOnly}
              />
            )}
          </div>
          {errors.photo ? (
            <p
              role="alert"
              className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-danger-text"
            >
              <PiWarningCircle className="shrink-0" size={13} />
              {errors.photo}
            </p>
          ) : null}
        </div>
      </div>

      {extraContent ? <div>{extraContent}</div> : null}
    </ModalShell>
  );
  return dialog;
}

function petAgeParts(birthDate: Date | string | null | undefined) {
  if (!birthDate) return null;
  const born = new Date(birthDate);
  if (Number.isNaN(born.getTime())) return null;
  const today = new Date();
  const bornYear = born.getUTCFullYear();
  const bornMonth = born.getUTCMonth();
  const bornDay = born.getUTCDate();
  const days = Math.max(
    0,
    Math.floor(
      (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) -
        Date.UTC(bornYear, bornMonth, bornDay)) /
        86_400_000,
    ),
  );
  let months =
    (today.getFullYear() - bornYear) * 12 + today.getMonth() - bornMonth;
  if (today.getDate() < bornDay) months -= 1;
  if (months < 1) return { value: days, unit: "day" as const };
  if (months < 12) return { value: months, unit: "month" as const };
  let years = today.getFullYear() - bornYear;
  if (
    today.getMonth() < bornMonth ||
    (today.getMonth() === bornMonth && today.getDate() < bornDay)
  )
    years -= 1;
  return { value: Math.max(1, years), unit: "year" as const };
}

function normalizeProfileEnum(value: string | null | undefined) {
  return value?.toUpperCase() ?? "";
}

export function PetProfileCard({
  pet,
  invalidMessage,
  sourceLabel,
  editLabel,
  deleteLabel,
  deleteDisabled = false,
  onEdit,
  onDelete,
}: {
  pet: PetProfileCardValue;
  invalidMessage?: string;
  sourceLabel?: string;
  editLabel: string;
  deleteLabel: string;
  deleteDisabled?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t, lang } = useLanguage();
  const copy = t.settings.pets;
  const rawCustomType = pet.customType ?? "";
  const canonicalOtherType = resolveOtherPetTypeKey(rawCustomType);
  const normalizedType = normalizeProfileEnum(pet.type);
  const canonicalSelection = normalizePetTypeSelection(
    normalizedType,
    rawCustomType,
  );
  const localizedCustomType = localizeOtherPetType(rawCustomType, lang);
  const localizedBreed = localizePetBreed(
    pet.breed ?? "",
    lang,
    normalizedType,
    rawCustomType,
  );
  const DefaultPetIcon =
    normalizedType === "OTHER" && canonicalOtherType
      ? (otherTypeIcons[canonicalOtherType] ?? OtherIcon)
      : (petTypeIcons[normalizedType as PetProfileType] ??
        legacyPetTypeIcons[normalizedType] ??
        OtherIcon);
  const typeOrBreed =
    localizedBreed ||
    (canonicalSelection.petType === "OTHER"
      ? localizedCustomType
      : petTypeLabel(canonicalSelection.petType, lang)) ||
    pet.type;
  const age = petAgeParts(pet.birthDate);
  const ageText = age
    ? (age.unit === "day"
        ? age.value === 1
          ? copy.ageDay
          : copy.ageDays
        : age.unit === "month"
          ? age.value === 1
            ? copy.ageMonth
            : copy.ageMonths
          : age.value === 1
            ? copy.ageYear
            : copy.ageSummary
      )
        .replace("{count}", String(age.value))
        .replace("{age}", String(age.value))
    : null;
  const weightText = pet.weightGrams
    ? pet.weightGrams < 1000
      ? `${pet.weightGrams} g`
      : `${new Intl.NumberFormat(lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : "en-US", { maximumFractionDigits: 3 }).format(pet.weightGrams / 1000)} kg`
    : null;
  const sex = normalizeProfileEnum(pet.sex);
  const neutered = normalizeProfileEnum(pet.neutered);
  const sexText = sex
    ? (copy.sexLabels[sex as keyof typeof copy.sexLabels] ?? pet.sex ?? "")
    : "";
  let neuteringText = neutered
    ? (copy.neuteredLabels[neutered as keyof typeof copy.neuteredLabels] ??
      pet.neutered ??
      "")
    : "";
  if (sex === "MALE" && neutered === "YES")
    neuteringText = copy.neuteredMaleCard;
  else if (sex === "MALE" && neutered === "NO")
    neuteringText = copy.notNeuteredMaleCard;
  else if (sex === "FEMALE" && neutered === "YES")
    neuteringText = copy.neuteredFemaleCard;
  else if (sex === "FEMALE" && neutered === "NO")
    neuteringText = copy.notNeuteredFemaleCard;
  const sexAndNeutering =
    [sexText, neuteringText].filter(Boolean).join(" · ") || null;
  const hasDetails = Boolean(
    ageText || weightText || sexAndNeutering || pet.notes || invalidMessage,
  );

  return (
    <article
      className={cn(
        "relative inline-flex w-max max-w-full flex-none items-stretch gap-3 rounded-2xl border bg-white p-4 sm:max-w-[30rem]",
        invalidMessage ? "border-danger-border" : "border-slate-200",
      )}
    >
      {sourceLabel ? (
        <span className="absolute right-2 top-2 inline-flex max-w-[calc(100%-4rem)] items-center gap-1 rounded-full bg-purple-50 px-2 py-1 text-[10px] font-semibold leading-3 text-primary">
          <PiPawPrint className="h-3 w-3 shrink-0" />
          <span className="truncate">{sourceLabel}</span>
        </span>
      ) : null}
      <div className="flex w-20 shrink-0 flex-col items-center justify-center gap-2 text-center">
        <div className="h-20 w-20 overflow-hidden rounded-2xl bg-white">
          {pet.photoUrl ? (
            <AppImage
              src={pet.photoUrl}
              alt={pet.name || copy.photoAlt}
              className="h-full w-full object-contain"
            />
          ) : (
            <DefaultPetIcon className="h-full w-full !rounded-none" />
          )}
        </div>
        <div className="min-w-0 max-w-full">
          <h3 className="truncate font-bold text-slate-900">{pet.name}</h3>
          <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
            {typeOrBreed}
          </p>
        </div>
      </div>

      {hasDetails ? (
        <div className="flex min-w-0 w-max max-w-[18rem] flex-col justify-center gap-2">
          {ageText || weightText ? (
            <div className="flex flex-wrap gap-2">
              {ageText ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {ageText}
                </span>
              ) : null}
              {weightText ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">
                  <Scale className="h-3.5 w-3.5" />
                  {weightText}
                </span>
              ) : null}
            </div>
          ) : null}
          {sexAndNeutering ? (
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-800 sm:whitespace-nowrap">
                <HeartPulse className="h-3.5 w-3.5" />
                {sexAndNeutering}
              </span>
            </div>
          ) : null}
          {pet.notes ? (
            <div className="flex w-fit max-w-full gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-5 text-slate-600">
              <NotebookText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <p className="line-clamp-2 break-all whitespace-pre-line">
                {pet.notes}
              </p>
            </div>
          ) : null}
          {invalidMessage ? (
            <p className="text-xs font-semibold text-danger-text">
              {invalidMessage}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex shrink-0 flex-col items-center justify-center gap-1 self-stretch">
        <button
          type="button"
          aria-label={editLabel}
          onClick={onEdit}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-primary"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={deleteLabel}
          disabled={deleteDisabled}
          onClick={onDelete}
          className="rounded-lg p-2 text-slate-500 hover:bg-danger-bg hover:text-danger-text"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
