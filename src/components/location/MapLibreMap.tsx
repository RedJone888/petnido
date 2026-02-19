"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_THEMES, DEFAULT_STYLE } from "@/domain/location/constants";
import cn from "@/lib/cn";
type Props = {
  lat: number;
  lon: number;
  zoom?: number;
  editable?: boolean;
  onLocationChange?: (lat: number, lon: number) => void;
  showPrivacyRadius?: boolean;
};
export default function MapLibreMap({
  lat,
  lon,
  zoom = 14,
  editable = true,
  onLocationChange,
  showPrivacyRadius = false,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const coordsRef = useRef({ lat, lon, zoom });
  const [styleId, setStyleId] = useState(DEFAULT_STYLE);

  const [isReady, setIsReady] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const isInternalChange = useRef(false);
  const [isAnimationActive, setIsAnimationActive] = useState(false);
  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;

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
        }
      }
    });

    if (mapRef.current) observer.observe(mapRef.current);
    //针对Modal动画的补充检测
    const timer = setTimeout(() => {
      if (mapRef.current && mapRef.current.offsetWidth > 0) {
        setIsReady(true);
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
      style: `https://api.maptiler.com/maps/${styleId}/style.json?key=${key}`,
      center: [lon, lat],
      zoom,
      trackResize: true,
      scrollZoom: false,
      attributionControl: false,
    });
    m.addControl(
      new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: true,
      }),
      "bottom-right",
    );
    if (editable ?? Boolean(onLocationChange)) {
      m.on("click", (e) => {
        isInternalChange.current = true;
        onLocationChange?.(e.lngLat.lat, e.lngLat.lng);
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
    });
    mapInstance.current = m;

    return () => {
      m.remove();
      mapInstance.current = null;
      markerRef.current = null;
    };
  }, [isReady]);

  // Step 3 — Marker 与外部坐标同步
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapLoaded) return;
    // 处理marker的创建或者移动
    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({
        color: "#7a2cff",
        draggable: editable ?? Boolean(onLocationChange),
      })
        .setLngLat([lon, lat])
        .addTo(map);
      setTimeout(() => {
        setIsAnimationActive(true);
      }, 100);
      if (editable ?? Boolean(onLocationChange)) {
        markerRef.current.on("dragstart", () => {
          isInternalChange.current = true;
        });
        markerRef.current.on("dragend", (e) => {
          const pos = e.target.getLngLat();
          onLocationChange?.(pos.lat, pos.lng);
          setTimeout(() => {
            isInternalChange.current = false;
          }, 100);
        });
      }
    } else {
      markerRef.current.setLngLat([lon, lat]);
    }

    if (showPrivacyRadius) {
      // 如果是寄养模式，隐藏 Marker 或者让 Marker 不可拖拽
      markerRef.current?.getElement().classList.add("hidden");
    } else {
      markerRef.current?.getElement().classList.remove("hidden");
    }
    // --- 圆圈逻辑 ---
    const sourceId = "privacy-circle";
    const circleData = createGeoJSONCircle([lon, lat], 0.5); // 0.5km = 500m

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(circleData);
    } else {
      map.addSource(sourceId, { type: "geojson", data: circleData });
      map.addLayer({
        id: "circle-fill",
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": "#8200db",
          "fill-opacity": 0.2, // 淡淡的遮罩
          "fill-outline-color": "#8200db",
        },
      });
    }

    //处理地图视角的同步
    if (!isInternalChange.current) {
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
  }, [lat, lon, showPrivacyRadius, zoom, mapLoaded]);

  // Step 4 — handle style change
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapLoaded || !styleId) return;
    const newStyle = `https://api.maptiler.com/maps/${styleId}/style.json?key=${key}`;
    if (map.getStyle().name !== styleId) {
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
  return (
    <div className="relative w-full h-full">
      <div className="absolute top-1 left-2 z-10 flex gap-1">
        {MAP_THEMES.map((t) => (
          <div key={t.id} className="relative group">
            <button
              onClick={() => setStyleId(t.id)}
              className={cn(
                "rounded-md px-1 py-0.5 text-xs font-medium",
                "border transition",
                styleId === t.id
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100",
              )}
            >
              {t.label}
            </button>
            <div
              className={cn(
                "pointer-events-none absolute left-0 top-full z-10 mt-1",
                "whitespace-nowrap rounded-md",
                "bg-black/80 px-1 py-0.5 text-[10px] text-white",
                "opacity-0 group-hover:opacity-100 transition",
              )}
            >
              {t.description}
            </div>
          </div>
        ))}
      </div>

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
