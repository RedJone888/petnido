import { PriceRuleForm, ServiceForm } from "@/lib/zod/services";
import { PriceRuleApi, ServiceApi } from "@/domain/service/api.types";
import { ServiceCreateInput } from "@/lib/zod/services";
import { ServicePhotoKind } from "@prisma/client";
import { photoApiToForm } from "../attachment/mapper";
export function serviceApiToForm(service: ServiceApi): ServiceForm {
  const {
    id,
    createdAt,
    updatedAt,
    photos,
    priceRules,
    petTypes,
    serviceProfileId,
    ...rest
  } = service;

  return {
    ...rest,
    photos: photos.map(photoApiToForm),
    priceRules: priceRules.map(priceRuleApiToForm),
  };
}
export function serviceFormToApi(values: ServiceForm): ServiceCreateInput {
  const { photos, priceRules, ...rest } = values;
  const experiencePhotoIds = photos
    .filter((p) => p.serviceKind === ServicePhotoKind.EXPERIENCE)
    .map((p) => p.id);
  const homePhotoIds = photos
    .filter((p) => p.serviceKind === ServicePhotoKind.HOME)
    .map((p) => p.id);
  return {
    ...rest,
    experiencePhotoIds,
    homePhotoIds,
    priceRules: priceRules.map((r) => ({
      groupLabel: r.groupLabel,
      price: Math.floor(Number(r.price)),
    })),
    description: rest.description?.trim() || null,
    customType: rest.customType?.trim() || null,
  };
}

export function priceRuleApiToForm(r: PriceRuleApi): PriceRuleForm {
  return {
    // id: r.id,
    // tempId: crypto.randomUUID(),
    groupLabel: r.groupLabel,
    price: r.price.toString(),
  };
}
