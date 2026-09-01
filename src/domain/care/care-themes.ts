import type { ElementType } from "react";
import type { IconType } from "react-icons";
import { PiHandHeart, PiHouseLine, PiWarehouse } from "react-icons/pi";

export type CareMode = "HOME_VISIT" | "BOARDING" | "CUSTOM";

/**
 * Standard icons for care request modes.
 */
export const requestModeIcons: Record<string, IconType> = {
  HOME_VISIT: PiHouseLine,
  BOARDING: PiWarehouse,
  CUSTOM: PiHandHeart,
};

/**
 * Standard Tailwind badge background and text classes for care modes.
 */
export const modeBadgeThemes: Record<string, string> = {
  HOME_VISIT: "bg-emerald-600 text-white shadow-emerald-950/20",
  BOARDING: "bg-amber-600 text-white shadow-amber-950/20",
  CUSTOM: "bg-violet-600 text-white shadow-violet-950/20",
};

/**
 * Standard hex color map for maps and SVG pins.
 */
export const modeColorMap: Record<string, string> = {
  HOME_VISIT: "#059669", // Emerald 600
  BOARDING: "#d97706",   // Amber 600
  CUSTOM: "#7c3aed",     // Violet 600
};
