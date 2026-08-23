"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  PiCaretDown,
  PiCaretUp,
  PiCheck,
  PiCursorClick,
  PiMagnifyingGlass,
  PiShieldCheck,
  PiWarningCircle,
} from "react-icons/pi";
import { Star } from "lucide-react";

import { useLanguage } from "@/components/providers/language-provider";
import { useNeedPublishingMessages } from "@/modules/need-publishing/client";
import { AddressInput } from "@/components/location/AddressField";
import type { CareType, LocationDraft } from "@/domain/publishing/legacy-need-draft-v3";
import { useLocationController } from "@/hooks/useLocationController";
import cn from "@/lib/cn";
import { StepTransport } from "./step-transport";
import { PublishingValidationAlert } from "../components/publishing-validation-alert";

const MapLibreMap = dynamic(() => import("@/components/location/MapLibreMap"), {
  ssr: false,
});

export type SavedLocationOption = {
  id: string;
  label: string | null;
  lat: unknown;
  lon: unknown;
  regionLabel: string | null;
  displayPrecision: string;
  isDefault: boolean;
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-baseline gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
        {label}
      </span>
      {children}
    </label>
  );
}

function BoardingDistancePicker({
  distance,
  onDistanceChange,
}: {
  distance: string;
  onDistanceChange: (value: string) => void;
}) {
  const needMessages = useNeedPublishingMessages();
  const copy = needMessages.needPublishingEnvironment;
  const distanceLabel = needMessages.needPublishingClient.area.distanceLabel;
  const customMatch = distance.match(
    /^Custom: ((?:\d+(?:\.\d+)?)|(?:\.\d+)) km$/,
  );
  const customActive = distance === "Custom distance" || Boolean(customMatch);
  const [customDistance, setCustomDistance] = useState(customMatch?.[1] ?? "");
  const distanceOptions = [
    { value: "No preference", label: copy.distanceOptions.none },
    { value: "5 km", label: copy.distanceOptions.five },
    { value: "10 km", label: copy.distanceOptions.ten },
    { value: "20 km", label: copy.distanceOptions.twenty },
  ];
  const parsedCustomDistance = Number(customDistance);
  const customDistanceIsValid =
    /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(customDistance) &&
    Number.isFinite(parsedCustomDistance) &&
    parsedCustomDistance > 0;
  const selectCustomDistance = () =>
    onDistanceChange(
      customDistanceIsValid
        ? `Custom: ${customDistance.trim()} km`
        : "Custom distance",
    );
  const updateCustomDistance = (value: string) => {
    const numeric = value.replace(/[^\d.]/g, "");
    const [whole, ...decimalParts] = numeric.split(".");
    const next = decimalParts.length
      ? `${whole}.${decimalParts.join("")}`
      : whole;
    setCustomDistance(next);
    const parsed = Number(next);
    const valid =
      /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(next) &&
      Number.isFinite(parsed) &&
      parsed > 0;
    onDistanceChange(valid ? `Custom: ${next} km` : "Custom distance");
  };
  const customDistanceInvalid = customActive && !customDistanceIsValid;
  return (
    <section aria-labelledby="boarding-distance-title">
      <h3
        id="boarding-distance-title"
        className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]"
      >
        {distanceLabel}
      </h3>
      <div className="flex flex-wrap items-center gap-2">
        {distanceOptions.map((item) => (
          <button
            type="button"
            key={item.value}
            onClick={() => onDistanceChange(item.value)}
            className={cn(
              "min-h-10 rounded-full border px-4 text-xs font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2",
              distance === item.value
                ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                : "border-[#ded9e0] bg-white text-[#554e59] hover:border-[var(--primary-border)]",
            )}
          >
            {item.label}
          </button>
        ))}
        <span className="inline-flex shrink-0 items-start gap-2">
          <button
            type="button"
            onClick={selectCustomDistance}
            className={cn(
              "min-h-10 rounded-full border px-4 text-xs font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2",
              customActive
                ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                : "border-[#ded9e0] bg-white text-[#554e59] hover:border-[var(--primary-border)]",
            )}
          >
            {copy.customDistance}
          </button>
          {customActive && (
            <span className="relative flex flex-col items-start">
              <label
                className={cn(
                  "flex min-h-10 items-center gap-1 rounded-xl border bg-white px-3 transition focus-within:ring-2 focus-within:ring-[var(--primary)] focus-within:ring-offset-2",
                  customDistanceInvalid
                    ? "border-[#d47a85]"
                    : "border-[var(--primary-border-strong)]",
                )}
              >
                <span className="text-xs font-bold text-[#554e59]">
                  {copy.withinDistance}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  aria-label={copy.customMaximumDistance}
                  aria-invalid={customDistanceInvalid}
                  value={customDistance}
                  onChange={(event) => updateCustomDistance(event.target.value)}
                  className="w-14 bg-transparent text-xs font-bold text-[#35243f] outline-none placeholder:font-normal placeholder:text-[#aaa3ae]"
                  placeholder={needMessages.needPublishingClient.area.customDistanceInput}
                />
                <span className="text-xs font-bold text-[#554e59]">{copy.unit}</span>
              </label>
              {customDistanceInvalid && (
                <span
                  role="alert"
                  className="pointer-events-none absolute left-0 top-[calc(100%+2px)] z-10 inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-medium text-danger-text"
                >
                  <PiWarningCircle className="shrink-0" size={12} />
                  {copy.invalidDistance}
                </span>
              )}
            </span>
          )}
        </span>
      </div>
    </section>
  );
}

