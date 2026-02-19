import { NeedCreateInput, NeedForm, NeedPetForm } from "@/lib/zod/needs";
import { inferAllPetTypeFromText } from "@/domain/pet/inferPetTypes";
import { PetType } from "@prisma/client";
import { OneNeedApi, NeedPetApi } from "./api.types";
import { photoApiToForm } from "../attachment/mapper";
import { format } from "date-fns";
export function needPetApiToForm(np: NeedPetApi): NeedPetForm & { id: string } {
  return {
    id: np.id,
    petCategory: np.petCategory,
    petType: np.petType,
    description: np.description,
    petIds: np.petIds,
    tags: np.tags,
    count: np.count.toString(),
    photos: np.photos.map(photoApiToForm),
  };
}

export function needApiToForm(service: OneNeedApi): NeedForm & { id: string } {
  const {
    ownerId,
    createdAt,
    updatedAt,
    photos,
    needPets,
    startDate,
    endDate,
    customDays,
    customTimes,
    priceAmount,
    totalPrice,
    ...rest
  } = service;

  return {
    ...rest,
    startDate: format(new Date(startDate), "yyyy-MM-dd"),
    endDate: format(new Date(endDate), "yyyy-MM-dd"),
    customDays: customDays?.toString() || null,
    customTimes: customTimes?.toString() || null,
    photos: photos.map(photoApiToForm),
    needPets: needPets.map(needPetApiToForm),
    priceAmount: priceAmount?.toString() || "",
    totalPrice: totalPrice.toString(),
  };
}
export function needFormToApi(values: NeedForm): NeedCreateInput {
  const {
    photos,
    customDays,
    customTimes,
    needPets,
    priceAmount,
    totalPrice,
    ...rest
  } = values;
  const photoIds = photos.map((p) => p.id);
  return {
    photoIds,
    customDays: customDays ? Math.floor(Number(customDays)) : null,
    customTimes: customTimes ? Math.floor(Number(customTimes)) : null,
    needPets: needPets.map((np) => {
      const { petCategory, petType, count, photos, ...rest } = np;
      let realPetCategory: PetType =
        petCategory === null ? "OTHER" : petCategory;
      if (petCategory === "OTHER") {
        realPetCategory = inferAllPetTypeFromText(petType);
      }
      return {
        petCategory: realPetCategory,
        petType,
        count: Math.floor(Number(count)),
        photoIds: photos.map((p) => p.id),
        ...rest,
      };
    }),
    priceAmount: Math.floor(Number(priceAmount)),
    totalPrice: Math.floor(Number(totalPrice)),
    ...rest,
  };
}
