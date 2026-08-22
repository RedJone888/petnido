"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

import cn from "@/lib/cn";

export function PasswordField({
  label,
  value,
  onChange,
  hint,
  error,
  showLabel,
  hideLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint: string;
  error?: string;
  showLabel: string;
  hideLabel: string;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-message`}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "w-full rounded-xl border bg-white px-4 py-3 pr-12 outline-none transition focus:ring-2 focus:ring-primary/30",
            error ? "border-red-400" : "border-slate-300",
          )}
        />
        <button
          type="button"
          aria-label={visible ? hideLabel : showLabel}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          {visible ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
        </button>
      </div>
      <p
        id={`${id}-message`}
        role={error ? "alert" : undefined}
        className={cn(
          "text-xs leading-5",
          error ? "font-semibold text-red-600" : "text-slate-500",
        )}
      >
        {error || hint}
      </p>
    </div>
  );
}
