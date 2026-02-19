import * as React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => {
    const base =
      "flex h-11 w-full rounded-2xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-hover focus-visible:ring-offset-1";
    return <input ref={ref} className={`${base} ${className}`} {...props} />;
  }
);

Input.displayName = "Input";
