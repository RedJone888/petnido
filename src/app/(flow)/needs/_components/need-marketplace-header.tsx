"use client";

import {
  Bird,
  Calendar,
  Cat,
  Check,
  ChevronDown,
  ChevronRight,
  Compass,
  Dog,
  Home,
  Layers,
  Loader2,
  MapPin,
  PawPrint,
  Rabbit,
  Rat,
  Search,
  Sparkles,
  Warehouse,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState, type ElementType } from "react";

import LocationInput from "@/components/location/LocationInput";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/Popover";
import type { Lang } from "@/domain/lang/types";
import { messages } from "@/i18n/messages";
import cn from "@/lib/cn";
import type { Mode } from "./need-card";

export type FilterOption = { value: string; label: string; icon: ElementType };

const modes: Mode[] = ["HOME_VISIT", "BOARDING", "CUSTOM"];
const petTypes = [
  "DOG",
  "CAT",
  "RABBIT",
  "BIRD",
  "CHINCHILLA",
  "GUINEA_PIG",
  "HAMSTER",
  "OTHER",
] as const;

const modeIcons: Record<Mode, ElementType> = {
  HOME_VISIT: Home,
  BOARDING: Warehouse,
  CUSTOM: Sparkles,
};

const petIcons: Record<(typeof petTypes)[number], ElementType> = {
  DOG: Dog,
  CAT: Cat,
  RABBIT: Rabbit,
  BIRD: Bird,
  CHINCHILLA: Rat,
  GUINEA_PIG: Rat,
  HAMSTER: Rat,
  OTHER: PawPrint,
};

const inputClass =
  "min-h-10 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25";

