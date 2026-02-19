import {
  AvailabilityRangeType,
  AvailabilityWeekPattern,
  Currency,
  ServiceCategory,
} from "@prisma/client";
import type { BaseLocation } from "@/lib/zod/serviceProfile";
import { ServiceForm } from "@/lib/zod/services";
import { DEFAULT_PRICE_RULE } from "@/domain/service/constant";
import { inferPriceUnitByServiceType } from "@/domain/service/inferPriceUnit";
export function createEmptyService(baseLocation: BaseLocation): ServiceForm {
  return {
    serviceType: ServiceCategory.VISIT,
    customType: null,
    description: null,
    isActive: true,
    areaRaw: baseLocation.baseAreaRaw ?? "",
    areaLat: baseLocation.baseLat ?? 0,
    areaLon: baseLocation.baseLon ?? 0,
    currency: baseLocation.baseCurrency ?? Currency.JPY,
    photos: [],
    availabilityRangeType: AvailabilityRangeType.LONG_TERM,
    availabilityWeekPattern: AvailabilityWeekPattern.EVERYDAY,
    includeHolidays: false,
    availableFrom: null,
    availableTo: null,
    priceUnit: inferPriceUnitByServiceType(ServiceCategory.VISIT),
    priceRules: [DEFAULT_PRICE_RULE()],
  };
}
