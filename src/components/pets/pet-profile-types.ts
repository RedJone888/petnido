import type { ImageItem } from "@/domain/attachment/type";

export const petProfileTypes = [
  "DOG",
  "CAT",
  "RABBIT",
  "BIRD",
  "OTHER",
] as const;

export type PetProfileType = (typeof petProfileTypes)[number];
export type PetProfileTypeSelection = "" | PetProfileType;

export type PetProfileEditorValue = {
  id: string | null;
  name: string;
  type: PetProfileTypeSelection;
  customType: string;
  breed: string;
  birthDate: string;
  weight: string;
  weightUnit: "kg" | "g";
  sex: "" | "FEMALE" | "MALE" | "UNKNOWN";
  neutered: "" | "YES" | "NO" | "UNKNOWN";
  photos: ImageItem[];
  notes: string;
};

export type PetProfileEditorErrors = {
  name?: string;
  type?: string;
  customType?: string;
  photo?: string;
};

export type PetProfileCardValue = {
  id: string;
  name: string;
  type: string;
  customType?: string | null;
  breed?: string | null;
  birthDate?: Date | string | null;
  weightGrams?: number | null;
  sex?: string | null;
  neutered?: string | null;
  notes?: string | null;
  photoUrl?: string | null;
};

export const emptyPetProfileEditorValue: PetProfileEditorValue = {
  id: null,
  name: "",
  type: "",
  customType: "",
  breed: "",
  birthDate: "",
  weight: "",
  weightUnit: "kg",
  sex: "",
  neutered: "",
  photos: [],
  notes: "",
};
