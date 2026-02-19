"use client";

import { useEffect, useRef, useState } from "react";
import { trpc } from "@/utils/trpc";
import { useDebounce } from "@/hooks/useDebounce";
import { getInitialLocation } from "@/lib/location/initial";
import { Currency } from "@prisma/client";
import type { LocationSource } from "@/domain/location/types";
import { COUNTRY_TO_CURRENCY } from "@/domain/location/constants";
export type Location = {
  label: string;
  lat: number;
  lon: number;
};

export function useLocationController(initial: {
  location?: Location;
  currency?: Currency;
}) {
  const initializedRef = useRef(false);
  const [location, setLocation] = useState<Location>(
    initial.location ?? { label: "", lat: 0, lon: 0 },
  );
  const [queryLabel, setQueryLabel] = useState(location.label);
  const [source, setSource] = useState<LocationSource>("search");
  const [country, setCountry] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency | null>(
    initial.currency ?? null,
  );
  const [currencyTouched, setCurrencyTouched] = useState(
    initial.currency ? true : false,
  );
  const debounced = useDebounce(queryLabel, 300);
  const searchQuery = trpc.location.search.useQuery(
    { q: debounced, limit: 8, countrycodes: "jp" },
    {
      enabled: debounced.length > 0 && source === "search",
      refetchOnWindowFocus: false,
    },
  );
  const reverseQuery = trpc.location.reverse.useQuery(
    { lat: location.lat, lon: location.lon },
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
          lat: initial.location.lat,
          lon: initial.location.lon,
        });
        setSource("database");
        setQueryLabel(initial.location.label);
        return;
      }

      // fallback：IP / browser location
      const loc = await getInitialLocation();
      setLocation({
        label: "",
        lat: loc.lat,
        lon: loc.lon,
      });
      setSource("reverse");
      setQueryLabel("");
    }

    init();
  }, [initial.location]);

  /* ---------------- reverse geocode ---------------- */
  useEffect(() => {
    if (!reverseQuery.data?.length) return;
    const r = reverseQuery.data[0];
    setLocation((prev) => ({
      ...prev,
      label: r.label,
    }));
    setQueryLabel(r.label);
    if (r.countryCode) {
      setCountry(r.countryCode);
    }
  }, [reverseQuery.data]);
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
    setSource(null);
    setLocation(next);
    setQueryLabel(next.label);
  }

  /** 地图点击 / marker 拖拽 */
  function setByMap(lat: number, lon: number) {
    setSource("map");
    setLocation((prev) => ({
      ...prev,
      lat,
      lon,
    }));
    setQueryLabel("検索中...");
  }

  /** 仅修改 label（输入中） */
  function onInputChange(text: string) {
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
