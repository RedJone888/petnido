"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

type PopoverContentProps = React.ComponentPropsWithoutRef<
  typeof PopoverPrimitive.Content
> & {
  className?: string;
};

export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(({ className = "", side = "bottom", align = "start", ...props }, ref) => {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        side={side}
        align={align}
        sideOffset={8}
        className={`rounded-2xl border border-neutral-200 bg-white shadow-lg p-4 text-sm text-neutral-900 ${className}`}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});

PopoverContent.displayName = "PopoverContent";
