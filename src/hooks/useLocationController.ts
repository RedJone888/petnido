"use client";

import { useEffect, useRef, useState } from "react";
import { trpc } from "@/utils/trpc";
import { useDebounce } from "@/hooks/useDebounce";
import { getInitialLocation } from "@/lib/location/initial";
import { Currency } from "@prisma/client";
import type { LocationSource } from "@/domain/location/types";
import { COUNTRY_TO_CURRENCY } from "@/domain/location/constants";
import { useLanguage } from "@/components/providers/language-provider";
export type Location = {
  label: string;
  regionLabel?: string | null;
  lat: number;
  lon: number;
};

export function useLocationController(initial: {
  location?: Location;
  currency?: Currency;
  refreshFromCoordinates?: boolean;
}) {
  const { lang } = useLanguage();
  const initializedRef = useRef(false);
  const userInteractedRef = useRef(false);
  const [location, setLocation] = useState<Location>(
    initial.location ?? { label: "", lat: 0, lon: 0 },
  );
  const [queryLabel, setQueryLabel] = useState(location.label);
  const [source, setSource] = useState<LocationSource>("search");
  const sourceRef = useRef<LocationSource>("search");
  const [country, setCountry] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency | null>(
    initial.currency ?? null,
  );
  const [currencyTouched, setCurrencyTouched] = useState(
    initial.currency ? true : false,
  );
  const debounced = useDebounce(queryLabel, 300);
  const searchQuery = trpc.location.search.useQuery(
    { q: debounced, limit: 8, language: lang },
    {
      enabled: debounced.length > 0 && source === "search",
      refetchOnWindowFocus: false,
    },
  );
  const reverseQuery = trpc.location.reverse.useQuery(
    { lat: location.lat, lon: location.lon, language: lang },
    {
      enabled:
        (source === "reverse" || source === "map") &&
        location.lat !== 0 &&
        location.lon !== 0,
      refetchOnWindowFocus: false,
    },
  );
  /* ---------------- 初始化 ---------------- */
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    async function init() {
      // DB 已有完整信息
      if (
        initial.location?.lat != 0 &&
        initial.location?.lon != 0 &&
        initial.location?.label
      ) {
        setLocation({
          label: initial.location.label,
          regionLabel: initial.location.regionLabel,
          lat: initial.location.lat,
          lon: initial.location.lon,
        });
        sourceRef.current = initial.refreshFromCoordinates
          ? "reverse"
          : "database";
        setSource(initial.refreshFromCoordinates ? "reverse" : "database");
        setQueryLabel(initial.location.label);
        return;
      }

      // fallback：IP / browser location
      const loc = await getInitialLocation();
      if (userInteractedRef.current) return;
      setLocation({
        label: "",
        lat: loc.lat,
        lon: loc.lon,
      });
      sourceRef.current = "reverse";
      setSource("reverse");
      setQueryLabel("");
    }

    init();
  }, [initial.location, initial.refreshFromCoordinates]);

  /* ---------------- reverse geocode ---------------- */
  useEffect(() => {
    if (sourceRef.current !== "reverse" && sourceRef.current !== "map") return;
    if (reverseQuery.isFetching) return;
    if (!reverseQuery.data?.length) return;
    const r = reverseQuery.data[0];
    setLocation((prev) => ({
      ...prev,
      label: r.label,
      regionLabel: r.regionLabel,
    }));
    setQueryLabel(r.label);
    if (r.countryCode) {
      setCountry(r.countryCode);
    }
  }, [reverseQuery.data, reverseQuery.isFetching, source]);
  useEffect(() => {
    if (!country) return;
    if (currencyTouched) return;
    const next = COUNTRY_TO_CURRENCY[country];
    if (next) {
      setCurrency(next);
    }
  }, [country, currencyTouched]);

  /* ---------------- 对外暴露的“动作” ---------------- */

  /** 搜索框选中 */
  function setBySearch(next: Location) {
    userInteractedRef.current = true;
    sourceRef.current = null;
    setSource(null);
    setLocation(next);
    setQueryLabel(next.label);
  }

  /** 地图点击 / marker 拖拽 */
  function setByMap(lat: number, lon: number) {
    userInteractedRef.current = true;
    sourceRef.current = "map";
    setSource("map");
    setLocation({
      label: "",
      regionLabel: null,
      lat,
      lon,
    });
    setQueryLabel("");
  }

  /** 仅修改 label（输入中） */
  function onInputChange(text: string) {
    userInteractedRef.current = true;
    sourceRef.current = "search";
    setSource("search");
    setQueryLabel(text);
  }

  function onCurrencyChange(next: Currency) {
    setCurrency(next);
    setCurrencyTouched(true);
  }

  return {
    location,
    queryLabel,
    source,
    country,
    currency,
    searchResults: searchQuery.data ?? [],
    isSearchLoading: searchQuery.isFetching,
    isReverseLoading: reverseQuery.isFetching,

    /* actions */
    setBySearch,
    setByMap,
    onInputChange,
    onCurrencyChange,
  };
}
