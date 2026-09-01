"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GripVertical } from "lucide-react";

import { usePageLanguage } from "@/components/providers/language-provider";
import type { Lang } from "@/domain/lang/types";
import { useDebounce } from "@/hooks/useDebounce";
import { messages } from "@/i18n/messages";
import cn from "@/lib/cn";
import { isPetTypeCode } from "@/modules/need-publishing/domain/pet-types";
import { trpc } from "@/utils/trpc";
import type { RouterOutputs } from "@/server/trpc";
import { NeedCard, NeedCardSkeleton, type MarketplaceNeedItem, type Mode } from "./need-card";
import { NeedMarketplaceHeader } from "./need-marketplace-header";

const DEFAULT_SPLIT_PERCENT = 60;
const MIN_SPLIT_PERCENT = 42;
const MAX_SPLIT_PERCENT = 75;
const SPLIT_STORAGE_KEY = "petnido_needs_split_ratio";
const FILTERS_STORAGE_KEY = "petnido_needs_marketplace_filters";

const NeedMarketplaceMap = dynamic(
  () => import("./need-marketplace-map").then((module) => module.NeedMarketplaceMap),
  {
    ssr: false,
    loading: () => (
      <div className="relative h-full w-full overflow-hidden bg-slate-100/90 animate-pulse">
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
        <div className="absolute top-[35%] left-[45%] flex items-center justify-center">
          <div className="h-7 w-7 rounded-full bg-primary/20 border-2 border-white shadow-md animate-pulse" />
        </div>
      </div>
    ),
  },
);

