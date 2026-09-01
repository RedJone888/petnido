import { useEffect, useMemo, useRef, useState } from "react";

import MapLibreMap from "@/components/location/MapLibreMap";
import type { Lang } from "@/domain/lang/types";
import cn from "@/lib/cn";
import { messages } from "@/i18n/messages";
import { getNeedPublishingMessages } from "@/modules/need-publishing/i18n/messages";
import { localizedNeedTitle } from "./need-card";
import {
  compactDate,
  formatBudget,
  formatNeedCardBudget,
  formatPetsSummary,
  type MarketplaceNeedItem,
} from "./need-card";
import { needDisplayDateRange } from "@/domain/marketplace/need-date-range";

type Props = {
  needs: MarketplaceNeedItem[];
  lang?: Lang;
  selectedLocation: { lat: number; lon: number; label: string } | null;
  radiusKm?: number;
  hoveredNeedId?: string | null;
  detailPrefix: string;
  labels: {
    selectedLocation: string;
    needLocation: string;
    approximateLocation: string;
    viewDetails: string;
    modes: {
      homeVisit: string;
      boarding: string;
      custom: string;
    };
  };
};

const modeColorMap: Record<string, string> = {
  HOME_VISIT: "#059669", // Emerald 600
  BOARDING: "#d97706",   // Amber 600
  CUSTOM: "#7c3aed",     // Violet 600
};

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function NeedMarketplaceMap({
  needs,
  lang = "en",
  selectedLocation,
  radiusKm = 25,
  detailPrefix,
  labels,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    if (containerRef.current.offsetWidth > 0) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
    return () => observer.disconnect();
  }, []);

  const isNarrow = containerWidth < 410;

  const center =
    selectedLocation ?? needs[0]?.location?.mapPoint ?? { lat: 35.681, lon: 139.767 };

  const markers = useMemo(
    () =>
      needs.map((need, index) => {
        const featuredPet = need.pets?.find((p) => p.image) ?? need.pets?.[0];
        const petImg = featuredPet?.image;
        const t = (lang && messages[lang]) ? messages[lang] : messages.en;
        const needCopy = getNeedPublishingMessages(lang || "en");
        const petSummary = formatPetsSummary(need.pets || [], lang || "en", t, needCopy);
        const budgetText = formatNeedCardBudget(need, t.core.common.openToOffers);
        const displayDates = needDisplayDateRange(need);
        const startDateStr = displayDates.startDate ? compactDate(displayDates.startDate, lang || "en") : "";
        const endDateStr = displayDates.endDate ? compactDate(displayDates.endDate, lang || "en") : "";
        const dateText =
          startDateStr && endDateStr
            ? startDateStr === endDateStr
              ? startDateStr
              : `${startDateStr} – ${endDateStr}`
            : "";
        const localizedModes: Record<string, string> = {
          HOME_VISIT: `🏠 ${labels.modes.homeVisit}`,
          BOARDING: `🏡 ${labels.modes.boarding}`,
          CUSTOM: `✨ ${labels.modes.custom}`,
        };
        const modeLabel = localizedModes[need.mode] || need.mode;
        const displayTitle = localizedNeedTitle(need, lang || "en");
        const modeColor = modeColorMap[need.mode] || "#059669";
        const locationText = need.location?.regionLabel || labels.approximateLocation;
        const detailHref = `${detailPrefix}/needs/${encodeURIComponent(need.publicId)}`;

        const customPopupHtml = `
          <div style="width:230px; font-family:system-ui,-apple-system,sans-serif; background:#ffffff; overflow:hidden; border-radius:16px; text-align:left; box-shadow: 0 16px 36px -8px rgba(30, 15, 50, 0.28); border: 1px solid rgba(226, 232, 240, 0.9);">
            ${
              petImg
                ? `
              <div style="position:relative; width:100%; height:110px; background:#f1f5f9; overflow:hidden;">
                <img src="${escapeHtml(petImg)}" alt="" style="width:100%; height:100%; object-fit:cover; display:block;" />
                <div style="position:absolute; top:8px; left:8px; background:${modeColor}; color:#ffffff; font-size:10px; font-weight:800; padding:2px 7px; border-radius:999px; box-shadow:0 2px 6px rgba(0,0,0,0.25);">
                  ${escapeHtml(modeLabel)}
                </div>
                <div style="position:absolute; bottom:8px; right:8px; background:rgba(2,6,23,0.85); backdrop-filter:blur(4px); color:#ffffff; font-size:11px; font-weight:900; padding:2px 7px; border-radius:999px; border:1px solid rgba(255,255,255,0.2);">
                  ${escapeHtml(budgetText)}
                </div>
              </div>
            `
                : `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px 6px;">
                <span style="background:${modeColor}; color:#ffffff; font-size:10px; font-weight:800; padding:2px 7px; border-radius:999px;">
                  ${escapeHtml(modeLabel)}
                </span>
                <span style="font-size:12px; font-weight:900; color:#0f172a;">${escapeHtml(budgetText)}</span>
              </div>
            `
            }
            <div style="padding:10px 12px 12px; display:flex; flex-direction:column; gap:5px; font-size:11.5px; line-height:1.35;">
              <div style="font-weight:700; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; gap:4px;">
                <span style="font-size:12px;">📍</span>
                <span style="overflow:hidden; text-overflow:ellipsis;">${escapeHtml(locationText)}</span>
              </div>
              ${
                dateText
                  ? `
                <div style="color:#64748b; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; gap:4px;">
                  <span style="font-size:12px;">📅</span>
                  <span style="overflow:hidden; text-overflow:ellipsis;">${escapeHtml(dateText)}</span>
                </div>
              `
                  : ""
              }
              ${
                petSummary
                  ? `
                <div style="color:#475569; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; gap:4px;">
                  <span style="font-size:12px;">🐾</span>
                  <span style="overflow:hidden; text-overflow:ellipsis;">${escapeHtml(petSummary)}</span>
                </div>
              `
                  : ""
              }
              <div style="margin-top:4px; padding-top:6px; border-top:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
                ${
                  need.owner?.image
                    ? `<img src="${escapeHtml(need.owner.image)}" alt="${escapeHtml(need.owner.nickname || "")}" title="${escapeHtml(need.owner.nickname || "")}" style="width:24px; height:24px; border-radius:999px; object-fit:cover; border:1px solid rgba(0,0,0,0.08); flex-shrink:0; display:block;" />`
                    : `<div title="${escapeHtml(need.owner?.nickname || "")}" style="width:24px; height:24px; border-radius:999px; background:linear-gradient(135deg, #a78bfa, #6d28d9); color:#ffffff; font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                        ${escapeHtml((need.owner?.nickname || "?").charAt(0).toUpperCase())}
                      </div>`
                }
                <a href="${detailHref}" style="font-size:11px; font-weight:800; color:#6d28d9; text-decoration:none; display:flex; align-items:center; gap:2px;">
                  ${escapeHtml(labels.viewDetails)} &rarr;
                </a>
              </div>
            </div>
          </div>
        `;

        return {
          id: need.publicId,
          lat: need.location.mapPoint.lat,
          lon: need.location.mapPoint.lon,
          color: modeColor,
          label: `${labels.needLocation}: ${displayTitle}`,
          title: displayTitle,
          description: locationText,
          href: detailHref,
          hrefLabel: labels.viewDetails,
          customPopupHtml,
        };
      }),
    [detailPrefix, labels, lang, needs],
  );

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-slate-100">
      <MapLibreMap
        lat={center.lat}
        lon={center.lon}
        zoom={9}
        editable={false}
        showPrimaryMarker={Boolean(selectedLocation)}
        primaryMarkerLabel={labels.selectedLocation}
        searchRadiusKm={selectedLocation && radiusKm && radiusKm > 0 ? radiusKm : null}
        additionalMarkers={markers}
        fitToMarkers
      />

      {/* Floating Legend with Distinct Mode Colors (Unified Single Card with 2 Left-Aligned Rows) */}
      <div className="absolute right-3.5 top-3.5 z-10 flex flex-col gap-1.5 rounded-2xl bg-white/95 px-3 py-2 text-[11px] font-bold text-slate-800 shadow-md backdrop-blur border border-slate-200/80 max-w-[calc(100%-2rem)]">
        {/* Row 1: Selected Location (when present) */}
        {selectedLocation ? (
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
                fill="#2563eb"
                stroke="white"
                strokeWidth="2"
              />
              <circle cx="14" cy="14" r="4.5" fill="white" />
            </svg>
            <span className="truncate">{labels.selectedLocation}</span>
          </div>
        ) : null}

        {/* Row 2: Care Mode Types (Adaptive 1-line or 1-per-line when narrow) */}
        <div
          className={cn(
            "flex",
            isNarrow ? "flex-col items-start gap-1.5" : "flex-row flex-wrap items-center gap-2.5",
          )}
        >
          {/* 🏠 上门照护 */}
          <span className="flex items-center gap-1.5">
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
                fill="#059669"
                stroke="white"
                strokeWidth="2"
              />
              <circle cx="14" cy="14" r="4.5" fill="white" />
            </svg>
            <span>{labels.modes.homeVisit}</span>
          </span>

          {/* 🏡 宠物寄养 */}
          <span className="flex items-center gap-1.5">
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
                fill="#d97706"
                stroke="white"
                strokeWidth="2"
              />
              <circle cx="14" cy="14" r="4.5" fill="white" />
            </svg>
            <span>{labels.modes.boarding}</span>
          </span>

          {/* ✨ 自定义需求 */}
          <span className="flex items-center gap-1.5">
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
                fill="#7c3aed"
                stroke="white"
                strokeWidth="2"
              />
              <circle cx="14" cy="14" r="4.5" fill="white" />
            </svg>
            <span>{labels.modes.custom}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
