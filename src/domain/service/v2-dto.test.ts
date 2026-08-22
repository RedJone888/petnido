import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import type { OwnerServiceV2 } from "./v2-dto";
import { toPublicServiceV2Dto, toServiceV2EditPayload } from "./v2-dto";

function serviceFixture(mode: "HOME_VISIT" | "BOARDING" | "CUSTOM"): OwnerServiceV2 {
  const boarding = mode === "BOARDING";
  return {
    id: "service-1",
    idempotencyKey: "private-key",
    legacyServiceId: null,
    serviceProfileId: "private-profile",
    mode,
    state: "ACTIVE",
    title: "Care service",
    description: "Public summary",
    timeZone: "Asia/Tokyo",
    locationSnapshotId: "private-location",
    currency: "JPY",
    serviceRadiusMeters: mode === "HOME_VISIT" ? 5000 : mode === "CUSTOM" ? null : null,
    maxPetCapacity: boarding ? 3 : null,
    archivedAt: null,
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-02T00:00:00.000Z"),
    locationSnapshot: {
      id: "private-location",
      sourceLocationId: "private-saved-location",
      lat: new Prisma.Decimal("35.681236"),
      lon: new Prisma.Decimal("139.767125"),
      regionLabel: "Chiyoda, Tokyo",
      displayPrecision: "DISTRICT",
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
    },
    boardingDetail: boarding
      ? {
          id: "boarding-1",
          serviceId: "service-1",
          environmentDescription: "Secure room",
          residentPetNotes: "One cat",
          suppliedItems: ["Bowls", "Beds"],
        }
      : null,
    availabilityRules: [
      {
        id: "availability-1",
        serviceId: "service-1",
        kind: "WEEKLY",
        weekdays: [1, 2, 3],
        startsOn: null,
        endsOn: null,
        includesHolidays: false,
      },
    ],
    availabilityExceptions: [
      {
        id: "exception-1",
        serviceId: "service-1",
        date: new Date("2026-08-12T00:00:00.000Z"),
        available: false,
        note: "Private schedule note",
      },
    ],
    petPolicies: [
      {
        id: "policy-1",
        serviceId: "service-1",
        petType: "CAT",
        size: "ANY",
        ageBand: "ADULT",
        accepted: true,
        notes: null,
      },
    ],
    offerings: [
      {
        id: "offering-1",
        serviceId: "service-1",
        category: "FEEDING",
        label: "Feeding",
        description: null,
      },
    ],
    priceRules: [
      {
        id: "price-1",
        serviceId: "service-1",
        label: "Standard",
        unit: boarding ? "DAY" : "VISIT",
        amountMinor: 3000n,
      },
    ],
    discounts: [
      {
        id: "discount-1",
        serviceId: "service-1",
        label: "Long care",
        kind: "PERCENT",
        value: 10,
        condition: null,
      },
    ],
    attachments: [
      {
        serviceId: "service-1",
        attachmentId: "photo-1",
        purpose: boarding ? "ENVIRONMENT" : "EXPERIENCE",
        order: 0,
        attachment: { id: "photo-1", url: "/photo.jpg", signature: "private-signature" },
      },
    ],
  };
}

describe("Service V2 DTOs", () => {
  it("round-trips all boarding fields into an editable draft", () => {
    const payload = toServiceV2EditPayload(serviceFixture("BOARDING"));
    expect(payload).toMatchObject({
      title: "Care service",
      location: { sourceLocationId: "private-saved-location" },
      availabilityRules: [{ kind: "WEEKLY", weekdays: [1, 2, 3] }],
      availabilityExceptions: [{ date: "2026-08-12", available: false }],
      petPolicies: [{ petType: "CAT", size: "ANY", ageBand: "ADULT" }],
      offerings: [{ category: "FEEDING", label: "Feeding" }],
      priceRules: [{ amountMinor: 3000 }],
      discounts: [{ value: 10 }],
      attachmentIds: ["photo-1"],
      boarding: {
        maxPetCapacity: 3,
        environmentDescription: "Secure room",
        residentPetNotes: "One cat",
        suppliedItems: ["Bowls", "Beds"],
      },
    });
  });

  it("keeps exact coordinates and private identifiers out of the public DTO", () => {
    const dto = toPublicServiceV2Dto(serviceFixture("HOME_VISIT"));
    const serialized = JSON.stringify(dto);
    expect(dto).toMatchObject({
      location: { regionLabel: "Chiyoda, Tokyo", displayPrecision: "DISTRICT" },
      maxPetCapacity: null,
      serviceRadiusMeters: 5000,
      attachments: [{ id: "photo-1", url: "/photo.jpg", purpose: "EXPERIENCE" }],
    });
    expect(serialized).not.toContain("35.681236");
    expect(serialized).not.toContain("139.767125");
    expect(serialized).not.toContain("private-key");
    expect(serialized).not.toContain("private-profile");
    expect(serialized).not.toContain("private-saved-location");
    expect(serialized).not.toContain("private-signature");
    expect(serialized).not.toContain("Private schedule note");
  });

  it("exposes boarding capacity only for boarding public records", () => {
    expect(toPublicServiceV2Dto(serviceFixture("BOARDING")).maxPetCapacity).toBe(3);
    expect(toPublicServiceV2Dto(serviceFixture("CUSTOM")).maxPetCapacity).toBeNull();
  });
});
