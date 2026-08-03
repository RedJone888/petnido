import { clsx, type ClassValue } from "clsx";
import { twMerge, extendTailwindMerge } from "tailwind-merge";

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "headline-md-mobile",
            "headline-md",
            "headline-lg",
            "headline-xl",
            "label-md",
            "body-md",
            "body-lg",
          ],
        },
      ],
      "text-color": [
        {
          text: [
            "surface-variant",
            "on-surface-variant",
            "on-background",
            "on-primary",
            "on-primary-fixed-variant",
            "on-secondary-container",
          ],
        },
      ],
    },
  },
});
export default function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}
