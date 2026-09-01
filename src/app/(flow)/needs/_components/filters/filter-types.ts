import type { ElementType } from "react";
import type { Mode } from "../need-card";
import { requestModeIcons } from "@/domain/care/care-themes";
import {
  petVectorIcons,
  petVectorTypes,
} from "@/domain/pet/wireframe-icons";

export type FilterOption = { value: string; label: string; icon: ElementType };

export const modes: Mode[] = ["HOME_VISIT", "BOARDING", "CUSTOM"];

export const petTypes = petVectorTypes;

export const modeIcons: Record<Mode, ElementType> = requestModeIcons;

export const petIcons = petVectorIcons;
