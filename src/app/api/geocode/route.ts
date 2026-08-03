import { NextRequest, NextResponse } from "next/server";

type NominatimPlace = {
  display_name?: string;
  lat?: string;
  lon?: string;
  type?: string;
  addresstype?: string;
  address?: {
    country_code?: string;
  };
};

const geocodingBaseUrl = process.env.GEOCODING_BASE_URL ?? "https://nominatim.openstreetmap.org";
const geocodingUserAgent = process.env.GEOCODING_USER_AGENT ?? "PetNido/0.1 (pet-care marketplace prototype)";

function compactLabel(displayName: string) {
  return displayName.split(",").map((part) => part.trim()).filter(Boolean).slice(0, 4).join(", ");
}

function preferredCountryFromRequest(request: NextRequest) {
  const country = request.headers.get("x-vercel-ip-country")
    ?? request.headers.get("cf-ipcountry")
    ?? request.headers.get("x-country-code");
  return country && /^[a-z]{2}$/i.test(country) ? country.toLowerCase() : "";
}

async function requestNominatim(path: string, params: URLSearchParams) {
  const response = await fetch(`${geocodingBaseUrl}${path}?${params.toString()}`, {
    headers: {
      "Accept-Language": "en",
      "User-Agent": geocodingUserAgent,
    },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 86400 },
  });
  if (!response.ok) throw new Error(`Geocoding request failed with ${response.status}`);
  return response.json();
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("mode");

  try {
    if (mode === "search") {
      const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
      if (query.length < 2) return NextResponse.json({ results: [] });
      const focusLat = Number(request.nextUrl.searchParams.get("lat"));
      const focusLng = Number(request.nextUrl.searchParams.get("lng"));
      const preferredCountry = preferredCountryFromRequest(request);
      const params = new URLSearchParams({ q: query, format: "jsonv2", addressdetails: "1", limit: "10", layer: "address,poi" });
      if (Number.isFinite(focusLat) && Number.isFinite(focusLng)) {
        const latRadius = 1.2;
        const lngRadius = Math.min(2.4, latRadius / Math.max(0.35, Math.cos(focusLat * Math.PI / 180)));
        params.set("viewbox", `${focusLng - lngRadius},${focusLat + latRadius},${focusLng + lngRadius},${focusLat - latRadius}`);
        params.set("bounded", "0");
      }
      const places = await requestNominatim("/search", params) as NominatimPlace[];
      const orderedPlaces = preferredCountry
        ? [...places.filter((place) => place.address?.country_code?.toLowerCase() === preferredCountry), ...places.filter((place) => place.address?.country_code?.toLowerCase() !== preferredCountry)]
        : places;
      const results = orderedPlaces.flatMap((place) => {
        const lat = Number(place.lat);
        const lng = Number(place.lon);
        if (!place.display_name || !Number.isFinite(lat) || !Number.isFinite(lng)) return [];
        return [{ label: compactLabel(place.display_name), detail: place.display_name, lat, lng, countryCode: place.address?.country_code?.toUpperCase() ?? "" }];
      }).slice(0, 6);
      return NextResponse.json({ results });
    }

    if (mode === "reverse") {
      const lat = Number(request.nextUrl.searchParams.get("lat"));
      const lng = Number(request.nextUrl.searchParams.get("lng"));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
      const params = new URLSearchParams({ lat: String(lat), lon: String(lng), format: "jsonv2", addressdetails: "1", zoom: "14", layer: "address" });
      const place = await requestNominatim("/reverse", params) as NominatimPlace;
      if (!place.display_name) return NextResponse.json({ result: null });
      return NextResponse.json({ result: { label: compactLabel(place.display_name), detail: place.display_name, lat, lng } });
    }

    return NextResponse.json({ error: "Unsupported geocoding mode" }, { status: 400 });
  } catch (error) {
    console.error("Geocoding error", error);
    return NextResponse.json({ error: "Location lookup is temporarily unavailable" }, { status: 502 });
  }
}