export function StepArea({
  careType,
  area,
  onChange,
  areaConfirmed,
  onAreaConfirmedChange,
  location,
  onLocationChange,
  savedLocations,
  distance,
  onDistanceChange,
  transport,
  onTransportChange,
  splitDirection,
  onSplitDirectionChange,
  showValidation,
}: {
  careType: CareType;
  area: string;
  onChange: (value: string) => void;
  areaConfirmed: boolean;
  onAreaConfirmedChange: (value: boolean) => void;
  location: LocationDraft;
  onLocationChange: (value: LocationDraft) => void;
  savedLocations: SavedLocationOption[];
  distance: string;
  onDistanceChange: (value: string) => void;
  transport: string;
  onTransportChange: (value: string) => void;
  splitDirection: "owner-dropoff" | "sitter-dropoff";
  onSplitDirectionChange: (value: "owner-dropoff" | "sitter-dropoff") => void;
  showValidation: boolean;
}) {
  const needMessages = useNeedPublishingMessages();
  const copy = needMessages.needPublishingArea;
  const selectSavedLocation = (savedLocation: SavedLocationOption) => {
    const lat = Number(savedLocation.lat);
    const lng = Number(savedLocation.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const displayPrecision = [
      "CITY",
      "DISTRICT",
      "NEIGHBORHOOD",
      "MAP_POINT",
    ].includes(savedLocation.displayPrecision)
      ? (savedLocation.displayPrecision as NonNullable<
          LocationDraft["displayPrecision"]
        >)
      : "MAP_POINT";
    const next = {
      sourceLocationId: savedLocation.id,
      displayPrecision,
      regionLabel: savedLocation.regionLabel,
      lat,
      lng,
    };
    const displayLabel =
      savedLocation.label ||
      savedLocation.regionLabel ||
      (Number.isFinite(lat) && Number.isFinite(lng)
        ? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        : copy.savedLocation);
    onChange(displayLabel);
    onAreaConfirmedChange(true);
    onLocationChange(next);
  };
  return (
    <div className={cn("space-y-6", careType === "boarding" && "space-y-5")}>
      <AreaLocationEditor
        key={location.sourceLocationId ?? "custom-area"}
        area={area}
        areaConfirmed={areaConfirmed}
        location={location}
        savedLocations={savedLocations}
        showValidation={showValidation}
        onChange={onChange}
        onAreaConfirmedChange={onAreaConfirmedChange}
        onLocationChange={onLocationChange}
        onSelectSavedLocation={selectSavedLocation}
      />
      <div className="inline-flex w-fit max-w-full items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs font-semibold leading-5 text-amber-900">
        <PiShieldCheck className="mt-0.5 shrink-0" size={17} />
        <span>{needMessages.needPublishingClient.area.privacyReminder}</span>
      </div>
      {careType === "boarding" && (
        <>
          <BoardingDistancePicker
            distance={distance}
            onDistanceChange={onDistanceChange}
          />
          <StepTransport
            transport={transport}
            onTransportChange={onTransportChange}
            splitDirection={splitDirection}
            onSplitDirectionChange={onSplitDirectionChange}
          />
        </>
      )}
    </div>
  );
}

function AreaLocationEditor({
  area,
  areaConfirmed,
  location,
  savedLocations,
  showValidation,
  onChange,
  onAreaConfirmedChange,
  onLocationChange,
  onSelectSavedLocation,
}: {
  area: string;
  areaConfirmed: boolean;
  location: LocationDraft;
  savedLocations: SavedLocationOption[];
  showValidation: boolean;
  onChange: (value: string) => void;
  onAreaConfirmedChange: (value: boolean) => void;
  onLocationChange: (value: LocationDraft) => void;
  onSelectSavedLocation: (value: SavedLocationOption) => void;
}) {
  const { t } = useLanguage();
  const needMessages = useNeedPublishingMessages();
  const copy = needMessages.needPublishingArea;
  const mapAvailable = Boolean(process.env.NEXT_PUBLIC_MAPTILER_KEY);
  const initialRef = useRef({ area, location });
  const controller = useLocationController({
    location: {
      label: initialRef.current.area,
      regionLabel: initialRef.current.location.regionLabel,
      lat: initialRef.current.location.lat,
      lon: initialRef.current.location.lng,
    },
  });

  useEffect(() => {
    const label = controller.location.label.trim();
    const query = controller.queryLabel;

    if (controller.source === "search") {
      if (query !== area) onChange(query);
      if (query !== area || areaConfirmed) onAreaConfirmedChange(false);
      return;
    }

    const nextLocation: LocationDraft = {
      ...location,
      lat: controller.location.lat,
      lng: controller.location.lon,
      regionLabel:
        controller.location.regionLabel ||
        controller.location.label ||
        undefined,
      ...(controller.source === "database" || !label
        ? {}
        : { sourceLocationId: undefined, displayPrecision: "MAP_POINT" }),
    };
    if (
      nextLocation.lat !== location.lat ||
      nextLocation.lng !== location.lng ||
      nextLocation.sourceLocationId !== location.sourceLocationId ||
      nextLocation.displayPrecision !== location.displayPrecision
    ) {
      onLocationChange(nextLocation);
    }
    if (label && label !== area) onChange(label);
    const confirmed = Boolean(label) && !controller.isReverseLoading;
    if (confirmed !== areaConfirmed) onAreaConfirmedChange(confirmed);
  }, [
    area,
    areaConfirmed,
    controller.isReverseLoading,
    controller.location.label,
    controller.location.lat,
    controller.location.lon,
    controller.location.regionLabel,
    controller.queryLabel,
    controller.source,
    location,
    onAreaConfirmedChange,
    onChange,
    onLocationChange,
  ]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-start gap-3 sm:flex-row md:max-w-[calc(100%_-_215px)] lg:max-w-[calc(100%_-_225px)]">
        <div className="order-2 w-full min-w-0 flex-1 sm:order-1">
          <Field label={copy.fieldLabel}>
            <div className="relative">
              <PiMagnifyingGlass
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-6 z-10 -translate-y-1/2 text-[#8a5d34]"
                size={19}
              />
              <AddressInput
                inputId="need-area-location-search"
                controller={controller}
                placeholder={t.settings.locations.searchPlaceholder}
                className={cn(
                  "h-12 !pl-11 !pr-10 !text-sm",
                  showValidation &&
                    !areaConfirmed &&
                    "!border-danger-border focus:!border-danger-text focus:!ring-4 focus:!ring-danger-ring",
                )}
              />
            </div>
          </Field>
        </div>
        {savedLocations.length > 0 ? (
          <div className="order-1 sm:order-2">
            <SavedLocationPicker
              savedLocations={savedLocations}
              selectedId={location.sourceLocationId}
              onSelect={onSelectSavedLocation}
            />
          </div>
        ) : null}
      </div>

      {mapAvailable ? (
        <div
          data-location-map
          className="relative h-72 min-h-72 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
        >
          <MapLibreMap
            lat={controller.location.lat}
            lon={controller.location.lon}
            editable
            onLocationChange={controller.setByMap}
          />
          {controller.isReverseLoading ? (
            <div
              role="status"
              className="pointer-events-none absolute bottom-3 left-1/2 z-20 inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/80 bg-white/90 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-[0_3px_14px_rgba(30,41,59,0.18)] backdrop-blur-sm"
            >
              <span
                aria-hidden="true"
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--primary-border)] border-t-[var(--primary)]"
              />
              {t.settings.locations.identifyingArea}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="rounded-xl bg-slate-100 p-3 text-sm text-slate-600">
          {t.settings.locations.mapUnavailable}
        </p>
      )}

      {showValidation && !areaConfirmed ? (
        <PublishingValidationAlert>{copy.confirm}</PublishingValidationAlert>
      ) : null}
    </div>
  );
}

function SavedLocationPicker({
  savedLocations,
  selectedId,
  onSelect,
}: {
  savedLocations: SavedLocationOption[];
  selectedId?: string;
  onSelect: (value: SavedLocationOption) => void;
}) {
  const { t } = useLanguage();
  const needMessages = useNeedPublishingMessages();
  const copy = needMessages.needPublishingArea;
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div ref={pickerRef} className="relative z-30 shrink-0 sm:mt-[23px]">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[var(--primary-border)] bg-white py-1.5 pl-2 pr-3.5 text-sm font-bold text-[var(--primary)] transition hover:border-[var(--primary-border-strong)] hover:bg-[var(--primary-subtle)]"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-fixed)] text-[var(--primary)]">
          <PiCursorClick size={17} />
        </span>
        {copy.chooseSaved}
        {open ? <PiCaretUp size={16} /> : <PiCaretDown size={16} />}
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          <div
            role="listbox"
            aria-label={copy.chooseSaved}
            className="max-h-80 space-y-1 overflow-y-auto overscroll-contain"
          >
            {savedLocations.map((savedLocation) => {
              const selected = selectedId === savedLocation.id;
              const lat = Number(savedLocation.lat);
              const lon = Number(savedLocation.lon);
              const label =
                savedLocation.label ||
                savedLocation.regionLabel ||
                (Number.isFinite(lat) && Number.isFinite(lon)
                  ? `${lat.toFixed(4)}, ${lon.toFixed(4)}`
                  : copy.savedLocation);
              return (
                <button
                  key={savedLocation.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onSelect(savedLocation);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-purple-50",
                    selected && "bg-emerald-50",
                  )}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">
                      {label}
                    </span>
                    {savedLocation.isDefault ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                        <Star className="h-3 w-3 fill-current" />
                        {t.settings.locations.defaultBadge}
                      </span>
                    ) : null}
                  </span>
                  {selected ? (
                    <PiCheck
                      className="shrink-0 text-emerald-700"
                      size={18}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Compatibility export
export const NeedAreaScreen = StepArea;
