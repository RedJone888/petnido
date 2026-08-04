import { ServiceCategory } from "@prisma/client";

import type { ServiceMode } from "./capacity";

export function fromLegacyServiceCategory(category: ServiceCategory): ServiceMode {
  const mapping: Record<ServiceCategory, ServiceMode> = {
    VISIT: "HOME_VISIT",
    FOSTER: "BOARDING",
    OTHER: "CUSTOM",
  };
  return mapping[category];
}

export function toLegacyServiceCategory(mode: ServiceMode): ServiceCategory {
  const mapping: Record<ServiceMode, ServiceCategory> = {
    HOME_VISIT: ServiceCategory.VISIT,
    BOARDING: ServiceCategory.FOSTER,
    CUSTOM: ServiceCategory.OTHER,
  };
  return mapping[mode];
}
