"use client";

import type { ElementType } from "react";
import { Plus } from "lucide-react";
import cn from "@/lib/cn";
import { petAvatarPosition } from "@/domain/pet/avatar";
import type { PetProfileType } from "./pet-profile-types";

export type OptionIcon = ElementType<{ className?: string }>;

export function PetSpriteIcon({
  className,
  position,
}: {
  className?: string;
  position: string;
}) {
  return (
    <span
      className={cn(
        "block shrink-0 rounded-full bg-[#fff8e8] bg-no-repeat",
        className,
      )}
      style={{
        backgroundImage: "url('/images/pet-default-avatars-v2.png')",
        backgroundPosition: position,
        backgroundSize: "400% auto",
      }}
    />
  );
}

export const DogIcon = ({ className }: { className?: string }) => (
  <PetSpriteIcon className={className} position={petAvatarPosition("DOG")} />
);
export const CatIcon = ({ className }: { className?: string }) => (
  <PetSpriteIcon className={className} position={petAvatarPosition("CAT")} />
);
export const RabbitIcon = ({ className }: { className?: string }) => (
  <PetSpriteIcon className={className} position={petAvatarPosition("RABBIT")} />
);
export const BirdIcon = ({ className }: { className?: string }) => (
  <PetSpriteIcon className={className} position={petAvatarPosition("BIRD")} />
);
export const OtherIcon = ({ className }: { className?: string }) => (
  <PetSpriteIcon className={className} position={petAvatarPosition("OTHER")} />
);
export const HamsterIcon = ({ className }: { className?: string }) => (
  <PetSpriteIcon className={className} position={petAvatarPosition("HAMSTER")} />
);
export const GuineaPigIcon = ({ className }: { className?: string }) => (
  <PetSpriteIcon className={className} position={petAvatarPosition("GUINEA_PIG")} />
);
export const FerretIcon = ({ className }: { className?: string }) => (
  <PetSpriteIcon className={className} position={petAvatarPosition("FERRET")} />
);
export const TurtleIcon = ({ className }: { className?: string }) => (
  <PetSpriteIcon className={className} position={petAvatarPosition("TURTLE")} />
);
export const ChinchillaIcon = ({ className }: { className?: string }) => (
  <PetSpriteIcon className={className} position={petAvatarPosition("CHINCHILLA")} />
);

export const petTypeIcons: Record<PetProfileType, OptionIcon> = {
  DOG: DogIcon,
  CAT: CatIcon,
  RABBIT: RabbitIcon,
  BIRD: BirdIcon,
  OTHER: OtherIcon,
};

export const otherTypeIcons: Record<string, OptionIcon> = {
  hamster: HamsterIcon,
  "guinea-pig": GuineaPigIcon,
  ferret: FerretIcon,
  turtle: TurtleIcon,
  chinchilla: ChinchillaIcon,
};

export const legacyPetTypeIcons: Record<string, OptionIcon> = {
  CHINCHILLA: ChinchillaIcon,
  GUINEA_PIG: GuineaPigIcon,
  HAMSTER: HamsterIcon,
  TURTLE: TurtleIcon,
  FERRET: FerretIcon,
};

export function PetProfileAddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.08] px-4 py-2 text-sm font-bold text-primary transition hover:border-primary/30 hover:bg-primary/[0.13] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Plus className="mr-2 h-4 w-4" />
      {label}
    </button>
  );
}
