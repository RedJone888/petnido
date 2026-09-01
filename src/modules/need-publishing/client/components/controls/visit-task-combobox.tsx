"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { IconType } from "react-icons";
import { PiCaretDown, PiSparkle, PiWarningCircle, PiX } from "react-icons/pi";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/Popover";
import cn from "@/lib/cn";
import { inputClass } from "../../guided-need-flow-shared";

export type VisitSelectOption = {
  value: string;
  label: string;
  icon?: IconType;
};

export function VisitSelect({
  value,
  options,
  placeholder,
  ariaLabel,
  className,
  listClassName,
  side = "bottom",
  onChange,
}: {
  value: string;
  options: VisitSelectOption[];
  placeholder?: string;
  ariaLabel: string;
  className?: string;
  listClassName?: string;
  side?: "top" | "bottom";
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [triggerWidth, setTriggerWidth] = useState<number | null>(null);
  const selected = options.find((option) => option.value === value);
  const SelectedIcon = selected?.icon;

  useEffect(() => {
    const updateWidth = () => {
      if (triggerRef.current) {
        setTriggerWidth(triggerRef.current.getBoundingClientRect().width);
      }
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    if (triggerRef.current) observer.observe(triggerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen && triggerRef.current) {
      triggerRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          ref={triggerRef}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={ariaLabel}
          title={selected?.label}
          className={cn(
            "flex h-11 w-full min-w-0 items-center justify-between rounded-xl border border-slate-300 bg-white px-3 text-left text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-purple-100",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            {SelectedIcon ? (
              <SelectedIcon className="h-4 w-4 shrink-0 text-[#8a5d34]" />
            ) : null}
            <span className="truncate">{selected?.label ?? placeholder}</span>
          </span>
          <PiCaretDown className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side={side}
        avoidCollisions={true}
        style={triggerWidth ? { width: `${triggerWidth}px` } : undefined}
        className={cn(
          "z-[1200] max-w-[calc(100vw-32px)] p-1.5",
          listClassName,
        )}
      >
        <div role="listbox" aria-label={ariaLabel} className="space-y-1">
          {options.map((option) => {
            const OptionIcon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-purple-50",
                  option.value === value &&
                    "bg-purple-50 font-semibold text-primary",
                )}
              >
                {OptionIcon ? (
                  <OptionIcon className="mr-2 h-4 w-4 shrink-0 text-[#8a5d34]" />
                ) : null}
                <span className="whitespace-normal break-words">{option.label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function VisitTaskNameCombobox({
  value,
  customValue,
  customValueKey,
  options,
  ariaLabel,
  placeholder,
  autoFocus = false,
  suggestionsEnabled = true,
  error,
  errorId,
  onChange,
}: {
  value: string;
  customValue: string;
  customValueKey: string;
  options: VisitSelectOption[];
  ariaLabel: string;
  placeholder: string;
  autoFocus?: boolean;
  suggestionsEnabled?: boolean;
  error?: string;
  errorId?: string;
  onChange: (next: { value: string; customValue: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    placeAbove: boolean;
  } | null>(null);

  const selected = options.find((option) => option.value === value);
  const displayValue =
    value === customValueKey ? customValue : (selected?.label ?? "");
  const query = value === customValueKey ? customValue : "";
  const filteredOptions = query.trim()
    ? options.filter((option) =>
        option.label
          .toLocaleLowerCase()
          .includes(query.trim().toLocaleLowerCase()),
      )
    : options;

  useEffect(() => {
    if (!open) return;
    const updateMenuPosition = () => {
      const input = inputRef.current;
      if (!input) return;
      const rect = input.getBoundingClientRect();
      const dialogRect = input
        .closest<HTMLElement>('[role="dialog"]')
        ?.getBoundingClientRect();
      const topBoundary = Math.max(8, (dialogRect?.top ?? 0) + 8);
      const bottomBoundary = Math.min(
        window.innerHeight - 8,
        dialogRect?.bottom ?? window.innerHeight - 8,
      );
      const estimatedHeight = Math.min(
        256,
        Math.max(
          96,
          (filteredOptions.length + (customValue.trim() ? 1 : 0)) * 48 + 12,
        ),
      );
      const spaceAbove = Math.max(0, rect.top - 8 - topBoundary);
      const spaceBelow = Math.max(0, bottomBoundary - rect.bottom - 8);
      const placeAbove = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
      const availableSpace = placeAbove ? spaceAbove : spaceBelow;
      const maxHeight = Math.max(
        48,
        Math.min(256, availableSpace || estimatedHeight),
      );
      setMenuPosition({
        top: placeAbove ? rect.top - 4 : rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 220),
        maxHeight,
        placeAbove,
      });
    };
    updateMenuPosition();
    const closeWhenOutside = (event: PointerEvent) => {
      if ((event.target as HTMLElement).closest?.("[data-visit-task-menu]")) {
        return;
      }
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeWhenOutside);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      document.removeEventListener("pointerdown", closeWhenOutside);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [customValue, filteredOptions.length, open]);

  useEffect(() => {
    if (!suggestionsEnabled) setOpen(false);
  }, [suggestionsEnabled]);

  useEffect(() => {
    if (!autoFocus) return;
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
      setOpen(suggestionsEnabled);
    });
    return () => cancelAnimationFrame(frame);
  }, [autoFocus, suggestionsEnabled]);

  const selectCustom = () => {
    const next = customValue.trim();
    if (!next) return;
    onChange({ value: customValueKey, customValue: next });
    setOpen(false);
  };

  const clearValue = () => {
    onChange({ value: "", customValue: "" });
    setOpen(true);
  };

  return (
    <div ref={containerRef} className="relative min-w-0">
      <input
        ref={inputRef}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-invalid={Boolean(error)}
        aria-describedby={error && errorId ? errorId : undefined}
        value={displayValue}
        placeholder={placeholder}
        onFocus={(event) => {
          event.currentTarget.select();
          event.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest" });
          setOpen(suggestionsEnabled);
        }}
        onClick={(event) => {
          event.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest" });
          setOpen(suggestionsEnabled);
        }}
        onChange={(event) => {
          const next = event.target.value;
          const matching = options.find(
            (option) =>
              option.label.toLocaleLowerCase() ===
              next.trim().toLocaleLowerCase(),
          );
          onChange({
            value: matching?.value ?? customValueKey,
            customValue: matching ? "" : next,
          });
          setOpen(suggestionsEnabled);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && customValue.trim()) {
            event.preventDefault();
            selectCustom();
          }
        }}
        className={cn(
          inputClass,
          "h-10 min-w-0 rounded-lg px-3 pr-9 text-xs font-semibold text-[#35243f] placeholder:font-normal placeholder:text-[#aaa4ae]",
          error &&
            "border-danger-text focus:border-danger-text focus:ring-danger-ring",
        )}
      />
      {displayValue ? (
        <button
          type="button"
          aria-label="Clear task name"
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.stopPropagation();
            clearValue();
          }}
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#9a939f] transition hover:bg-[var(--primary-fixed)] hover:text-[var(--primary)]"
        >
          <PiX size={17} />
        </button>
      ) : null}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="pointer-events-none absolute left-0 top-full z-20 inline-flex items-center gap-1 whitespace-nowrap text-[10px] font-semibold leading-4 text-danger-text"
        >
          <PiWarningCircle className="shrink-0" size={12} />
          {error}
        </p>
      ) : null}
      {open &&
        suggestionsEnabled &&
        menuPosition &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            data-visit-task-menu
            style={{
              position: "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
              maxHeight: menuPosition.maxHeight,
              transform: menuPosition.placeAbove ? "translateY(-100%)" : undefined,
            }}
            className="z-[1300] overflow-y-auto rounded-2xl border border-[#ded9e0] bg-white p-1.5 shadow-[0_18px_35px_-18px_rgba(65,40,84,0.7)]"
          >
            <div role="listbox" aria-label={ariaLabel} className="space-y-1">
              {filteredOptions.map((option) => {
                const OptionIcon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={option.value === value}
                    onClick={() => {
                      onChange({ value: option.value, customValue: "" });
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-purple-50",
                      option.value === value &&
                        "bg-purple-50 font-semibold text-primary",
                    )}
                  >
                    {OptionIcon ? (
                      <OptionIcon className="mr-2 h-4 w-4 shrink-0 text-[#8a5d34]" />
                    ) : null}
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })}
              {customValue.trim() && (
                <button
                  type="button"
                  role="option"
                  aria-selected={value === customValueKey}
                  onClick={selectCustom}
                  className={cn(
                    "flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-purple-50",
                    value === customValueKey &&
                      "bg-purple-50 font-semibold text-primary",
                  )}
                >
                  <PiSparkle className="mr-2 h-4 w-4 shrink-0 text-[#8a5d34]" />
                  <span className="truncate">{customValue.trim()}</span>
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