function MultiSelectFilter({
  icon: Icon,
  allLabel,
  filterLabel,
  selected,
  options,
  clearLabel,
  applyLabel,
  onApply,
}: {
  icon?: ElementType;
  allLabel: string;
  filterLabel: string;
  selected: string[];
  options: FilterOption[];
  clearLabel: string;
  applyLabel: string;
  onApply: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(selected);
  const isFiltered = selected.length > 0;

  function changeOpen(nextOpen: boolean) {
    if (nextOpen) setDraft(selected);
    setOpen(nextOpen);
  }

  function toggleOption(value: string) {
    setDraft((current) => {
      if (current.includes(value)) {
        const next = current.filter((item) => item !== value);
        return next.length > 0 ? next : [];
      }
      return [...current, value];
    });
  }

  const displayLabel =
    selected.length === 0
      ? allLabel
      : selected.length === 1
        ? options.find((o) => o.value === selected[0])?.label || filterLabel
        : filterLabel;

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "group inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            isFiltered
              ? "border-primary/80 bg-purple-50/90 text-primary shadow-xs ring-1 ring-primary/25 hover:bg-purple-100/80 hover:border-primary"
              : "border-slate-200/90 bg-white text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
          )}
          aria-label={`${filterLabel}: ${displayLabel}`}
        >
          {Icon ? (
            <Icon
              size={13.5}
              className={cn(
                "shrink-0 transition-colors",
                isFiltered ? "text-primary" : "text-slate-400 group-hover:text-slate-600",
              )}
              aria-hidden="true"
            />
          ) : null}
          <span className="whitespace-nowrap">{displayLabel}</span>
          {isFiltered ? (
            <span className="inline-flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-white shadow-xs">
              {selected.length}
            </span>
          ) : null}
          <ChevronDown
            size={12}
            className={cn(
              "shrink-0 transition-transform duration-200",
              isFiltered ? "text-primary" : "text-slate-400 group-hover:text-slate-600",
              open ? "rotate-180" : "",
            )}
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[1200] w-[270px] rounded-2xl p-0 shadow-2xl border border-slate-200/80 bg-white overflow-hidden"
        align="start"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5 bg-slate-50/60">
          <span className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
            {Icon ? <Icon size={13.5} className="text-primary" /> : null}
            {filterLabel}
          </span>
          {draft.length > 0 ? (
            <span className="text-[10.5px] font-bold text-primary bg-purple-100/70 rounded-full px-2 py-0.5">
              已选 {draft.length}
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-1 max-h-[260px] overflow-y-auto p-2">
          <button
            type="button"
            aria-pressed={draft.length === 0}
            onClick={() => setDraft([])}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-lg px-2 text-left text-[11.5px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              draft.length === 0
                ? "bg-purple-50/90 text-primary font-bold"
                : "text-slate-700 hover:bg-slate-100/70",
            )}
          >
            {Icon ? (
              <Icon size={13.5} className={cn("shrink-0", draft.length === 0 ? "text-primary" : "text-slate-400")} aria-hidden="true" />
            ) : (
              <PawPrint size={13.5} className={cn("shrink-0", draft.length === 0 ? "text-primary" : "text-slate-400")} />
            )}
            <span className="min-w-0 flex-1 truncate">{allLabel}</span>
            {draft.length === 0 ? (
              <Check
                size={13}
                strokeWidth={3}
                className="shrink-0 text-primary"
                aria-hidden="true"
              />
            ) : null}
          </button>
          {options.map((option) => {
            const active = draft.includes(option.value);
            const OptIcon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => toggleOption(option.value)}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-lg px-2 text-left text-[11.5px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  active
                    ? "bg-purple-50/90 text-primary font-bold"
                    : "text-slate-700 hover:bg-slate-100/70",
                )}
              >
                <OptIcon
                  size={13.5}
                  className={cn("shrink-0", active ? "text-primary" : "text-slate-400")}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {active ? (
                  <Check
                    size={13}
                    strokeWidth={3}
                    className="shrink-0 text-primary"
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-3 py-2">
          <button
            type="button"
            onClick={() => setDraft([])}
            className="text-[11px] font-bold text-slate-500 transition hover:text-slate-800"
          >
            {clearLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
            className="rounded-lg bg-primary px-3 py-1 text-xs font-bold text-white shadow-xs transition hover:bg-primary/90 active:scale-95"
          >
            {applyLabel}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DateFilter({
  label,
  from,
  to,
  fromLabel,
  toLabel,
  clearLabel,
  applyLabel,
  errorLabel,
  onApply,
  onClear,
}: {
  label: string;
  from: string;
  to: string;
  fromLabel: string;
  toLabel: string;
  clearLabel: string;
  applyLabel: string;
  errorLabel: string;
  onApply: (from: string, to: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);

  function changeOpen(nextOpen: boolean) {
    if (nextOpen) {
      setDraftFrom(from);
      setDraftTo(to);
    }
    setOpen(nextOpen);
  }

  const isDraftInvalid = Boolean(
    draftFrom && draftTo && draftFrom >= draftTo,
  );
  const isFiltered = Boolean(from || to);

  const displayLabel =
    from && to
      ? `${from} ~ ${to}`
      : from
        ? `≥ ${from}`
        : to
          ? `≤ ${to}`
          : label;

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "group inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            isFiltered
              ? "border-primary/80 bg-purple-50/90 text-primary shadow-xs ring-1 ring-primary/25 hover:bg-purple-100/80 hover:border-primary"
              : "border-slate-200/90 bg-white text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
          )}
          aria-label={`${label}: ${displayLabel}`}
        >
          <Calendar
            size={13.5}
            className={cn(
              "shrink-0 transition-colors",
              isFiltered ? "text-primary" : "text-slate-400 group-hover:text-slate-600",
            )}
            aria-hidden="true"
          />
          <span className="whitespace-nowrap">{displayLabel}</span>
          {isFiltered ? (
            <span className="inline-flex h-2 w-2 rounded-full bg-primary ring-2 ring-purple-100" />
          ) : null}
          <ChevronDown
            size={12}
            className={cn(
              "shrink-0 transition-transform duration-200",
              isFiltered ? "text-primary" : "text-slate-400 group-hover:text-slate-600",
              open ? "rotate-180" : "",
            )}
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[1200] w-[270px] rounded-2xl p-0 shadow-2xl border border-slate-200/80 bg-white overflow-hidden"
        align="start"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5 bg-slate-50/60">
          <span className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
            <Calendar size={13.5} className="text-primary" />
            {label}
          </span>
        </div>
        <div className="p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-[11px] font-bold text-slate-600">
              <span>{fromLabel}</span>
              <input
                type="date"
                value={draftFrom}
                max={draftTo || undefined}
                onChange={(event) => setDraftFrom(event.target.value)}
                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-1.5 text-[11px] text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-bold text-slate-600">
              <span>{toLabel}</span>
              <input
                type="date"
                value={draftTo}
                min={draftFrom || undefined}
                onChange={(event) => setDraftTo(event.target.value)}
                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-1.5 text-[11px] text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
              />
            </label>
          </div>
          {isDraftInvalid ? (
            <p
              role="alert"
              className="rounded-lg bg-danger-bg px-2 py-1 text-[11px] font-bold text-danger-text"
            >
              {errorLabel}
            </p>
          ) : null}
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-3 py-2">
          <button
            type="button"
            onClick={() => {
              setDraftFrom("");
              setDraftTo("");
              onClear();
              setOpen(false);
            }}
            disabled={!draftFrom && !draftTo && !from && !to}
            className="text-[11px] font-bold text-slate-500 transition hover:text-slate-800 disabled:opacity-35"
          >
            {clearLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isDraftInvalid) {
                onApply(draftFrom, draftTo);
                setOpen(false);
              }
            }}
            disabled={isDraftInvalid}
            className="rounded-lg bg-primary px-3 py-1 text-xs font-bold text-white shadow-xs transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {applyLabel}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DistanceFilter({
  lang,
  radiusKm,
  disabled = false,
  filterLabel,
  onChange,
}: {
  lang: Lang;
  radiusKm: number;
  disabled?: boolean;
  filterLabel: string;
  onChange: (radius: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const isCustom = radiusKm !== 25;

  const options = [
    {
      value: 10,
      label:
        lang === "zh"
          ? "10 km 以内"
          : lang === "ja"
            ? "10 km 以内"
            : "Within 10 km",
    },
    {
      value: 25,
      label:
        lang === "zh"
          ? "25 km 以内（默认）"
          : lang === "ja"
            ? "25 km 以内（既定）"
            : "Within 25 km (Default)",
    },
    {
      value: 50,
      label:
        lang === "zh"
          ? "50 km 以内"
          : lang === "ja"
            ? "50 km 以内"
            : "Within 50 km",
    },
    {
      value: 100,
      label:
        lang === "zh"
          ? "100 km 以内"
          : lang === "ja"
            ? "100 km 以内"
            : "Within 100 km",
    },
    {
      value: 0,
      label:
        lang === "zh"
          ? "不限距离"
          : lang === "ja"
            ? "距離制限なし"
            : "Any distance",
    },
  ];

  const currentLabel =
    radiusKm === 0
      ? lang === "zh"
        ? "不限"
        : lang === "ja"
          ? "不限"
          : "Any"
      : `${radiusKm} km`;

  if (disabled) {
    return (
      <span
        className="inline-flex h-7 items-center gap-1 rounded-full px-2 text-xs font-medium text-slate-300 cursor-not-allowed select-none opacity-60"
        title={
          lang === "zh"
            ? "请先输入或选择地址"
            : lang === "ja"
              ? "先に場所を入力してください"
              : "Select location first"
        }
      >
        <Compass size={13} className="shrink-0 text-slate-300" />
        <span className="whitespace-nowrap">{currentLabel}</span>
        <ChevronDown size={11} className="shrink-0 text-slate-300" />
      </span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "group inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            isCustom
              ? "bg-purple-50 text-primary font-black hover:bg-purple-100/90"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
          )}
          aria-label={`${filterLabel}: ${currentLabel}`}
        >
          <Compass
            size={13}
            className={cn(
              "shrink-0 transition-colors",
              isCustom ? "text-primary" : "text-slate-400 group-hover:text-slate-600",
            )}
            aria-hidden="true"
          />
          <span className="whitespace-nowrap">{currentLabel}</span>
          <ChevronDown
            size={11}
            className={cn(
              "shrink-0 transition-transform duration-200",
              isCustom ? "text-primary" : "text-slate-400 group-hover:text-slate-600",
              open ? "rotate-180" : "",
            )}
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[200px] rounded-xl border border-slate-200/90 bg-white p-2 shadow-xl backdrop-blur z-30"
      >
        <div className="mb-1.5 border-b border-slate-100 px-1 pb-1.5">
          <div className="text-[11px] font-bold text-slate-800 leading-tight">
            {lang === "zh"
              ? "从地址中心出发的范围"
              : lang === "ja"
                ? "地点中心からの検索範囲"
                : "Radius from location"}
          </div>
          <div className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5">
            {lang === "zh"
              ? "筛选该地址周边的照护需求"
              : lang === "ja"
                ? "周辺の照護依頼を絞り込み"
                : "Filter requests in this radius"}
          </div>
        </div>
        <div className="space-y-0.5">
          {options.map((opt) => {
            const isSelected = radiusKm === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition",
                  isSelected
                    ? "bg-purple-50 text-primary font-bold shadow-2xs"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium",
                )}
              >
                <span>{opt.label}</span>
                {isSelected ? <Check size={13} className="text-primary shrink-0 ml-1" /> : null}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function NeedMarketplaceHeader({
  lang,
  prefix,
  selectedModes,
  selectedPetTypes,
  availableFrom,
  availableTo,
  radiusKm,
  locationQuery,
  locationResults,
  locationLoading,
  locationError,
  dateRangeInvalid,
  totalCount,
  onLocationChange,
  onLocationSelect,
  onModesChange,
  onPetTypesChange,
  onAvailableFromChange,
  onAvailableToChange,
  onDateApply,
  onDateClear,
  onRadiusChange,
  onResetAllFilters,
  isLocating,
}: {
  lang: Lang;
  prefix: string;
  selectedModes: Mode[];
  selectedPetTypes: string[];
  availableFrom: string;
  availableTo: string;
  radiusKm: number;
  locationQuery: string;
  locationResults: Array<{ lat: number; lon: number; label: string }>;
  locationLoading: boolean;
  locationError: string | null;
  dateRangeInvalid: boolean;
  totalCount?: number;
  isLocating?: boolean;
  onLocationChange: (value: string) => void;
  onLocationSelect: (item: { lat: number; lon: number; label: string }) => void;
  onModesChange: (modes: Mode[]) => void;
  onPetTypesChange: (petTypes: string[]) => void;
  onAvailableFromChange: (value: string) => void;
  onAvailableToChange: (value: string) => void;
  onDateApply?: (from: string, to: string) => void;
  onDateClear: () => void;
  onRadiusChange: (radius: number) => void;
  onResetAllFilters: () => void;
}) {
  const t = messages[lang];
  const copy = t.core.marketplace;

  const hasActiveFilters =
    selectedModes.length > 0 ||
    selectedPetTypes.length > 0 ||
    Boolean(availableFrom) ||
    Boolean(availableTo) ||
    Boolean(locationQuery) ||
    radiusKm !== 25;

  return (
    <header className="shrink-0 px-0 pt-0 pb-1 bg-transparent">
      <div className="flex flex-col gap-2.5">
        {/* 1. Breadcrumb */}
        <div className="flex items-center text-xs text-text-subtle">
          <nav aria-label={copy.breadcrumbLabel} className="flex items-center gap-1.5">
            <Link
              href={`${prefix}/`}
              className="font-medium text-slate-500 hover:text-primary transition-colors"
            >
              {copy.breadcrumbHome}
            </Link>
            <ChevronRight size={12} className="text-slate-400" />
            <span className="font-bold text-slate-900" aria-current="page">
              {copy.breadcrumbNeeds}
            </span>
          </nav>
        </div>

        {/* 2. Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Compound Location & Distance Search Bar (Visually and Logically Bound) */}
          <div
            className={cn(
              "group relative flex min-w-[270px] flex-1 max-w-[400px] items-center rounded-full border bg-white shadow-2xs transition-all duration-200",
              "border-slate-300 hover:border-slate-400 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25",
            )}
          >
            {/* Search Icon */}
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 shrink-0"
            />

            {/* Frameless LocationInput */}
            <div className="flex-1 min-w-0">
              <LocationInput
                source="search"
                value={locationQuery}
                results={locationResults}
                loading={locationLoading}
                disabled={false}
                hideClearButton={true}
                borderless={true}
                containerClassName="static"
                dropdownClassName="left-0 right-0 top-[calc(100%+6px)] w-full rounded-2xl border-slate-200/90 shadow-xl p-1.5 z-30"
                onInputChange={onLocationChange}
                onSearchSelect={onLocationSelect}
                placeholder={copy.locationSearchPlaceholder}
                className="h-9 w-full pl-8.5 pr-1.5 text-xs font-medium placeholder:text-slate-400"
              />
            </div>

            {/* Clear Button / Loading Spinner for Location */}
            <div className="flex items-center shrink-0">
              {locationLoading || isLocating ? (
                <span className="grid h-6 w-6 place-items-center text-primary">
                  <Loader2 size={13} className="animate-spin text-primary" />
                </span>
              ) : locationQuery ? (
                <button
                  type="button"
                  onClick={() => onLocationChange("")}
                  aria-label={copy.clear}
                  title={copy.clear}
                  className="grid h-5 w-5 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X size={12} />
                </button>
              ) : null}
            </div>

            {/* Vertical Divider */}
            <div className="h-4.5 w-[1px] bg-slate-200 shrink-0 mx-1" aria-hidden="true" />

            {/* Embedded Distance Dropdown */}
            <div className="shrink-0 pr-1">
              <DistanceFilter
                lang={lang}
                radiusKm={radiusKm}
                disabled={!locationQuery.trim()}
                filterLabel={copy.radius}
                onChange={onRadiusChange}
              />
            </div>

            {locationError ? (
              <p
                role="alert"
                className="absolute left-0 top-[calc(100%+4px)] z-30 max-w-full rounded-lg bg-danger-bg px-2.5 py-1 text-[11px] font-bold text-danger-text shadow-md"
              >
                {locationError}
              </p>
            ) : null}
          </div>

          {/* Mode MultiSelect */}
          <MultiSelectFilter
            icon={Layers}
            allLabel={copy.allModes}
            filterLabel={copy.mode}
            selected={selectedModes}
            options={modes.map((value) => ({
              value,
              label: t.core.modes[value],
              icon: modeIcons[value],
            }))}
            clearLabel={copy.clear}
            applyLabel={copy.applyFilters}
            onApply={(values) => onModesChange(values as Mode[])}
          />

          {/* Pet Types MultiSelect */}
          <MultiSelectFilter
            icon={PawPrint}
            allLabel={copy.allPets}
            filterLabel={copy.petType}
            selected={selectedPetTypes}
            options={petTypes.map((value) => ({
              value,
              label: t.core.pets[value],
              icon: petIcons[value],
            }))}
            clearLabel={copy.clear}
            applyLabel={copy.applyFilters}
            onApply={onPetTypesChange}
          />

          {/* Date Filter */}
          <DateFilter
            label={copy.dates}
            from={availableFrom}
            to={availableTo}
            fromLabel={copy.availableFrom}
            toLabel={copy.availableBefore}
            clearLabel={copy.clear}
            applyLabel={copy.applyFilters}
            errorLabel={copy.dateRangeError}
            onApply={(from, to) => {
              if (onDateApply) {
                onDateApply(from, to);
              } else {
                onAvailableFromChange(from);
                onAvailableToChange(to);
              }
            }}
            onClear={onDateClear}
          />
        </div>

        {/* 3. Active Filters Chips & Results Count (Directly below search bar) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-xs">
          {hasActiveFilters ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {locationQuery ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200 shadow-2xs">
                  <MapPin size={11} className="text-slate-500 shrink-0" />
                  <span className="max-w-[160px] truncate">{locationQuery}</span>
                  {radiusKm > 0 ? (
                    <span className="text-[10px] text-slate-400 font-medium">· {radiusKm}km</span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">
                      · {lang === "zh" ? "不限" : lang === "ja" ? "不限" : "All"}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onLocationChange("")}
                    aria-label="Remove location filter"
                    className="ml-0.5 rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                  >
                    <X size={11} />
                  </button>
                </span>
              ) : null}

              {selectedModes.map((mode) => {
                const ModeIcon = modeIcons[mode];
                return (
                  <span
                    key={mode}
                    className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-bold text-primary border border-purple-200 shadow-2xs"
                  >
                    <ModeIcon size={11} className="shrink-0 text-primary" />
                    <span>{t.core.modes[mode]}</span>
                    <button
                      type="button"
                      onClick={() =>
                        onModesChange(selectedModes.filter((item) => item !== mode))
                      }
                      aria-label={`Remove ${t.core.modes[mode]}`}
                      className="ml-0.5 rounded-full p-0.5 text-primary/60 hover:bg-purple-100 hover:text-primary transition"
                    >
                      <X size={11} />
                    </button>
                  </span>
                );
              })}

              {selectedPetTypes.map((pet) => {
                const PetIcon = petIcons[pet as keyof typeof petIcons] || PawPrint;
                return (
                  <span
                    key={pet}
                    className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-bold text-primary border border-purple-200 shadow-2xs"
                  >
                    <PetIcon size={11} className="shrink-0 text-primary" />
                    <span>{t.core.pets[pet as keyof typeof t.core.pets] ?? pet}</span>
                    <button
                      type="button"
                      onClick={() =>
                        onPetTypesChange(selectedPetTypes.filter((item) => item !== pet))
                      }
                      aria-label={`Remove ${pet}`}
                      className="ml-0.5 rounded-full p-0.5 text-primary/60 hover:bg-purple-100 hover:text-primary transition"
                    >
                      <X size={11} />
                    </button>
                  </span>
                );
              })}

              {availableFrom || availableTo ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-bold text-primary border border-purple-200 shadow-2xs">
                  <Calendar size={11} className="shrink-0 text-primary" />
                  <span>{availableFrom || "…"} ~ {availableTo || "…"}</span>
                  <button
                    type="button"
                    onClick={onDateClear}
                    aria-label="Remove date filter"
                    className="ml-0.5 rounded-full p-0.5 text-primary/60 hover:bg-purple-100 hover:text-primary transition"
                  >
                    <X size={11} />
                  </button>
                </span>
              ) : null}

              <button
                type="button"
                onClick={onResetAllFilters}
                className="text-[11px] font-bold text-slate-500 underline decoration-slate-300 underline-offset-2 transition hover:text-primary hover:decoration-primary"
              >
                {copy.clearAllFilters}
              </button>
            </div>
          ) : (
            <div />
          )}

          {typeof totalCount === "number" ? (
            <p className="font-semibold text-slate-500 shrink-0 text-[11px]">
              {copy.resultsCount.replace("{n}", String(totalCount))}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
