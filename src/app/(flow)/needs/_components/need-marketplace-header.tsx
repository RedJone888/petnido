"use client";

import {
  Calendar,
  ChevronRight,
  Layers,
  Loader2,
  MapPin,
  PawPrint,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";

import LocationInput from "@/components/location/LocationInput";
import type { Lang } from "@/domain/lang/types";
import { messages } from "@/i18n/messages";
import cn from "@/lib/cn";
import type { Mode } from "./need-card";
import {
  modeIcons,
  modes,
  petIcons,
  petTypes,
  type FilterOption,
} from "./filters/filter-types";
import { MultiSelectFilter } from "./filters/multi-select-filter";
import { DateFilter } from "./filters/date-filter";
import { DistanceFilter } from "./filters/distance-filter";

export type { FilterOption };
export { MultiSelectFilter, DateFilter, DistanceFilter };

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
              href="/"
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
          {/* Compound Location & Distance Search Bar */}
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

        {/* 3. Active Filters Chips & Results Count */}
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
