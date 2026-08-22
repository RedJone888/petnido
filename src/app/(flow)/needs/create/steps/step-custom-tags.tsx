"use client";

import { useState } from "react";
import { PiCheck, PiPlus } from "react-icons/pi";
import { useLanguage } from "@/components/providers/language-provider";
import cn from "@/lib/cn";
import { ChoiceRow, inputClass, toggleValue } from "../guided-need-flow-shared";

export function TagPicker({
  options,
  value,
  onChange,
  placeholder,
  compactInline = false,
}: {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  compactInline?: boolean;
}) {
  const { t } = useLanguage();
  const copy = t.core.needPublishingEnvironment;
  const [custom, setCustom] = useState("");
  const customItems = value.filter((item) => !options.includes(item));
  const add = () => {
    const item = custom.trim();
    if (!item) return;
    onChange([...value, item]);
    setCustom("");
  };
  if (compactInline)
    return (
      <div className="flex flex-wrap items-center gap-2">
        {[...options, ...customItems].map((item) => {
          const active = value.includes(item);
          return (
            <button
              type="button"
              key={item}
              onClick={() => onChange(toggleValue(value, item))}
              className={cn(
                "inline-flex min-h-11 w-auto items-center gap-2 rounded-xl border px-3 text-left text-sm font-bold transition",
                active
                  ? "border-[var(--primary-border-strong)] bg-[var(--primary-subtle)] text-[var(--primary-strong)]"
                  : "border-[#ded9e0] bg-white text-[#706a78] hover:border-[var(--primary-border)]",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                  active
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                    : "border-[#bcb5bf]",
                )}
              >
                {active && <PiCheck size={12} />}
              </span>
              <span>{item}</span>
            </button>
          );
        })}
        <span className="inline-flex shrink-0 items-center gap-2">
          <input
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && add()}
            className={cn(inputClass, "h-11 w-44 sm:w-52")}
            placeholder={placeholder}
          />
          <button
            type="button"
            aria-label={copy.addItem}
            onClick={add}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white"
          >
            <PiPlus />
          </button>
        </span>
      </div>
    );
  return (
    <div>
      <div className="space-y-2">
        {[...options, ...customItems].map((item) => (
          <ChoiceRow
            key={item}
            label={item}
            active={value.includes(item)}
            onClick={() => onChange(toggleValue(value, item))}
            checkbox
          />
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <input
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && add()}
          className={inputClass}
          placeholder={placeholder}
        />
        <button
          type="button"
          aria-label={copy.addItem}
          onClick={add}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white"
        >
          <PiPlus />
        </button>
      </div>
    </div>
  );
}

// Compatibility export
export const GuidedNeedCustomTagsStep = TagPicker;
export const StepCustomTags = TagPicker;
