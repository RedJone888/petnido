export type ServiceMode = "HOME_VISIT" | "BOARDING" | "CUSTOM";

export function assertBoardingCapacity(input: {
  serviceMode: ServiceMode;
  maxPetCapacity: number | null;
  confirmedPetCount: number;
  requestedPetCount: number;
}): void {
  if (input.serviceMode !== "BOARDING") return;

  if (input.maxPetCapacity === null || input.maxPetCapacity < 1) {
    throw new Error("BOARDING_CAPACITY_NOT_CONFIGURED");
  }
  if (input.requestedPetCount < 1) throw new Error("INVALID_PET_COUNT");
  if (input.confirmedPetCount + input.requestedPetCount > input.maxPetCapacity) {
    throw new Error("BOARDING_CAPACITY_EXCEEDED");
  }
}
