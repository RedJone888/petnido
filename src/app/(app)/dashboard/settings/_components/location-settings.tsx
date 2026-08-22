"use client";

import { ChevronDown, Pencil, Plus, Star, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PiMagnifyingGlass, PiShieldCheck } from "react-icons/pi";

import { AddressInput } from "@/components/location/AddressField";
import { ModalShell } from "@/components/ui/modal-shell";
import { useLocationController } from "@/hooks/useLocationController";
import { useConfirm } from "@/hooks/useConfirm";
import { useConfirmStore } from "@/store/useConfirmStore";
import { useAdaptiveDropdownPlacement } from "@/hooks/useAdaptiveDropdownPlacement";
import { trpc } from "@/utils/trpc";
import { useLanguage } from "@/components/providers/language-provider";
import {
  settingsFieldLabelClass,
  softActionButtonClass,
} from "./settings-card";

const MapLibreMap = dynamic(() => import("@/components/location/MapLibreMap"), {
  ssr: false,
});

type LocationSeed = {
  id: string | null;
  regionLabel: string;
  lat: number;
  lon: number;
  makeDefault: boolean;
};

const emptyLocation: LocationSeed = {
  id: null,
  regionLabel: "",
  lat: 34.6937,
  lon: 135.5023,
  makeDefault: true,
};

