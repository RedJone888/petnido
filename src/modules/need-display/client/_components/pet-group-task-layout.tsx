"use client";

import { AppImage } from "@/components/ui/app-image";
import type { Lang } from "@/domain/lang/types";
import { messages } from "@/i18n/messages";
import { localizeTaskLabel } from "@/modules/need-publishing/domain/task-catalog";
import cn from "@/lib/cn";
import { getNeedDisplayMessages } from "../../i18n";
import { petAvatarPosition } from "@/domain/pet/avatar";
import {
  groupPetsAndTasks,
  taskPriorityInfo,
  taskScheduleKindInfo,
} from "../_utils/presentation-formatters";

export function PetGroupTaskDirectLayout({
  group,
  lang,
  t,
  mode,
  sequenceByTask,
}: {
  group: ReturnType<typeof groupPetsAndTasks>[number];
  lang: Lang;
  t: (typeof messages)[Lang];
  mode?: string;
  sequenceByTask?: ReadonlyMap<object, number>;
}) {
  const displayCopy = getNeedDisplayMessages(lang);

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-stretch">
        <div className="flex items-center border-b border-[#EDE8E1] p-3 sm:w-[180px] sm:shrink-0 sm:border-b-0 sm:border-r">
          <div className="flex w-full flex-wrap gap-2.5 sm:max-w-[156px]">
            {group.pets.map((pet, petIndex) => {
              const petName = pet.name || `${group.petTypeLabel} #${petIndex + 1}`;
              return (
                <div key={`${petName}-${petIndex}`} className="flex w-12 max-w-[48px] flex-col items-center gap-1 text-center">
                  <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-200 bg-[#FFF8E8] shrink-0">
                    {pet.image ? (
                      <AppImage src={pet.image} alt={petName} width={36} height={36} className="h-full w-full object-cover" />
                    ) : (
                      <span
                        aria-label={petName}
                        role="img"
                        className="block h-full w-full bg-no-repeat"
                        style={{
                          backgroundImage: "url('/images/pet-default-avatars-v2.png')",
                          backgroundPosition: petAvatarPosition(pet.petType),
                          backgroundSize: "400% auto",
                        }}
                      />
                    )}
                  </div>
                  <span className="w-full truncate text-[11px] font-bold text-[#2B231D]" title={petName}>{petName}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="min-w-0 flex-1 flex flex-col justify-center divide-y divide-[#EDE8E1]">
          {group.tasks.map((task, idx) => {
            const sequence = sequenceByTask?.get(task as object) ?? idx + 1;
            const isBoarding = mode === "BOARDING";
            const schedule = isBoarding
              ? taskScheduleKindInfo(task.scheduleKind, lang, mode)
              : null;
            const priority = !isBoarding && task.priority
              ? taskPriorityInfo(task.priority, lang)
              : null;

            return (
              <div
                key={`${task.category}-${task.label}-${idx}`}
                className="flex min-w-0 flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-1.5 px-4 py-3 text-xs"
              >
                <div className="flex min-w-0 max-w-full shrink-0 items-center gap-2">
                  <span className="w-5 shrink-0 text-center font-bold text-primary">{sequence}</span>
                  <span className="min-w-0 max-w-56 whitespace-normal break-words font-bold leading-5 text-[#2B231D] [overflow-wrap:anywhere]">
                    {localizeTaskLabel(task.label, lang, { category: task.category, custom: task.category.toUpperCase().startsWith("CUSTOM") })}
                  </span>
                  {schedule ? (
                    <span className={cn("inline-flex shrink-0 rounded-full border px-2 py-0.5 font-semibold text-[11px]", schedule.className)}>
                      {schedule.text}
                    </span>
                  ) : priority ? (
                    <span className={cn("inline-flex shrink-0 rounded-full border px-2 py-0.5 font-semibold text-[11px]", priority.className)}>
                      {priority.text}
                    </span>
                  ) : null}
                </div>
                <span className="min-w-0 flex-1 whitespace-pre-wrap break-words leading-5 text-[#514956] [overflow-wrap:anywhere]">
                  {task.instructions || displayCopy.noNotes}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PetGroupTaskTable({
  groups,
  lang,
  t,
  mode,
}: {
  groups: ReturnType<typeof groupPetsAndTasks>;
  lang: Lang;
  t: (typeof messages)[Lang];
  mode?: string;
}) {
  const displayCopy = getNeedDisplayMessages(lang);

  return (
    <div className="w-full overflow-x-auto bg-white">
      <div className="min-w-[620px]">
        <div className="flex items-stretch border-b border-[#EDE8E1] bg-[#FAF6F0] text-xs font-bold text-[#706A60]">
          <div className="w-[180px] shrink-0 border-r border-[#EDE8E1] p-3">
            {displayCopy.applicablePets}
          </div>
          <div className="min-w-0 flex-1 p-3">{displayCopy.careTasks}</div>
        </div>
        <div className="divide-y divide-[#EDE8E1]">
          {groups.map((group, groupIndex) => (
            <PetGroupTaskDirectLayout
              key={`${group.key}-${groupIndex}`}
              group={group}
              lang={lang}
              t={t}
              mode={mode}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
