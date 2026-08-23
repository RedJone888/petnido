import { describe, expect, it } from "vitest";

import { lngLatToWorld, worldToLngLat } from "./need-map-projection";

describe("guided need map projection", () => {
  it.each([
    { lat: 35.681236, lng: 139.767125 },
    { lat: -33.8688, lng: 151.2093 },
    { lat: 0, lng: 0 },
  ])("round-trips $lat, $lng", (location) => {
    const restored = worldToLngLat(lngLatToWorld(location, 13), 13);
    expect(restored.lat).toBeCloseTo(location.lat, 6);
    expect(restored.lng).toBeCloseTo(location.lng, 6);
  });

  it("keeps coordinates inside the renderable map range", () => {
    const north = worldToLngLat(lngLatToWorld({ lat: 90, lng: 540 }, 5), 5);
    expect(north.lat).toBeLessThanOrEqual(85);
    expect(north.lng).toBeGreaterThanOrEqual(-180);
    expect(north.lng).toBeLessThan(180);
  });
});
