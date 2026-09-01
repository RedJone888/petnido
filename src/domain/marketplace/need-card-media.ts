export type NeedCardPetMedia = {
  petType: string;
  image?: string | null;
};

export function resolveNeedCardPetMedia<T extends NeedCardPetMedia>(
  pets: readonly T[],
) {
  const firstPet = pets[0];
  const petWithImage = pets.find((pet) => Boolean(pet.image?.trim()));

  return {
    firstPet,
    featuredPet: petWithImage ?? firstPet,
    coverImage: petWithImage?.image?.trim() || null,
    fallbackPetType: firstPet?.petType || "OTHER",
  };
}
