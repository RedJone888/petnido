"use client";

import { PiCheck } from "react-icons/pi";
import { useLanguage } from "@/components/providers/language-provider";
import { useNeedPublishingMessages } from "@/modules/need-publishing/client";
import { CARE_TYPES, CARE_TYPE_ICONS } from "@/domain/care/care-icons";
import type { CareType } from "@/domain/publishing/legacy-need-draft-v3";
import cn from "@/lib/cn";

export function StepCareType({
  value,
  onChange,
}: {
  value: CareType | null;
  onChange: (value: CareType) => void;
}) {
  const { t } = useLanguage();
  const needMessages = useNeedPublishingMessages();
  const copy = needMessages.needPublishing;

  return (
    <div className="space-y-3 px-0.5 pb-0.5 md:max-w-[calc(100%_-_215px)] lg:max-w-[calc(100%_-_225px)]">
      {CARE_TYPES.map((type) => {
        const localized = copy.careTypes[type];
        const Icon = CARE_TYPE_ICONS[type];
        const selected = value === type;

        return (
          <button
            type="button"
            key={type}
            onClick={() => onChange(type)}
            className={cn(
              "flex w-full items-center gap-4 rounded-[16px] border p-4 text-left transition md:p-5",
              selected
                ? "border-[var(--primary)] bg-[var(--primary-subtle)] ring-1 ring-[var(--primary)]"
                : "border-[#ded9e0] bg-white hover:border-[var(--primary-border)]",
            )}
          >
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                selected
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[#f4f1f6] text-[var(--primary)]",
              )}
            >
              <Icon size={22} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-bold">
                {localized.title}
              </span>
              <span className="mt-1 block text-sm leading-5 text-[#706a78]">
                {localized.description}
              </span>
            </span>
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                selected
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : "border-[#bcb5bf]",
              )}
            >
              {selected ? <PiCheck size={14} /> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Compatibility export
export const GuidedNeedCareTypeScreen = StepCareType;
