import { getBrowserLocation, getIPLocation } from "./client";
export type InitialLocation = {
  lat: number;
  lon: number;
  source: "gps" | "ip" | "fallback";
};
export async function getInitialLocation(): Promise<InitialLocation> {
  try {
    const gps = await getBrowserLocation();
    return { ...gps, source: "gps" };
  } catch (e) {
    console.log("GPS failed → switching to IP");
  }

  const ip = await getIPLocation();
  if (ip) return { ...ip, source: "ip" };

  // fallback: Osaka 市中心
  return { lat: 34.6937, lon: 135.5023, source: "fallback" };
}
