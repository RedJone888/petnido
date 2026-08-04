import { z } from "zod";

const preciseLocationTextPattern = /(?:\d+\s*(?:号|室|階|楼|层|房)|(?:unit|room|floor|apt\.?|apartment)\s*\w+)/i;

export const mapLocationSchema = z
  .object({
    lat: z.number().finite().min(-90).max(90),
    lon: z.number().finite().min(-180).max(180),
    regionLabel: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .refine((value) => !preciseLocationTextPattern.test(value), "PRECISE_LOCATION_TEXT_NOT_ALLOWED")
      .optional(),
    displayPrecision: z.enum(["CITY", "DISTRICT", "NEIGHBORHOOD", "MAP_POINT"]).default("MAP_POINT"),
  })
  .strict();

export type MapLocation = z.infer<typeof mapLocationSchema>;

export const publicMapLocationSchema = z
  .object({
    approximateLat: z.number().finite().min(-90).max(90),
    approximateLon: z.number().finite().min(-180).max(180),
    regionLabel: z.string().trim().min(1).max(120).optional(),
    displayPrecision: z.enum(["CITY", "DISTRICT", "NEIGHBORHOOD"]),
  })
  .strict();

export type PublicMapLocation = z.infer<typeof publicMapLocationSchema>;

export function toPublicMapLocation(location: MapLocation): PublicMapLocation {
  return {
    approximateLat: Number(location.lat.toFixed(2)),
    approximateLon: Number(location.lon.toFixed(2)),
    regionLabel: location.regionLabel,
    displayPrecision: location.displayPrecision === "CITY" ? "CITY" : "NEIGHBORHOOD",
  };
}
