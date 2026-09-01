import { describe, expect, it } from "vitest";

import { publicProviderFromServices, serviceAvailableOn } from "./service-public-dto";
import { toPublicServiceV2MarketplaceDto, type PublicServiceDto, type PublicServiceV2Source } from "./service-public-dto";

const service: PublicServiceDto = {
  publicId: "v2:service-1",
  source: "V2" as const,
  mode: "BOARDING" as const,
  title: "Boarding",
  description: null,
  timeZone: "Asia/Tokyo",
  currency: "JPY" as const,
  serviceRadiusMeters: null,
  maxPetCapacity: 3,
  location: { label: "Tokyo Station, Marunouchi, Chiyoda, Tokyo, Japan", regionLabel: "Tokyo", displayPrecision: "DISTRICT", distanceMeters: null },
  availabilityRules: [{ kind: "WEEKLY" as const, weekdays: [1, 2, 3, 4, 5], startsOn: null, endsOn: null, includesHolidays: false }],
  availabilityExceptions: [{ date: "2026-08-04", available: false }],
  petPolicies: [{ petType: "CAT", size: "ANY", ageBand: "ANY", accepted: true, notes: null }],
  offerings: [],
  priceRules: [{ label: "Day", unit: "DAY" as const, amountMinor: 4000 }],
  discounts: [],
  boardingEnvironment: null,
  attachments: [],
  provider: { publicId: "provider-1", nickname: "Mika", image: null, memberSince: new Date(), introduction: null, monthsExperience: 24, rating: 4.8, reviewCount: 10 },
  confirmedBookings: { status: "AVAILABLE_BY_DATE" as const, count: null, date: null },
  createdAt: new Date(),
};

describe("public services and providers", () => {
  it("lets explicit date exceptions override weekly availability", () => {
    expect(serviceAvailableOn(service, "2026-08-03")).toBe(true);
    expect(serviceAvailableOn(service, "2026-08-04")).toBe(false);
    expect(serviceAvailableOn(service, "2026-08-09")).toBe(false);
  });

  it("derives one provider summary from real public services", () => {
    expect(publicProviderFromServices([service])).toMatchObject({
      publicId: "provider-1",
      serviceCount: 1,
      modes: ["BOARDING"],
      petTypes: ["CAT"],
      minimumPrice: { currency: "JPY", amountMinor: 4000 },
    });
  });

  it("does not fabricate confirmed booking counts before Booking V2 exists", () => {
    expect(service.confirmedBookings).toEqual({ status: "AVAILABLE_BY_DATE", count: null, date: null });
  });

  it("keeps service coordinates, profile defaults and attachment internals private", () => {
    const source = {
      id: "service-1",
      idempotencyKey: "private-idempotency",
      serviceProfileId: "private-profile-id",
      mode: "HOME_VISIT",
      state: "ACTIVE",
      title: "Home visits",
      description: null,
      timeZone: "Asia/Tokyo",
      locationSnapshotId: "private-location-id",
      currency: "JPY",
      serviceRadiusMeters: 5000,
      maxPetCapacity: null,
      archivedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      serviceProfile: {
        id: "private-profile-id",
        introduction: "Carer",
        monthsExperience: 12,
        rating: 0,
        reviewCount: 0,
        user: { id: "provider-1", name: "Mika", image: null, createdAt: new Date() },
      },
      locationSnapshot: {
        id: "private-location-id",
        sourceLocationId: "private-default-location",
        lat: 35.681236,
        lon: 139.767125,
        label: "Tokyo Station, Marunouchi, Chiyoda, Tokyo, Japan",
        regionLabel: "Tokyo",
        displayPrecision: "DISTRICT",
        createdAt: new Date(),
      },
      boardingDetail: null,
      availabilityRules: [{ id: "rule-1", serviceId: "service-1", kind: "WEEKLY", weekdays: [1], startsOn: null, endsOn: null, includesHolidays: false }],
      availabilityExceptions: [],
      petPolicies: [{ id: "pet-1", serviceId: "service-1", petType: "CAT", size: "ANY", ageBand: "ANY", accepted: true, notes: null }],
      offerings: [{ id: "offer-1", serviceId: "service-1", category: "FEEDING", label: "Feeding", description: null }],
      priceRules: [{ id: "price-1", serviceId: "service-1", label: "Visit", unit: "VISIT", amountMinor: 3000n }],
      discounts: [],
      attachments: [{ serviceId: "service-1", attachmentId: "photo-1", purpose: "EXPERIENCE", order: 0, attachment: { id: "photo-1", url: "/photo.jpg" } }],
    } as unknown as PublicServiceV2Source;
    const dto = toPublicServiceV2MarketplaceDto(source, 900);
    expect(dto.location).toEqual({ label: "Tokyo Station, Marunouchi, Chiyoda, Tokyo, Japan", regionLabel: "Tokyo", displayPrecision: "DISTRICT", distanceMeters: 900 });
    const serialized = JSON.stringify(dto);
    for (const value of ["35.681236", "139.767125", "private-idempotency", "private-profile-id", "private-location-id", "private-default-location", "sourceLocationId", "signature"]) {
      expect(serialized).not.toContain(value);
    }
  });
});
