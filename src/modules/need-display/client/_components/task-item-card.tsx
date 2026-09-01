"use client";

import { CheckCircle2 } from "lucide-react";
import { PiChatCircleDots, PiPawPrint } from "react-icons/pi";

import type { Lang } from "@/domain/lang/types";
import { messages } from "@/i18n/messages";
import { localizeTaskLabel } from "@/modules/need-publishing/domain/task-catalog";
import cn from "@/lib/cn";
import {
  taskPriorityInfo,
  taskScheduleKindInfo,
} from "../_utils/presentation-formatters";

export function TaskItemCard({
  task,
  lang,
  t,
}: {
  task: {
    category?: string;
    label: string;
    instructions?: string | null;
    priority?: string;
    scheduleKind?: string;
    visitNumbers?: number[];
    pets?: Array<{ name: string | null; petType: string }>;
  };
  lang: Lang;
  t: (typeof messages)[Lang];
}) {
  const priority = taskPriorityInfo(task.priority, lang);
  const schedule = taskScheduleKindInfo(task.scheduleKind, lang);
  const category = task.category ?? "";
  const upperCategory = category.toUpperCase();
  const taskLabel = localizeTaskLabel(task.label, lang, {
    category,
    custom: upperCategory === "CUSTOM" || upperCategory.startsWith("CUSTOM-"),
  });

  return (
    <div className="rounded-xl border border-[#EDE8E1] bg-[#FAF8F5]/90 p-3 sm:p-3.5 transition hover:bg-white hover:shadow-2xs">
      <div className="flex items-start gap-2.5">
        <CheckCircle2 size={16} className="text-[#2D6A4F] shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="font-bold text-sm text-[#2B231D]">
              {taskLabel}
            </span>

            {priority ? (
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px]",
                  priority.className
                )}
              >
                {priority.text}
              </span>
            ) : null}

            {schedule ? (
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px]",
                  schedule.className
                )}
              >
                {schedule.text}
              </span>
            ) : null}

            {task.pets && task.pets.length > 0
              ? task.pets.map((p, pIdx) => {
                  const pName = p.name || t.core.pets[p.petType as keyof typeof t.core.pets] || p.petType;
                  return (
                    <span
                      key={pIdx}
                      className="inline-flex items-center gap-1 rounded-full bg-stone-100 border border-stone-200/90 px-2 py-0.5 text-[10px] font-semibold text-stone-700"
                    >
                      <PiPawPrint className="h-3 w-3 text-stone-500 shrink-0" />
                      <span>{pName}</span>
                    </span>
                  );
                })
              : null}
          </div>

          {task.instructions ? (
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-[#FAF6F0] border border-[#EFE7DC] px-2.5 py-1.5 text-xs text-[#514956]">
              <PiChatCircleDots size={14} className="text-primary shrink-0 mt-0.5" />
              <p className="leading-relaxed whitespace-pre-wrap">{task.instructions}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
