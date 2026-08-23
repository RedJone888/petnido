"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { PiMapPin, PiNavigationArrow, PiPlus } from "react-icons/pi";

import { useLanguage } from "@/components/providers/language-provider";
import { useNeedPublishingMessages } from "@/modules/need-publishing/client";
import type { LocationDraft } from "@/domain/publishing/legacy-need-draft-v3";
import cn from "@/lib/cn";

import { lngLatToWorld, worldToLngLat } from "./need-map-projection";

export function NeedMapPicker({
  center,
  marker,
  zoom,
  compact = false,
  onCenterChange,
  onZoomChange,
  onSelect,
}: {
  center: LocationDraft;
  marker: LocationDraft;
  zoom: number;
  compact?: boolean;
  onCenterChange: (value: LocationDraft) => void;
  onZoomChange: (value: number) => void;
  onSelect: (value: LocationDraft) => void;
}) {
  const { t } = useLanguage();
  const needMessages = useNeedPublishingMessages();
  const copy = needMessages.needPublishingArea;
  const [dragging, setDragging] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    centerPixel: { x: number; y: number };
    moved: boolean;
  } | null>(null);
  const ignoreClickRef = useRef(false);
  const wheelDeltaRef = useRef(0);
  const lastWheelZoomRef = useRef(0);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handleWheel = (event: WheelEvent) => {
      if ((event.target as Element).closest("[data-map-controls]")) return;
      event.preventDefault();
      event.stopPropagation();
      wheelDeltaRef.current += event.deltaY;
      const now = Date.now();
      if (Math.abs(wheelDeltaRef.current) < 80 || now - lastWheelZoomRef.current < 220) return;
      onZoomChange(Math.max(3, Math.min(18, zoom + (wheelDeltaRef.current < 0 ? 1 : -1))));
      wheelDeltaRef.current = 0;
      lastWheelZoomRef.current = now;
    };
    map.addEventListener("wheel", handleWheel, { passive: false });
    return () => map.removeEventListener("wheel", handleWheel);
  }, [onZoomChange, zoom]);

  const centerPixel = lngLatToWorld(center, zoom);
  const markerPixel = lngLatToWorld(marker, zoom);
  const baseX = Math.floor(centerPixel.x / 256);
  const baseY = Math.floor(centerPixel.y / 256);
  const tileColumns = 9;
  const tileRows = 3;
  const tiles = Array.from({ length: tileColumns * tileRows }, (_, index) => ({
    x: baseX + (index % tileColumns) - Math.floor(tileColumns / 2),
    y: baseY + Math.floor(index / tileColumns) - Math.floor(tileRows / 2),
  }));
  const selectPoint = (event: React.MouseEvent<HTMLDivElement>) => {
    if (ignoreClickRef.current) {
      ignoreClickRef.current = false;
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const worldX = centerPixel.x + event.clientX - rect.left - rect.width / 2;
    const worldY = centerPixel.y + event.clientY - rect.top - rect.height / 2;
    onSelect(worldToLngLat({ x: worldX, y: worldY }, zoom));
  };
  const changeZoom = (next: number) => onZoomChange(Math.max(3, Math.min(18, next)));
  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    ignoreClickRef.current = drag.moved;
    dragStateRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      ref={mapRef}
      role="button"
      tabIndex={0}
      aria-label={copy.mapAria}
      onClick={selectPoint}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(center);
        }
      }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        dragStateRef.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          centerPixel,
          moved: false,
        };
      }}
      onPointerMove={(event) => {
        const drag = dragStateRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;
        if (!drag.moved && Math.hypot(dx, dy) < 4) return;
        drag.moved = true;
        setDragging(true);
        onCenterChange(worldToLngLat({ x: drag.centerPixel.x - dx, y: drag.centerPixel.y - dy }, zoom));
      }}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      className={cn(
        "relative block w-full overflow-hidden rounded-[16px] border border-[#ded9e0] bg-[#e9e5df] text-left touch-none overscroll-contain",
        compact ? "h-36" : "h-56",
        dragging ? "cursor-grabbing" : "cursor-grab",
      )}
    >
      {tiles.map((tile) => (
        <Image
          unoptimized
          key={`${tile.x}-${tile.y}`}
          src={`https://a.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${tile.x}/${tile.y}@2x.png`}
          alt=""
          width={512}
          height={512}
          draggable={false}
          className="pointer-events-none absolute h-64 w-64 max-w-none select-none"
          style={{
            left: `calc(50% + ${Math.round(tile.x * 256 - centerPixel.x)}px)`,
            top: `calc(50% + ${Math.round(tile.y * 256 - centerPixel.y)}px)`,
            width: 256,
            height: 256,
          }}
        />
      ))}
      <span
        className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full text-[var(--primary)] drop-shadow-[0_2px_2px_rgba(255,255,255,0.9)]"
        style={{
          left: `calc(50% + ${markerPixel.x - centerPixel.x}px)`,
          top: `calc(50% + ${markerPixel.y - centerPixel.y}px)`,
        }}
      >
        <PiMapPin size={34} />
      </span>
      <span
        data-map-controls
        onPointerDown={(event) => event.stopPropagation()}
        className="absolute right-3 top-3 z-20 flex flex-col overflow-hidden rounded-xl border border-[#ded9e0] bg-white shadow-lg"
      >
        <button
          type="button"
          aria-label={copy.zoomIn}
          title={copy.zoomIn}
          onClick={(event) => {
            event.stopPropagation();
            changeZoom(zoom + 1);
          }}
          disabled={zoom >= 18}
          className="flex h-9 w-9 items-center justify-center border-b border-[#eee9ef] text-lg font-bold text-[var(--primary)] disabled:opacity-35"
        >
          <PiPlus />
        </button>
        <button
          type="button"
          aria-label={copy.zoomOut}
          title={copy.zoomOut}
          onClick={(event) => {
            event.stopPropagation();
            changeZoom(zoom - 1);
          }}
          disabled={zoom <= 3}
          className="flex h-9 w-9 items-center justify-center border-b border-[#eee9ef] text-lg font-bold text-[var(--primary)] disabled:opacity-35"
        >
          −
        </button>
        <button
          type="button"
          aria-label={copy.recenter}
          title={copy.recenterTitle}
          onClick={(event) => {
            event.stopPropagation();
            onCenterChange(marker);
          }}
          className="flex h-9 w-9 items-center justify-center text-[var(--primary)]"
        >
          <PiNavigationArrow size={17} />
        </button>
      </span>
      <span className="pointer-events-none absolute bottom-1 right-2 z-10 rounded bg-white/90 px-1.5 py-0.5 text-[9px] text-[#5d565e]">
        {copy.mapCredit}
      </span>
    </div>
  );
}
