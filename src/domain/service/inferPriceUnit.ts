import { PriceUnit, ServiceCategory } from "@prisma/client";

export function inferPriceUnitByServiceType(
  serviceType: ServiceCategory,
): PriceUnit {
  switch (serviceType) {
    case ServiceCategory.VISIT:
    case ServiceCategory.OTHER:
      return PriceUnit.VISIT;
    case ServiceCategory.FOSTER:
      return PriceUnit.DAY;
  }
}
