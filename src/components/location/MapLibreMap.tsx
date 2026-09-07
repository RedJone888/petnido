"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_THEMES, DEFAULT_STYLE } from "@/domain/location/constants";
import cn from "@/lib/cn";
import { useLanguage } from "@/components/providers/language-provider";
import { LocateFixed, ChevronDown } from "lucide-react";
type Props = {
  lat: number;
  lon: number;
  zoom?: number;
  editable?: boolean;
  onLocationChange?: (lat: number, lon: number) => void;
  showPrivacyRadius?: boolean;
  searchRadiusKm?: number | null;
  showPrimaryMarker?: boolean;
  primaryMarkerLabel?: string;
  primaryMarkerColor?: string;
  additionalMarkers?: Array<{
    id: string;
    lat: number;
    lon: number;
    label: string;
    markerLabel?: string;
    color?: string;
    title?: string;
    description?: string;
    href?: string;
    hrefLabel?: string;
    customPopupHtml?: string;
  }>;
  fitToMarkers?: boolean;
  scrollZoom?: boolean;
};
export default function MapLibreMap({
  lat,
  lon,
  zoom = 14,
  editable = true,
  onLocationChange,
  showPrivacyRadius = false,
  searchRadiusKm,
  showPrimaryMarker = true,
  primaryMarkerLabel,
  primaryMarkerColor = "#2563eb",
  additionalMarkers = [],
  fitToMarkers = false,
  scrollZoom = true,
}: Props) {
  const { t, lang } = useLanguage();
  const copy = t.location;
  const initialLangRef = useRef(lang);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const additionalMarkerRefs = useRef<maplibregl.Marker[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const coordsRef = useRef({ lat, lon, zoom });
  const onLocationChangeRef = useRef(onLocationChange);
  const editableRef = useRef(editable);
  const initialStyleIdRef = useRef(DEFAULT_STYLE);
  const currentStyleIdRef = useRef(DEFAULT_STYLE);
  const mapKeyRef = useRef(process.env.NEXT_PUBLIC_MAPTILER_KEY);
  const [styleId, setStyleId] = useState(DEFAULT_STYLE);
  const [containerWidth, setContainerWidth] = useState(600);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [isReady, setIsReady] = useState(false);
  const [styleVersion, setStyleVersion] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);
  const isInternalChange = useRef(false);
  useEffect(() => {
    const labels = lang === "ja" ? ["地図", "拡大", "縮小"] : lang === "zh" ? ["地图", "放大", "缩小"] : ["Map", "Zoom in", "Zoom out"];
    const container = mapRef.current;
    container?.setAttribute("aria-label", labels[0]);
    container?.querySelectorAll('[role="region"]').forEach(element => element.setAttribute("aria-label", labels[0]));
    ["canvas", ".maplibregl-ctrl-zoom-in", ".maplibregl-ctrl-zoom-out"].forEach((selector, index) => {
      const element = container?.querySelector(selector);
      element?.setAttribute("aria-label", labels[index]);
      element?.setAttribute("title", labels[index]);
    });
  }, [lang, mapLoaded]);

  const [isAnimationActive, setIsAnimationActive] = useState(false);
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
    editableRef.current = editable;
  }, [editable, onLocationChange]);

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isDropdownOpen]);

  //更新坐标引用
  useEffect(() => {
    coordsRef.current = { lat, lon, zoom };
  }, [lat, lon, zoom]);
  // Step 1 — 容器尺寸检测
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          setIsReady(true);
          setContainerWidth(entry.contentRect.width);
        }
      }
    });

    if (mapRef.current) {
      observer.observe(mapRef.current);
      if (mapRef.current.offsetWidth > 0) {
        setContainerWidth(mapRef.current.offsetWidth);
      }
    }
    //针对Modal动画的补充检测
    const timer = setTimeout(() => {
      if (mapRef.current && mapRef.current.offsetWidth > 0) {
        setIsReady(true);
        setContainerWidth(mapRef.current.offsetWidth);
      }
    }, 350);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  // Step 2 — Map lifecycle (create + style.load binding)
  useEffect(() => {
    //容器就绪，DOM存在，实例未创建时才初始化
    if (!isReady || !mapRef.current || mapInstance.current) return;
    const m = new maplibregl.Map({
      container: mapRef.current,
      style: `https://api.maptiler.com/maps/${initialStyleIdRef.current}/style.json?key=${mapKeyRef.current}`,
      center: [coordsRef.current.lon, coordsRef.current.lat],
      zoom: coordsRef.current.zoom,
      trackResize: true,
      scrollZoom: Boolean(scrollZoom),
      attributionControl: false,
      locale: {
        "Map.Title": initialLangRef.current === "ja" ? "地図" : initialLangRef.current === "zh" ? "地图" : "Map",
        "NavigationControl.ZoomIn": initialLangRef.current === "ja" ? "拡大" : initialLangRef.current === "zh" ? "放大" : "Zoom in",
        "NavigationControl.ZoomOut": initialLangRef.current === "ja" ? "縮小" : initialLangRef.current === "zh" ? "缩小" : "Zoom out",
      },
    });
    m.addControl(
      new maplibregl.NavigationControl({
        showCompass: false,
        showZoom: true,
      }),
      "top-left",
    );
    if (editableRef.current ?? Boolean(onLocationChangeRef.current)) {
      m.on("click", (e) => {
        isInternalChange.current = true;
        onLocationChangeRef.current?.(e.lngLat.lat, e.lngLat.lng);
      });
    }
    m.on("load", () => {
      m.resize();
      //触发一次微调，确保瓦片加载
      setTimeout(() => {
        m.resize();
      }, 100);
      setMapLoaded(true);
    });
    m.on("style.load", () => {
      m.resize();
      m.jumpTo({
        center: [coordsRef.current.lon, coordsRef.current.lat],
        zoom: coordsRef.current.zoom,
      });
      if (markerRef.current) markerRef.current.addTo(m);
      setStyleVersion((v) => v + 1);
    });
    mapInstance.current = m;

    return () => {
      m.remove();
      mapInstance.current = null;
      markerRef.current = null;
      additionalMarkerRefs.current = [];
    };
  }, [isReady, scrollZoom]);

  useEffect(() => {
    if (!mapInstance.current) return;
    if (scrollZoom) {
      mapInstance.current.scrollZoom.enable();
    } else {
      mapInstance.current.scrollZoom.disable();
    }
  }, [scrollZoom]);

  // Step 3 — Marker 与外部坐标同步
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapLoaded) return;
    // 处理marker的创建或者移动
    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({
        color: primaryMarkerColor,
        draggable: editable ?? Boolean(onLocationChangeRef.current),
      })
        .setLngLat([lon, lat])
        .addTo(map);
      setTimeout(() => {
        setIsAnimationActive(true);
      }, 100);
      if (editable ?? Boolean(onLocationChangeRef.current)) {
        markerRef.current.on("dragstart", () => {
          isInternalChange.current = true;
        });
        markerRef.current.on("dragend", (e) => {
          const pos = e.target.getLngLat();
          onLocationChangeRef.current?.(pos.lat, pos.lng);
          setTimeout(() => {
            isInternalChange.current = false;
          }, 100);
        });
      }
    } else {
      markerRef.current.setLngLat([lon, lat]);
      const svgPath = markerRef.current.getElement().querySelector("svg path[fill]");
      if (svgPath) svgPath.setAttribute("fill", primaryMarkerColor);
    }
    markerRef.current.setDraggable(editable ?? Boolean(onLocationChangeRef.current));

    markerRef.current.getElement().setAttribute("aria-label", primaryMarkerLabel || copy.mapSelection);
    markerRef.current.getElement().setAttribute("role", "img");
    if (showPrivacyRadius || !showPrimaryMarker) {
      // 如果是寄养模式，隐藏 Marker 或者让 Marker 不可拖拽
      markerRef.current?.getElement().classList.add("hidden");
    } else {
      markerRef.current?.getElement().classList.remove("hidden");
    }
    // Only privacy-area maps should show an approximate radius. A regular
    // location pin must remain unobstructed.
    const sourceId = "privacy-circle";
    if (showPrivacyRadius) {
      const circleData = createGeoJSONCircle([lon, lat], 0.5);
      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(
          circleData,
        );
      } else {
        map.addSource(sourceId, { type: "geojson", data: circleData });
        map.addLayer({
          id: "circle-fill",
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": "#8200db",
            "fill-opacity": 0.2,
            "fill-outline-color": "#8200db",
          },
        });
      }
    } else {
      if (map.getLayer("circle-fill")) map.removeLayer("circle-fill");
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    }

    // Search radius circle layer (Soft purple translucent fill with distinct dashed boundary)
    const searchSourceId = "search-radius-circle";
    const searchFillLayerId = "search-radius-fill";
    const searchLineLayerId = "search-radius-line";

    if (searchRadiusKm && searchRadiusKm > 0 && showPrimaryMarker) {
      const radiusCircleData = createGeoJSONCircle([lon, lat], searchRadiusKm, 96);
      const existingSource = map.getSource(searchSourceId) as maplibregl.GeoJSONSource | undefined;
      if (existingSource) {
        existingSource.setData(radiusCircleData);
      } else {
        map.addSource(searchSourceId, { type: "geojson", data: radiusCircleData });
      }

      if (!map.getLayer(searchFillLayerId)) {
        map.addLayer({
          id: searchFillLayerId,
          type: "fill",
          source: searchSourceId,
          paint: {
            "fill-color": "#7c3aed",
            "fill-opacity": 0.09,
          },
        });
      }
      if (!map.getLayer(searchLineLayerId)) {
        map.addLayer({
          id: searchLineLayerId,
          type: "line",
          source: searchSourceId,
          paint: {
            "line-color": "#7c3aed",
            "line-opacity": 0.65,
            "line-width": 2,
            "line-dasharray": [4, 4],
          },
        });
      }
    } else {
      if (map.getLayer(searchLineLayerId)) map.removeLayer(searchLineLayerId);
      if (map.getLayer(searchFillLayerId)) map.removeLayer(searchFillLayerId);
      if (map.getSource(searchSourceId)) map.removeSource(searchSourceId);
    }

    //处理地图视角的同步
    if (!isInternalChange.current && !fitToMarkers) {
      map.flyTo({
        center: [lon, lat],
        zoom,
        duration: 600,
        essential: true,
      });
    } else {
      setTimeout(() => {
        isInternalChange.current = false;
      }, 100);
    }
  }, [editable, fitToMarkers, lat, lon, primaryMarkerColor, primaryMarkerLabel, showPrimaryMarker, showPrivacyRadius, searchRadiusKm, zoom, mapLoaded, styleVersion, copy.mapSelection]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapLoaded) return;
    additionalMarkerRefs.current.forEach((marker) => marker.remove());
    additionalMarkerRefs.current = [];
    const bounds = new maplibregl.LngLatBounds();
    if (showPrimaryMarker) {
      bounds.extend([lon, lat]);
      if (searchRadiusKm && searchRadiusKm > 0) {
        const latDelta = searchRadiusKm / 110.574;
        const lonDelta = searchRadiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
        bounds.extend([lon - lonDelta, lat - latDelta]);
        bounds.extend([lon + lonDelta, lat + latDelta]);
      }
    }

    additionalMarkers.forEach((item) => {
      const element = document.createElement("button");
      element.type = "button";
      element.className = "shared-map-additional-marker";
      element.setAttribute("aria-label", item.label);
      const fillColor = item.color || "#059669";
      element.innerHTML = `
        <svg width="28" height="35" viewBox="0 0 28 35" fill="none" xmlns="http://www.w3.org/2000/svg" class="shared-map-pin-svg">
          <path d="M14 1C6.82 1 1 6.82 1 14C1 23.5 14 34 14 34C14 34 27 23.5 27 14C27 6.82 21.18 1 14 1Z" fill="${fillColor}" stroke="white" stroke-width="2"/>
          ${
            item.markerLabel
              ? `<text x="14" y="14.5" fill="white" font-size="11" font-weight="900" text-anchor="middle" dominant-baseline="central" font-family="system-ui, -apple-system, sans-serif">${item.markerLabel}</text>`
              : `<circle cx="14" cy="14" r="4.5" fill="white"/>`
          }
        </svg>
      `;

      const popupContent = document.createElement("div");
      if (item.customPopupHtml) {
        popupContent.className = "shared-map-custom-popup";
        popupContent.innerHTML = item.customPopupHtml;
      } else {
        popupContent.className = "shared-map-popup";
        if (item.title) {
          const title = document.createElement("strong");
          title.textContent = item.title;
          popupContent.append(title);
        }
        if (item.description) {
          const description = document.createElement("p");
          description.textContent = item.description;
          popupContent.append(description);
        }
        if (item.href && item.hrefLabel) {
          const link = document.createElement("a");
          link.href = item.href;
          link.textContent = item.hrefLabel;
          popupContent.append(link);
        }
      }

      const popup = new maplibregl.Popup({
        offset: 20,
        maxWidth: "280px",
        closeButton: false,
        closeOnClick: false,
        className: "shared-map-hover-card-popup",
      }).setDOMContent(popupContent);

      let isHoveringMarker = false;
      let isHoveringPopup = false;
      let closeTimer: ReturnType<typeof setTimeout> | null = null;

      const scheduleClose = () => {
        if (closeTimer) clearTimeout(closeTimer);
        closeTimer = setTimeout(() => {
          if (!isHoveringMarker && !isHoveringPopup) {
            popup.remove();
          }
        }, 120);
      };

      element.addEventListener("mouseenter", () => {
        isHoveringMarker = true;
        if (closeTimer) clearTimeout(closeTimer);
        popup.setLngLat([item.lon, item.lat]).addTo(map);
      });

      element.addEventListener("mouseleave", () => {
        isHoveringMarker = false;
        scheduleClose();
      });

      popupContent.addEventListener("mouseenter", () => {
        isHoveringPopup = true;
        if (closeTimer) clearTimeout(closeTimer);
      });

      popupContent.addEventListener("mouseleave", () => {
        isHoveringPopup = false;
        scheduleClose();
      });

      element.addEventListener("click", () => {
        if (item.href) {
          window.location.href = item.href;
        }
      });

      const marker = new maplibregl.Marker({ element, anchor: "bottom" })
        .setLngLat([item.lon, item.lat])
        .addTo(map);
      additionalMarkerRefs.current.push(marker);
      bounds.extend([item.lon, item.lat]);
    });

    if ((fitToMarkers || (searchRadiusKm && searchRadiusKm > 0)) && !bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 500 });
    }
  }, [additionalMarkers, fitToMarkers, lat, lon, mapLoaded, searchRadiusKm, showPrimaryMarker, styleVersion]);

  // Step 4 — handle style change
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapLoaded || !styleId) return;
    if (styleId !== currentStyleIdRef.current) {
      currentStyleIdRef.current = styleId;
      const newStyle = `https://api.maptiler.com/maps/${styleId}/style.json?key=${mapKeyRef.current}`;
      map.setStyle(newStyle);
    }
  }, [styleId, mapLoaded]);
  // 这是一个生成圆点坐标的辅助函数
  function createGeoJSONCircle(
    center: [number, number],
    radiusInKm: number,
    points: number = 64,
  ) {
    const coords = { latitude: center[1], longitude: center[0] };
    const ret = [];
    const distanceX =
      radiusInKm / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
    const distanceY = radiusInKm / 110.574;

    for (let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);
      ret.push([coords.longitude + x, coords.latitude + y]);
    }
    ret.push(ret[0]);
    return {
      type: "Feature" as const,
      geometry: { type: "Polygon" as const, coordinates: [ret] },
      properties: {},
    };
  }
  const isCompact = containerWidth < 460;

  return (
    <div className="relative w-full h-full">
      {/* Floating Modern Map Layer Switcher (Container-Adaptive, Pure Text) */}
      <div ref={dropdownRef} className="absolute bottom-3.5 right-3.5 z-10 max-w-[calc(100%-2rem)]">
        {isCompact ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-2xl bg-white/95 px-3 py-2 text-xs font-bold text-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md border border-slate-200/80 ring-1 ring-slate-900/[0.04] transition hover:bg-white hover:text-primary active:scale-95"
            >
              {(() => {
                const localized = {
                  "jp-mierune-streets": [copy.mapStyleStandard],
                  "streets-v2": [copy.mapStyleDetailed],
                  "basic-v2": [copy.mapStyleSimple],
                  "toner-v2": [copy.mapStyleMonochrome],
                  satellite: [copy.mapStyleSatellite],
                }[styleId] ?? [styleId];
                return (
                  <>
                    <span>{localized[0]}</span>
                    <ChevronDown
                      size={13}
                      className={cn(
                        "text-slate-400 transition-transform",
                        isDropdownOpen && "rotate-180",
                      )}
                    />
                  </>
                );
              })()}
            </button>

            {isDropdownOpen ? (
              <div className="absolute bottom-full right-0 mb-2 w-44 overflow-hidden rounded-2xl bg-white/95 p-1.5 shadow-2xl backdrop-blur-md border border-slate-200/90 animate-in fade-in slide-in-from-bottom-2 duration-150">
                {MAP_THEMES.map((theme) => {
                  const localized = {
                    "jp-mierune-streets": [
                      copy.mapStyleStandard,
                      copy.mapStyleStandardDescription,
                    ],
                    "streets-v2": [
                      copy.mapStyleDetailed,
                      copy.mapStyleDetailedDescription,
                    ],
                    "basic-v2": [
                      copy.mapStyleSimple,
                      copy.mapStyleSimpleDescription,
                    ],
                    "toner-v2": [
                      copy.mapStyleMonochrome,
                      copy.mapStyleMonochromeDescription,
                    ],
                    satellite: [
                      copy.mapStyleSatellite,
                      copy.mapStyleSatelliteDescription,
                    ],
                  }[theme.id] ?? [theme.label, theme.description];
                  const isActive = styleId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        setStyleId(theme.id);
                        setIsDropdownOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition",
                        isActive
                          ? "bg-primary text-white font-black shadow-sm"
                          : "text-slate-700 font-semibold hover:bg-slate-100 hover:text-slate-900",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate leading-tight">{localized[0]}</p>
                        <p
                          className={cn(
                            "truncate text-[10px] mt-0.5 font-normal",
                            isActive ? "text-white/80" : "text-slate-400",
                          )}
                        >
                          {localized[1]}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center gap-1 rounded-2xl bg-white/95 p-1 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md border border-slate-200/80 ring-1 ring-slate-900/[0.04]">
            {MAP_THEMES.map((theme) => {
              const localized = {
                "jp-mierune-streets": [
                  copy.mapStyleStandard,
                  copy.mapStyleStandardDescription,
                ],
                "streets-v2": [
                  copy.mapStyleDetailed,
                  copy.mapStyleDetailedDescription,
                ],
                "basic-v2": [
                  copy.mapStyleSimple,
                  copy.mapStyleSimpleDescription,
                ],
                "toner-v2": [
                  copy.mapStyleMonochrome,
                  copy.mapStyleMonochromeDescription,
                ],
                satellite: [
                  copy.mapStyleSatellite,
                  copy.mapStyleSatelliteDescription,
                ],
              }[theme.id] ?? [theme.label, theme.description];

              const isActive = styleId === theme.id;

              return (
                <div key={theme.id} className="relative group">
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setStyleId(theme.id)}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200",
                      isActive
                        ? "bg-primary text-white shadow-sm scale-[1.02]"
                        : "text-slate-600 hover:bg-slate-100/90 hover:text-slate-900",
                    )}
                  >
                    <span>{localized[0]}</span>
                  </button>

                  {/* Floating Tooltip Bubble */}
                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <div className="relative whitespace-nowrap rounded-lg bg-slate-900/90 px-2.5 py-1 text-[10.5px] font-medium text-white shadow-lg backdrop-blur-sm">
                      {localized[1]}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900/90" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        aria-label={copy.centerMap}
        title={copy.centerMap}
        onClick={() =>
          mapInstance.current?.flyTo({
            center: [lon, lat],
            zoom,
            duration: 500,
            essential: true,
          })
        }
        className="absolute left-[10px] top-[76px] z-10 grid h-[32px] w-[32px] place-items-center rounded-xl bg-white/95 text-slate-700 shadow-md border border-slate-200/80 backdrop-blur-md transition-all hover:bg-white hover:text-primary hover:scale-105 active:scale-95"
      >
        <LocateFixed className="h-4 w-4" aria-hidden="true" />
      </button>

      <div
        ref={mapRef}
        className={cn(
          "w-full h-full overflow-hidden",
          isAnimationActive ? "marker-animate" : "marker-preparing",
        )}
        style={{
          transform: "translateZ(0)",
          WebkitTransform: "translateZ(0)",
          zIndex: 1,
        }}
      />

      <style jsx global>{`
        .marker-preparing .maplibregl-marker {
          opacity: 0 !important;
          pointer-events: none;
        }
        .marker-animate .maplibregl-marker {
          animation: drop 0.4s ease-out forwards;
          cursor: pointer;
        }
        .maplibregl-ctrl-group {
          border-radius: 12px !important;
          border: none !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1) !important;
          overflow: hidden;
        }
        .maplibregl-ctrl-group button + button {
          border-top: 1px solid #f0f0f0 !important;
        }
        .maplibregl-ctrl-icon {
          transform: scale(0.9);
        }
        .maplibregl-ctrl-compass .maplibregl-ctrl-icon {
          filter: invert(16%) speia(99%) saturate(7470%) hue-rotate(278deg)
            brightness(91%) contrast(116%);
        }
        .shared-map-additional-marker {
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          filter: drop-shadow(0 3px 6px rgba(65, 36, 86, 0.35));
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease;
        }
        .shared-map-additional-marker:hover {
          transform: scale(1.18) translateY(-3px);
          filter: drop-shadow(0 8px 14px rgba(65, 36, 86, 0.45));
          z-index: 50;
        }
        .shared-map-pin-svg {
          display: block;
        }
        .shared-map-popup { display: grid; gap: 5px; padding: 10px 14px; background: #ffffff; border-radius: 12px; box-shadow: 0 12px 28px -6px rgba(30, 20, 40, 0.2); border: 1px solid rgba(226, 232, 240, 0.9); }
        .shared-map-popup strong { color: #17131b; font-size: 13px; line-height: 1.35; }
        .shared-map-popup p { margin: 0; color: #64748b; font-size: 11px; }
        .shared-map-popup a { margin-top: 3px; color: var(--primary); font-size: 12px; font-weight: 800; text-decoration: underline; }
        .shared-map-custom-popup { width: 230px; overflow: hidden; border-radius: 16px; background: transparent; }
        .maplibregl-popup-content { border-radius: 16px; padding: 0 !important; box-shadow: none !important; border: none !important; background: transparent !important; overflow: visible; }
        .maplibregl-popup-anchor-bottom .maplibregl-popup-tip { border-top-color: #ffffff !important; }
        .maplibregl-popup-anchor-top .maplibregl-popup-tip { border-bottom-color: #ffffff !important; }
        .maplibregl-popup-anchor-left .maplibregl-popup-tip { border-right-color: #ffffff !important; }
        .maplibregl-popup-anchor-right .maplibregl-popup-tip { border-left-color: #ffffff !important; }
        @keyframes drop {
          0% {
            margin-top: -20px;
            opacity: 0;
          }
          100% {
            margin-top: 0px;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
