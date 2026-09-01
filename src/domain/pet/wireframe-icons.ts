import type { ElementType } from "react";
import {
  Bird,
  Cat,
  Dog,
  PawPrint,
  Rabbit,
  Rat,
} from "lucide-react";

export const petVectorTypes = [
  "DOG",
  "CAT",
  "RABBIT",
  "BIRD",
  "CHINCHILLA",
  "GUINEA_PIG",
  "HAMSTER",
  "OTHER",
] as const;

export type PetVectorType = (typeof petVectorTypes)[number];

/**
 * Standard Lucide wireframe icons for pet species representation.
 */
export const petVectorIcons: Record<PetVectorType, ElementType> = {
  DOG: Dog,
  CAT: Cat,
  RABBIT: Rabbit,
  BIRD: Bird,
  CHINCHILLA: Rat,
  GUINEA_PIG: Rat,
  HAMSTER: Rat,
  OTHER: PawPrint,
};

export function getPetVectorIcon(type: string | null | undefined): ElementType {
  const norm = (type || "").trim().toUpperCase().replace(/-/g, "_") as PetVectorType;
  return petVectorIcons[norm] ?? PawPrint;
}