function LocationEditor({
  seed,
  busy,
  mapAvailable,
  onCancel,
  onSave,
}: {
  seed: LocationSeed;
  busy: boolean;
  mapAvailable: boolean;
  onCancel: () => void;
  onSave: (values: {
    id: string | null;
    regionLabel: string;
    lat: number;
    lon: number;
    makeDefault: boolean;
  }) => Promise<void>;
}) {
  const { t, lang } = useLanguage();
  const copy = t.settings.locations;
  const locationFieldCopy = {
    en: {
      label: "Location",
      privacy:
        "Search for a city, district, neighborhood, or station, or choose an approximate point on the map. Do not enter a street number, building, floor, or room number.",
    },
    zh: {
      label: "位置",
      privacy:
        "搜索城市、市区、街区或车站，或在地图上选择大致位置。请勿输入门牌号、楼栋、楼层或房号。",
    },
    ja: {
      label: "場所",
      privacy:
        "市区町村、地域、駅名を検索するか、地図上でおおよその地点を選んでください。番地、建物名、階、部屋番号は入力しないでください。",
    },
  }[lang];
  const [makeDefault, setMakeDefault] = useState(seed.makeDefault);
  const controller = useLocationController({
    location: {
      label: seed.regionLabel,
      lat: seed.lat,
      lon: seed.lon,
    },
  });
  const selected =
    controller.source !== "search" &&
    Boolean(controller.location.label.trim()) &&
    Number.isFinite(controller.location.lat) &&
    Number.isFinite(controller.location.lon);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || controller.isReverseLoading) return;
    await onSave({
      id: seed.id,
      regionLabel: controller.location.label.trim(),
      lat: controller.location.lat,
      lon: controller.location.lon,
      makeDefault,
    });
  }

  return (
    <ModalShell
      title={seed.id ? copy.edit : copy.newLocation}
      titleId="location-editor-title"
      closeLabel={copy.close}
      cancelLabel={copy.cancel}
      saveLabel={copy.save}
      savingLabel={copy.saving}
      saving={busy}
      saveDisabled={!mapAvailable || !selected || controller.isReverseLoading}
      onClose={onCancel}
      onCancel={onCancel}
      onSubmit={submit}
      bodyClassName="space-y-3"
    >
      <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <PiShieldCheck className="mt-0.5 shrink-0" size={18} />
        <span>{locationFieldCopy.privacy}</span>
      </div>

      <div>
        <label
          htmlFor="address-location-search"
          className={`${settingsFieldLabelClass} mb-2`}
        >
          {locationFieldCopy.label}
        </label>
        <div className="relative">
          <PiMagnifyingGlass
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#8a5d34]"
            size={19}
          />
          <AddressInput
            inputId="address-location-search"
            controller={controller}
            placeholder={copy.searchPlaceholder}
            className="h-11 !pl-11 !pr-10 !text-sm"
          />
        </div>
      </div>

      {mapAvailable ? (
        <div
          data-location-map
          className="relative mt-3 h-72 min-h-[18rem] max-h-[18rem] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
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
              {copy.identifyingArea}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 rounded-xl bg-slate-100 p-3 text-sm text-slate-600">
          {copy.mapUnavailable}
        </p>
      )}

      {!seed.id ? (
        <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={makeDefault}
            onChange={(event) => setMakeDefault(event.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          {copy.makeDefault}
        </label>
      ) : null}
    </ModalShell>
  );
}

export function LocationSettings() {
  const { t } = useLanguage();
  const copy = t.settings.locations;
  const confirm = useConfirm();
  const setConfirmLoading = useConfirmStore((state) => state.setIsDeleting);
  const closeConfirm = useConfirmStore((state) => state.close);
  const utils = trpc.useUtils();
  const locations = trpc.savedLocation.listMine.useQuery();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editorSeed, setEditorSeed] = useState<LocationSeed | null>(null);
  const [editorVersion, setEditorVersion] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [optimisticDefaultId, setOptimisticDefaultId] = useState<string | null>(
    null,
  );
  const addressDropdown = useAdaptiveDropdownPlacement(
    dropdownOpen,
    dropdownRef,
  );
  const refresh = async () => {
    await utils.savedLocation.listMine.invalidate();
    await utils.serviceProfile.getSettings.invalidate();
  };
  const create = trpc.savedLocation.create.useMutation({ onSuccess: refresh });
  const update = trpc.savedLocation.update.useMutation({ onSuccess: refresh });
  const setDefault = trpc.savedLocation.setDefault.useMutation({
    onMutate: ({ id }) => setOptimisticDefaultId(id),
    onSuccess: async () => {
      await refresh();
      setOptimisticDefaultId(null);
    },
    onError: () => setOptimisticDefaultId(null),
  });
  const archive = trpc.savedLocation.archive.useMutation({
    onSuccess: refresh,
  });
  const busy = create.isLoading || update.isLoading;
  const mapAvailable = Boolean(process.env.NEXT_PUBLIC_MAPTILER_KEY);
  const serverDefaultId = locations.data?.find(
    (location) => location.isDefault,
  )?.id;
  const effectiveDefaultId = optimisticDefaultId ?? serverDefaultId;
  const orderedLocations = [...(locations.data ?? [])].sort((a, b) => {
    if (a.id === effectiveDefaultId) return -1;
    if (b.id === effectiveDefaultId) return 1;
    return Number(a.createdAt) - Number(b.createdAt);
  });
  const defaultLocation = orderedLocations[0];

  useEffect(() => {
    if (!dropdownOpen) return;
    function closeOnOutsideClick(event: MouseEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [dropdownOpen]);

  useEffect(() => {
    if (!editorSeed) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [editorSeed]);

  function openEditor(seed: LocationSeed) {
    setDropdownOpen(false);
    setEditorVersion((version) => version + 1);
    setEditorSeed(seed);
  }

  async function saveLocation(values: {
    id: string | null;
    regionLabel: string;
    lat: number;
    lon: number;
    makeDefault: boolean;
  }) {
    const payload = {
      label: null,
      regionLabel: values.regionLabel,
      lat: values.lat,
      lon: values.lon,
      displayPrecision: "MAP_POINT" as const,
    };
    try {
      if (values.id) {
        await update.mutateAsync({ id: values.id, ...payload });
      } else {
        await create.mutateAsync({
          ...payload,
          makeDefault: values.makeDefault,
        });
      }
      toast.success(values.id ? copy.updateSuccess : copy.createSuccess);
      setEditorSeed(null);
    } catch {
      toast.error(copy.saveError);
    }
  }

  async function chooseDefault(id: string) {
    setDropdownOpen(false);
    if (id === effectiveDefaultId || setDefault.isLoading) return;
    try {
      await setDefault.mutateAsync({ id });
      toast.success(copy.setDefaultSuccess);
    } catch {
      toast.error(copy.setDefaultError);
    }
  }

  return (
    <section
      id="locations"
      className="grid gap-3 py-4 md:grid-cols-[112px_minmax(0,1fr)] md:items-start md:gap-5"
      data-profile-row="address"
    >
      <p className="text-sm font-bold text-slate-700 md:flex md:h-11 md:items-center">
        {copy.label}
      </p>
      <div className="min-w-0 max-w-3xl">
        {locations.isLoading ? (
          <div className="motion-safe:animate-pulse">
            <div className="h-11 max-w-md rounded-xl bg-slate-200/80" />
          </div>
        ) : orderedLocations.length === 0 ? (
          <div className="flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center">
            <p
              data-empty-address-field
              className="flex min-h-11 min-w-0 items-center rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-500 sm:max-w-md sm:flex-1"
            >
              {copy.notSet}
            </p>
            <button
              type="button"
              onClick={() => openEditor(emptyLocation)}
              className={`${softActionButtonClass} shrink-0`}
            >
              {copy.add}
            </button>
          </div>
        ) : (
          <div ref={dropdownRef} className="relative max-w-md">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={dropdownOpen}
              aria-controls="saved-address-menu"
              onClick={() => setDropdownOpen((value) => !value)}
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-3 text-left text-sm text-slate-900 transition hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-purple-100"
            >
              <span className="min-w-0 truncate">
                {defaultLocation
                  ? defaultLocation.regionLabel ||
                    defaultLocation.label ||
                    (Number.isFinite(Number(defaultLocation.lat)) &&
                    Number.isFinite(Number(defaultLocation.lon))
                      ? `${Number(defaultLocation.lat).toFixed(4)}, ${Number(defaultLocation.lon).toFixed(4)}`
                      : copy.unnamed)
                  : copy.none}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-slate-500 transition ${dropdownOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            {dropdownOpen ? (
              <div
                id="saved-address-menu"
                role="menu"
                data-address-dropdown
                className={`absolute left-0 right-0 z-40 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ${
                  addressDropdown.placement === "top"
                    ? "bottom-full mb-2"
                    : "top-full mt-2"
                }`}
                style={{ maxHeight: addressDropdown.maxHeight }}
              >
                {locations.isLoading ? (
                  <p className="px-3 py-2 text-sm text-slate-500">
                    {copy.loading}
                  </p>
                ) : orderedLocations.length ? (
                  orderedLocations.map((location) => {
                    const isDefault = location.id === effectiveDefaultId;
                    const displayName =
                      location.regionLabel ||
                      location.label ||
                      (Number.isFinite(Number(location.lat)) &&
                      Number.isFinite(Number(location.lon))
                        ? `${Number(location.lat).toFixed(4)}, ${Number(location.lon).toFixed(4)}`
                        : copy.unnamed);
                    return (
                      <div
                        key={location.id}
                        data-address-item
                        data-default={isDefault ? "true" : "false"}
                        className="flex items-center gap-1 rounded-xl hover:bg-slate-50"
                      >
                        <button
                          type="button"
                          role="menuitemradio"
                          aria-checked={isDefault}
                          data-address-select
                          onClick={() => void chooseDefault(location.id)}
                          className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-slate-800"
                        >
                          <span className="min-w-0 truncate">
                            {displayName}
                          </span>
                          {isDefault ? (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                              <Star className="h-3 w-3 fill-current" />
                              {copy.defaultBadge}
                            </span>
                          ) : null}
                        </button>
                        <button
                          type="button"
                          aria-label={`${copy.edit}: ${displayName}`}
                          onClick={() =>
                            openEditor({
                              id: location.id,
                              regionLabel:
                                location.regionLabel ?? location.label ?? "",
                              lat: Number(location.lat),
                              lon: Number(location.lon),
                              makeDefault: isDefault,
                            })
                          }
                          className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`${copy.delete}: ${displayName}`}
                          disabled={archive.isLoading}
                          onClick={async () => {
                            const accepted = await confirm({
                              title: copy.delete,
                              content: <p>{copy.deleteQuestion}</p>,
                              confirmText: copy.deleteConfirm,
                              cancelText: copy.cancel,
                              variant: "danger",
                            });
                            if (!accepted) return;
                            setConfirmLoading(true);
                            try {
                              await archive.mutateAsync({ id: location.id });
                              toast.success(copy.deleteSuccess);
                            } catch {
                              toast.error(copy.deleteError);
                            } finally {
                              setConfirmLoading(false);
                              closeConfirm();
                            }
                          }}
                          className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-danger-text"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })
                ) : null}
                <button
                  type="button"
                  role="menuitem"
                  data-address-add
                  onClick={() => openEditor(emptyLocation)}
                  className={`${softActionButtonClass} mt-1 w-full !justify-start`}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {copy.add}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {editorSeed ? (
        <LocationEditor
          key={`${editorSeed.id ?? "new"}-${editorVersion}`}
          seed={editorSeed}
          busy={busy}
          mapAvailable={mapAvailable}
          onCancel={() => setEditorSeed(null)}
          onSave={saveLocation}
        />
      ) : null}
    </section>
  );
}
