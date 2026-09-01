export const FIXED_NOW = new Date("2030-01-15T00:00:00.000Z");
export const FIXTURE_TIME_ZONE = "Asia/Tokyo";

export const fixtureUsers = {
  owner: { id: "fixture-owner", email: "owner@petnido.example.invalid", role: "OWNER" },
  provider: { id: "fixture-provider", email: "provider@petnido.example.invalid", role: "PROVIDER" },
  dualRole: { id: "fixture-dual", email: "dual@petnido.example.invalid", role: "DUAL" },
  newcomer: { id: "fixture-new", email: "new@petnido.example.invalid", role: "OWNER" },
} as const;

export const fixtureLocations = {
  ownerDefault: {
    lat: 35.68,
    lon: 139.77,
    regionLabel: "Fixture Central area",
    displayPrecision: "MAP_POINT" as const,
  },
  providerDefault: {
    lat: 35.69,
    lon: 139.75,
    regionLabel: "Fixture West area",
    displayPrecision: "MAP_POINT" as const,
  },
} as const;

export const fixturePets = [
  { id: "fixture-pet-cat", ownerId: fixtureUsers.owner.id, name: "Mugi", petType: "CAT" as const },
  { id: "fixture-pet-dog", ownerId: fixtureUsers.owner.id, name: "Pochi", petType: "DOG" as const },
];

export const fixtureNeeds = {
  openHomeVisit: {
    id: "fixture-need-home-open",
    mode: "HOME_VISIT" as const,
    state: "OPEN" as const,
    startsAt: new Date("2030-01-16T00:00:00.000Z"),
    endsAt: new Date("2030-01-20T00:00:00.000Z"),
  },
  expiredBoarding: {
    id: "fixture-need-boarding-expired",
    mode: "BOARDING" as const,
    state: "OPEN" as const,
    startsAt: new Date("2030-01-10T00:00:00.000Z"),
    endsAt: new Date(FIXED_NOW),
  },
  matchedCustom: {
    id: "fixture-need-custom-matched",
    mode: "CUSTOM" as const,
    state: "MATCHED" as const,
    startsAt: new Date("2030-01-16T00:00:00.000Z"),
    endsAt: new Date("2030-01-18T00:00:00.000Z"),
  },
} as const;

export const boardingCapacityFixtures = {
  available: { maxPetCapacity: 4, confirmedPetCount: 1, requestedPetCount: 2 },
  exactlyFull: { maxPetCapacity: 4, confirmedPetCount: 2, requestedPetCount: 2 },
  lastSlotRace: { maxPetCapacity: 4, confirmedPetCount: 3, requests: [1, 1] as const },
} as const;
