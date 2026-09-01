"use client";

import { useEffect, useState, type RefObject } from "react";

type DropdownPlacement = "top" | "bottom";

export function useAdaptiveDropdownPlacement(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  preferredHeight = 320,
) {
  const [placement, setPlacement] =
    useState<DropdownPlacement>("bottom");
  const [maxHeight, setMaxHeight] = useState(preferredHeight);

  useEffect(() => {
    if (!open) return;

    const updatePlacement = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const gap = 8;
      const viewportPadding = 12;
      const spaceBelow = Math.max(
        0,
        viewportHeight - rect.bottom - gap - viewportPadding,
      );
      const spaceAbove = Math.max(0, rect.top - gap - viewportPadding);
      const nextPlacement =
        spaceBelow < Math.min(preferredHeight, 240) && spaceAbove > spaceBelow
          ? "top"
          : "bottom";
      const availableSpace =
        nextPlacement === "top" ? spaceAbove : spaceBelow;
      setPlacement(nextPlacement);
      setMaxHeight(Math.max(120, Math.min(preferredHeight, availableSpace)));
    };

    updatePlacement();
    const frame = window.requestAnimationFrame(updatePlacement);
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [anchorRef, open, preferredHeight]);

  return { placement, maxHeight };
}
