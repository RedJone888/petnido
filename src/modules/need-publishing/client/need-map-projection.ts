import type { LocationDraft } from "@/domain/publishing/legacy-need-draft-v3";

export function lngLatToWorld(point: LocationDraft, zoom: number) {
  const scale = 256 * 2 ** zoom;
  const latitude = Math.max(-85, Math.min(85, point.lat));
  const sin = Math.sin((latitude * Math.PI) / 180);
  return {
    x: ((point.lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

export function worldToLngLat(
  point: { x: number; y: number },
  zoom: number,
): LocationDraft {
  const scale = 256 * 2 ** zoom;
  const rawLng = (point.x / scale) * 360 - 180;
  const lng = ((rawLng + 180) % 360 + 360) % 360 - 180;
  const n = Math.PI - (2 * Math.PI * point.y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat: Math.max(-85, Math.min(85, lat)), lng };
}