export function NeedMarketplace({
  initialLanguage,
  initialData,
}: {
  initialLanguage?: Lang;
  initialData?: any;
} = {}) {
  const lang = usePageLanguage(initialLanguage);
  const t = messages[lang];
  const copy = t.core.marketplace;
  const prefix = initialLanguage ? `/${initialLanguage}` : "";

  const containerRef = useRef<HTMLDivElement>(null);
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const isHydratedRef = useRef(false);
  const [splitPercent, setSplitPercent] = useState(DEFAULT_SPLIT_PERCENT);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedModes, setSelectedModes] = useState<Mode[]>([]);
  const [selectedPetTypes, setSelectedPetTypes] = useState<string[]>([]);
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo] = useState("");
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [locationQuery, setLocationQuery] = useState("");
  const [origin, setOrigin] = useState<{ lat: number; lon: number; label: string } | null>(
    null,
  );
  const [cursor, setCursor] = useState<string | undefined>();
  const [hoveredNeedId, setHoveredNeedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  const [containerWidth, setContainerWidth] = useState<number>(700);

  // Dynamically observe left pane width for horizontal masonry
  useEffect(() => {
    if (!leftPaneRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) {
          setContainerWidth(width);
        }
      }
    });
    observer.observe(leftPaneRef.current);
    return () => observer.disconnect();
  }, []);

  // Restore stored split percent on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SPLIT_STORAGE_KEY);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= MIN_SPLIT_PERCENT && parsed <= MAX_SPLIT_PERCENT) {
          setSplitPercent(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Restore stored filters from URL search params or sessionStorage on mount
  useEffect(() => {
    try {
      const search = window.location.search;
      if (search && search.length > 1) {
        const params = new URLSearchParams(search);
        const modesParam = params.get("modes");
        const petsParam = params.get("pets");
        const fromParam = params.get("from");
        const toParam = params.get("to");
        const radiusParam = params.get("radius");
        const qParam = params.get("q");
        const latParam = params.get("lat");
        const lonParam = params.get("lon");

        if (modesParam) {
          const parsedModes = modesParam
            .split(",")
            .filter((m): m is Mode => ["HOME_VISIT", "BOARDING", "CUSTOM"].includes(m));
          if (parsedModes.length > 0) setSelectedModes(parsedModes);
        }
        if (petsParam) {
          const parsedPets = petsParam.split(",").filter(Boolean);
          if (parsedPets.length > 0) setSelectedPetTypes(parsedPets);
        }
        if (fromParam) setAvailableFrom(fromParam);
        if (toParam) setAvailableTo(toParam);
        if (radiusParam) {
          const parsedRadius = parseInt(radiusParam, 10);
          if (!isNaN(parsedRadius) && [0, 10, 25, 50, 100].includes(parsedRadius)) {
            setRadiusKm(parsedRadius);
          }
        }
        if (latParam && lonParam) {
          const lat = parseFloat(latParam);
          const lon = parseFloat(lonParam);
          if (!isNaN(lat) && !isNaN(lon)) {
            setOrigin({ lat, lon, label: qParam || copy.selectedLocation });
            setLocationQuery(qParam || copy.selectedLocation);
          }
        } else if (qParam) {
          setLocationQuery(qParam);
        }
      } else {
        const saved = sessionStorage.getItem(FILTERS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.selectedModes)) setSelectedModes(parsed.selectedModes);
          if (Array.isArray(parsed.selectedPetTypes)) setSelectedPetTypes(parsed.selectedPetTypes);
          if (typeof parsed.availableFrom === "string") setAvailableFrom(parsed.availableFrom);
          if (typeof parsed.availableTo === "string") setAvailableTo(parsed.availableTo);
          if (typeof parsed.radiusKm === "number") setRadiusKm(parsed.radiusKm);
          // Location is intentionally not restored from session storage.
          // Visiting /needs starts without an implicit address filter; only
          // URL parameters or a new explicit user selection may set one.
        }
      }
    } catch {
      // ignore
    } finally {
      isHydratedRef.current = true;
    }
  }, [copy.selectedLocation]);

  // Sync active filters to URL search params and sessionStorage
  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      const params = new URLSearchParams();
      if (selectedModes.length > 0) params.set("modes", selectedModes.join(","));
      if (selectedPetTypes.length > 0) params.set("pets", selectedPetTypes.join(","));
      if (availableFrom) params.set("from", availableFrom);
      if (availableTo) params.set("to", availableTo);
      if (radiusKm !== 25) params.set("radius", String(radiusKm));
      if (origin) {
        params.set("lat", String(origin.lat));
        params.set("lon", String(origin.lon));
        if (origin.label) params.set("q", origin.label);
      } else if (locationQuery.trim()) {
        params.set("q", locationQuery.trim());
      }

      const qs = params.toString();
      const nextUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
      window.history.replaceState(null, "", nextUrl);

      if (
        selectedModes.length === 0 &&
        selectedPetTypes.length === 0 &&
        !availableFrom &&
        !availableTo &&
        radiusKm === 25 &&
        !origin &&
        !locationQuery.trim()
      ) {
        sessionStorage.removeItem(FILTERS_STORAGE_KEY);
      } else {
        sessionStorage.setItem(
          FILTERS_STORAGE_KEY,
          JSON.stringify({
            selectedModes,
            selectedPetTypes,
            availableFrom,
            availableTo,
            radiusKm,
            origin,
            locationQuery,
          }),
        );
      }
    } catch {
      // ignore
    }
  }, [availableFrom, availableTo, locationQuery, origin, radiusKm, selectedModes, selectedPetTypes]);

  const debouncedLocation = useDebounce(locationQuery.trim(), 300);
  const locationSearch = trpc.location.search.useQuery(
    { q: debouncedLocation, limit: 8, language: lang },
    { enabled: debouncedLocation.length > 0, refetchOnWindowFocus: false },
  );

  const dateRangeInvalid = Boolean(
    availableFrom && availableTo && availableFrom >= availableTo,
  );
  const filter = useMemo(
    () => ({
      modes: selectedModes,
      petTypes: selectedPetTypes.filter(isPetTypeCode),
      taskCategories: [],
      availableFrom: availableFrom
        ? new Date(`${availableFrom}T00:00:00`).toISOString()
        : undefined,
      availableTo: availableTo
        ? new Date(`${availableTo}T00:00:00`).toISOString()
        : undefined,
      origin: origin
        ? {
            lat: origin.lat,
            lon: origin.lon,
            radiusMeters: radiusKm > 0 ? radiusKm * 1000 : 500_000,
          }
        : undefined,
    }),
    [availableFrom, availableTo, origin, radiusKm, selectedModes, selectedPetTypes],
  );

  const mapLabels = useMemo(
    () => ({
      selectedLocation: copy.selectedLocation,
      needLocation: copy.needMapLocation,
      approximateLocation: copy.approximateLocation,
      viewDetails: t.core.common.viewDetails,
      modes: {
        homeVisit: t.core.modes.HOME_VISIT,
        boarding: t.core.modes.BOARDING,
        custom: t.core.modes.CUSTOM,
      },
    }),
    [
      copy.approximateLocation,
      copy.needMapLocation,
      copy.selectedLocation,
      t.core.common.viewDetails,
      t.core.modes.BOARDING,
      t.core.modes.CUSTOM,
      t.core.modes.HOME_VISIT,
    ],
  );

  const needs = trpc.marketplaceNeed.list.useQuery(
    { filter, limit: 20, cursor },
    {
      enabled: !dateRangeInvalid,
      initialData: !cursor && initialData ? initialData : undefined,
    },
  );

  // Compute number of columns based on left pane width (keeping each column in 240px - 280px range)
  const effectiveWidth = Math.max(260, containerWidth - 40);
  const maxPossibleColumns = Math.max(1, Math.floor((effectiveWidth + 14) / (240 + 14)));

  // Distribute items into columns horizontally (row-first: card 0 in col 0, card 1 in col 1, card 2 in col 2...)
  const columns = useMemo(() => {
    const items = needs.data?.items ?? [];
    if (items.length === 0) return [];

    const numCols = Math.min(items.length, maxPossibleColumns);
    const cols: Array<Array<{ item: MarketplaceNeedItem; originalIndex: number }>> = Array.from(
      { length: numCols },
      () => [],
    );

    items.forEach((item, index) => {
      const colIdx = index % numCols;
      cols[colIdx].push({
        item: item as unknown as MarketplaceNeedItem,
        originalIndex: index,
      });
    });

    return cols;
  }, [needs.data?.items, maxPossibleColumns]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1280px)");
    const previousOverflow = document.body.style.overflow;
    const syncPageScroll = () => {
      document.body.style.overflow = desktop.matches ? "hidden" : previousOverflow;
    };
    syncPageScroll();
    desktop.addEventListener("change", syncPageScroll);
    return () => {
      desktop.removeEventListener("change", syncPageScroll);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Split Drag Handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDoubleClick = useCallback(() => {
    setSplitPercent(DEFAULT_SPLIT_PERCENT);
    try {
      localStorage.removeItem(SPLIT_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(MAX_SPLIT_PERCENT, Math.max(MIN_SPLIT_PERCENT, newPercent));
      setSplitPercent(clamped);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setSplitPercent((current) => {
        try {
          localStorage.setItem(SPLIT_STORAGE_KEY, String(current));
        } catch {
          // ignore
        }
        return current;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  function update(action: () => void) {
    setCursor(undefined);
    action();
  }

  return (
    <main
      ref={containerRef}
      style={{ "--split-percent": `${splitPercent}%` } as React.CSSProperties}
      className={cn(
        "relative h-[calc(100dvh-64px)] w-full overflow-hidden bg-[#f8f6f9]",
        isDragging && "select-none cursor-col-resize",
      )}
    >
      {/* Dragging Barrier: Prevents MapLibre canvas from capturing mouse during splitter drag */}
      {isDragging ? (
        <div className="fixed inset-0 z-[9999] cursor-col-resize bg-transparent select-none" />
      ) : null}

      <div className="flex h-full w-full px-4 sm:px-6 lg:px-8 py-3 xl:py-3.5 gap-2 xl:gap-2.5">
        {/* LEFT COLUMN: Breadcrumb + Header + Filters + Scrollable Needs List */}
        <div
          ref={leftPaneRef}
          className={cn(
            "flex h-full w-full flex-col overflow-hidden bg-[#f8f6f9] xl:w-[var(--split-percent,60%)] xl:shrink-0",
            mobileView === "map" ? "hidden xl:flex" : "flex",
          )}
        >
          {/* Header Section with Breadcrumb, Title and Filter Bar */}
          <NeedMarketplaceHeader
            lang={lang}
            prefix={prefix}
            selectedModes={selectedModes}
            selectedPetTypes={selectedPetTypes}
            availableFrom={availableFrom}
            availableTo={availableTo}
            radiusKm={radiusKm}
            locationQuery={locationQuery}
            locationResults={locationSearch.data ?? []}
            locationLoading={locationSearch.isFetching}
            locationError={null}
            dateRangeInvalid={dateRangeInvalid}
            totalCount={needs.data?.items.length}
            isLocating={false}
            onLocationChange={(value) =>
              update(() => {
                setLocationQuery(value);
                if (!value.trim()) {
                  setOrigin(null);
                }
              })
            }
            onLocationSelect={(item) =>
              update(() => {
                setLocationQuery(item.label);
                setOrigin({ ...item, label: item.label });
              })
            }
            onModesChange={(modes) => update(() => setSelectedModes(modes))}
            onPetTypesChange={(pets) => update(() => setSelectedPetTypes(pets))}
            onAvailableFromChange={(value) => update(() => setAvailableFrom(value))}
            onAvailableToChange={(value) => update(() => setAvailableTo(value))}
            onDateApply={(from, to) =>
              update(() => {
                setAvailableFrom(from);
                setAvailableTo(to);
              })
            }
            onDateClear={() =>
              update(() => {
                setAvailableFrom("");
                setAvailableTo("");
              })
            }
            onRadiusChange={(radius) => update(() => setRadiusKm(radius))}
            onResetAllFilters={() =>
              update(() => {
                setSelectedModes([]);
                setSelectedPetTypes([]);
                setAvailableFrom("");
                setAvailableTo("");
                setRadiusKm(25);
                setLocationQuery("");
                setOrigin(null);
                try {
                  window.history.replaceState(null, "", window.location.pathname);
                  sessionStorage.removeItem(FILTERS_STORAGE_KEY);
                } catch {
                  // ignore
                }
              })
            }
          />

          {/* Scrollable Need Cards Content Area */}
          <div className="flex-1 overflow-y-auto px-0 py-2 sm:py-3 overscroll-contain pr-1 sm:pr-2">
            {dateRangeInvalid ? (
              <p
                role="alert"
                className="mb-6 rounded-xl bg-danger-bg p-4 text-sm font-bold text-danger-text"
              >
                {copy.dateRangeError}
              </p>
            ) : null}
            {!dateRangeInvalid && needs.isLoading ? (
              <section
                className="flex gap-3 sm:gap-3.5 items-start"
                aria-label={copy.searchingNeeds}
              >
                {Array.from({ length: maxPossibleColumns }).map((_, colIdx) => (
                  <div
                    key={colIdx}
                    className="flex flex-1 flex-col gap-3 sm:gap-3.5 min-w-0 max-w-[280px]"
                  >
                    <NeedCardSkeleton key={1} />
                    <NeedCardSkeleton key={2} />
                    <NeedCardSkeleton key={3} />
                  </div>
                ))}
              </section>
            ) : null}
            {!dateRangeInvalid && needs.error ? (
              <p
                role="alert"
                className="mb-6 rounded-xl bg-danger-bg p-4 text-sm font-bold text-danger-text"
              >
                {copy.needsError}
              </p>
            ) : null}
            {!dateRangeInvalid && !needs.isLoading && needs.data?.items.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-base font-bold text-slate-700">{copy.noNeeds}</p>
              </div>
            ) : null}

            {/* Dynamic Horizontal-First Masonry Layout (Natural Height per Card, Zero Blank Space, 240px-280px) */}
            <section
              className="flex gap-3 sm:gap-3.5 items-start"
              aria-label={copy.requestResults}
            >
              {columns.map((col, colIdx) => (
                <div
                  key={colIdx}
                  className="flex flex-1 flex-col gap-3 sm:gap-3.5 min-w-0 max-w-[280px]"
                >
                  {col.map(({ item, originalIndex }) => (
                    <NeedCard
                      key={item.publicId}
                      need={item}
                      lang={lang}
                      prefix={prefix}
                      index={originalIndex}
                      isHovered={hoveredNeedId === item.publicId}
                      onMouseEnter={() => setHoveredNeedId(item.publicId)}
                      onMouseLeave={() =>
                        setHoveredNeedId((curr) => (curr === item.publicId ? null : curr))
                      }
                    />
                  ))}
                </div>
              ))}
            </section>

            {/* Pagination Button */}
            {needs.data?.nextCursor ? (
              <div className="mb-6 mt-8 text-center">
                <button
                  type="button"
                  onClick={() => setCursor(needs.data?.nextCursor ?? undefined)}
                  className="min-h-11 rounded-xl border border-primary bg-white px-6 text-sm font-black text-primary shadow-sm transition hover:bg-purple-50"
                >
                  {t.core.common.next}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* RESIZABLE SPLIT DIVIDER (Desktop Only) */}
        <div
          role="separator"
          aria-orientation="vertical"
          tabIndex={0}
          title="按住拖动调整宽度 · 双击重置"
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          className={cn(
            "group relative hidden h-full w-2.5 shrink-0 cursor-col-resize items-center justify-center transition-colors xl:flex z-20 select-none",
            isDragging ? "bg-primary/20" : "hover:bg-purple-100/80 active:bg-primary/20",
          )}
        >
          {/* Vertical separator line */}
          <div className="h-full w-[1px] bg-slate-200/90 transition group-hover:bg-primary/60 group-active:bg-primary" />
          {/* Grip handle */}
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 flex h-8 w-3.5 items-center justify-center rounded-full border bg-white shadow-sm transition-all",
              isDragging
                ? "border-primary bg-primary text-white scale-110 shadow-md"
                : "border-slate-200 text-slate-400 group-hover:border-primary/50 group-hover:text-primary group-hover:scale-105",
            )}
          >
            <GripVertical size={12} strokeWidth={2.5} />
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Map with Breathing Room */}
        <aside
          className={cn(
            "h-full flex-1 overflow-hidden",
            mobileView === "list" ? "hidden xl:block" : "block",
          )}
          aria-label={copy.mapTitle}
        >
          <div className="h-full w-full overflow-hidden rounded-2xl 2xl:rounded-3xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-900/[0.04]">
            <NeedMarketplaceMap
              needs={needs.data?.items ?? []}
              lang={lang}
              selectedLocation={origin}
              radiusKm={radiusKm}
              hoveredNeedId={hoveredNeedId}
              detailPrefix={prefix}
              labels={mapLabels}
            />
          </div>
        </aside>
      </div>

      {/* Floating View Toggle for Mobile/Tablet (< xl) */}
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 xl:hidden">
        <button
          type="button"
          onClick={() => setMobileView((prev) => (prev === "list" ? "map" : "list"))}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-slate-900 px-5 text-xs font-black text-white shadow-xl transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {mobileView === "list" ? (
            <>
              <span>🗺️</span>
              <span>{copy.showMap}</span>
            </>
          ) : (
            <>
              <span>📋</span>
              <span>{copy.showList}</span>
            </>
          )}
        </button>
      </div>
    </main>
  );
}
