import { router, publicProcedure } from "@/server/trpc/trpc";
import { z } from "zod";
import { getCached, setCached } from "@/server/addressCache";
import { nominatimToUx } from "@/lib/location/nominatim/nominatimToUx";

export const locationRouter = router({
  search: publicProcedure
    .input(
      z.object({
        q: z.string().min(1),
        limit: z.number().default(5),
        countrycodes: z.string().optional(),
        language: z.enum(["ja", "en", "zh"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      const language = input.language ?? "ja";
      const key = `${input.countrycodes ?? "global"}:${language}:${input.q}:${input.limit}`;
      const cached = getCached(key);
      if (cached) {
        return cached;
      }
      const countryParam = input.countrycodes ? `&countrycodes=${encodeURIComponent(input.countrycodes)}` : "";
      const url =
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(input.q)}` +
        countryParam +
        `&format=json` +
        `&accept-language=${language}` +
        `&addressdetails=1` +
        // `&featuretype=city` +
        // `&extratags=1` +
        `&limit=${input.limit}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "PetNido (petcare app)",
        },
      });

      const data = await res.json();
      const result = nominatimToUx(data, input.q, language);
      setCached(key, result, 60_000);
      return result;
    }),
  reverse: publicProcedure
    .input(
      z.object({
        lat: z.number(),
        lon: z.number(),
        language: z.enum(["ja", "en", "zh"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const language = input.language ?? "ja";
        const url =
          `https://nominatim.openstreetmap.org/reverse?` +
          `lat=${input.lat}` +
          `&lon=${input.lon}` +
          `&format=json` +
          `&accept-language=${language}` +
          `&addressdetails=1`;
        const res = await fetch(url, {
          headers: {
            "User-Agent": "PetNido (petcare app)",
          },
        });
        let data = null;
        if (!res.ok) {
          data = null;
        }
        data = await res.json();
        if (!data) return [];
        return nominatimToUx([data], "", language);
      } catch (e) {
        throw new Error("reverse failed");
      }
    }),
  addressSearch: publicProcedure
    .input(
      z.object({
        q: z.string().min(1),
        limit: z.number().max(5).default(5),
      }),
    )
    .query(async ({ input }) => {
      const key = `jp:${input.q}:${input.limit}`;
      const cached = getCached(key);
      if (cached) {
        return cached;
      }
      const url =
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(input.q)}` +
        `&countrycodes=jp` +
        `&format=json` +
        `&addressdetails=1` +
        `&limit=${input.limit}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "petcare-app/1.0 (local)",
        },
      });
      setCached(key, res, 60_000);
      return res.json();
    }),
});
