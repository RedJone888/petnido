"use client";

import { useEffect, useRef, useState } from "react";
import type { IconType } from "react-icons";
import {
  PiCaretDown,
  PiCaretUp,
  PiCheck,
  PiCopy,
  PiPencilSimple,
  PiPlus,
  PiSparkle,
  PiTrash,
  PiWarningCircle,
} from "react-icons/pi";
import { useLanguage } from "@/components/providers/language-provider";
import { ModalShell } from "@/components/ui/modal-shell";
import type {
  BoardingRoutine,
  BoardingScheduleType,
  BoardingTaskConfig,
  PetDraft,
} from "@/domain/publishing/legacy-need-draft-v3";
import { localizeOtherPetType } from "@/domain/pet/profile-options";
import cn from "@/lib/cn";
import {
  mergeIdenticalBoardingTaskItems,
  type BoardingDisplayTaskItem,
} from "../boarding-task-grouping";
import { copyBoardingTasksToPetGroup } from "../boarding-task-copy";
import {
  buildPetCareGroups,
  Field,
  findScrollContainer,
  inputClass,
  petDisplayType,
  petTypes,
  PetDraftAvatar,
  textareaClass,
} from "../guided-need-flow-shared";
import {
  VisitSelect,
  VisitTaskNameCombobox,
} from "../components/controls/visit-task-combobox";

const customBoardingTaskId = "__custom-boarding-task__";

type BoardingTaskModalRow = {
  id: string;
  templateId: string;
  customLabel: string;
  scheduleType: BoardingScheduleType;
  notes: string;
  priority: BoardingRoutine["priority"];
  source?: { templateId: string; routineId: string };
};

type BoardingTaskModalDraft = {
  petGroupKey: string;
  petIds: string[];
  rows: BoardingTaskModalRow[];
  sourceItems: Array<{ templateId: string; routineId: string }>;
  orderSlots: number[];
};

export function StepBoardingTasks({
  options,
  pets,
  value,
  onChange,
  notes,
  onNotesChange,
  showValidation,
}: {
  options: Array<{ id: string; label: string; icon: IconType }>;
  pets: PetDraft[];
  value: BoardingTaskConfig[];
  onChange: (value: BoardingTaskConfig[]) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  showValidation: boolean;
}) {
  const { lang, t } = useLanguage();
  const copy = t.core.needPublishingBoardingForm;
  const localizedPetDisplayType = (pet: PetDraft) => {
    const normalizedType = pet.type.trim().toUpperCase();
    if (normalizedType !== "OTHER") {
      return (
        t.settings.pets.typeLabels[
          normalizedType as keyof typeof t.settings.pets.typeLabels
        ] ?? petDisplayType(pet)
      );
    }
    const customType = pet.otherType.trim();
    return customType
      ? localizeOtherPetType(customType, lang)
      : t.settings.pets.typeLabels.OTHER;
  };
  const petCareGroups = buildPetCareGroups(pets, localizedPetDisplayType);
  const taskFormCopy = t.core.needPublishingTaskForm;
  const groupCopy = {
    tasks: taskFormCopy.tasksCount,
    task: taskFormCopy.task,
    noTasks: taskFormCopy.noTasksYet,
    copyFrom: taskFormCopy.copyFrom,
    copyTitle: taskFormCopy.copyTitle,
    copyDetail: taskFormCopy.copyDetail,
    taskHelp: taskFormCopy.taskHelp,
    noCopySource: taskFormCopy.noCopySource,
    petGroupColumn: taskFormCopy.petGroupColumn,
    taskColumn: taskFormCopy.taskColumn,
    notesColumn: taskFormCopy.notesColumn,
    actionsColumn: taskFormCopy.actionsColumn,
    daily: taskFormCopy.daily,
    regularly: taskFormCopy.regularly,
    once: taskFormCopy.once,
    asNeeded: taskFormCopy.asNeeded,
    intro: taskFormCopy.intro,
    selectAll: taskFormCopy.selectAll,
    deselectAll: taskFormCopy.deselectAll,
    taskName: taskFormCopy.taskName,
    frequency: taskFormCopy.frequency,
    notes: taskFormCopy.notes,
    notesPlaceholder: taskFormCopy.notesPlaceholder,
    taskNameRequired: taskFormCopy.taskNameRequired,
    duplicateTaskName: taskFormCopy.duplicateTaskName,
    moveUp: taskFormCopy.moveUp,
    moveDown: taskFormCopy.moveDown,
  };
  const [taskModal, setTaskModal] = useState<BoardingTaskModalDraft | null>(
    null,
  );
  const [taskModalError, setTaskModalError] = useState("");
  const [taskRowErrors, setTaskRowErrors] = useState<Record<string, string>>(
    {},
  );
  const [copyTargetGroupKey, setCopyTargetGroupKey] = useState<string | null>(
    null,
  );
  const overlayAnchorRef = useRef<HTMLDivElement | null>(null);
  const overlayPanelRef = useRef<HTMLDivElement | null>(null);
  const overlayOpen = Boolean(taskModal);
  const localizedOptions = options.map((option) => {
    const baseId = option.id.replace(/^boarding-/, "");
    const label =
      t.core.needPublishing.taskLabels[
        baseId as keyof typeof t.core.needPublishing.taskLabels
      ] ?? option.label;
    return { ...option, label };
  });
  const nextOrder =
    Math.max(
      -1,
      ...value.flatMap((config) =>
        config.routines.map((routine) => routine.order),
      ),
    ) + 1;
  const taskModalGroup = petCareGroups.find(
    (group) => group.key === taskModal?.petGroupKey,
  );
  const createModalRow = (): BoardingTaskModalRow => ({
    id: crypto.randomUUID(),
    templateId: "",
    customLabel: "",
    scheduleType: "daily",
    notes: "",
    priority: "must",
  });
  const [focusRowId, setFocusRowId] = useState<string | null>(null);
  const taskTableRef = useRef<HTMLDivElement | null>(null);

  const addTaskRow = () => {
    const id = crypto.randomUUID();
    setTaskModal((current) =>
      current
        ? {
            ...current,
            rows: [
              ...current.rows,
              {
                id,
                templateId: "",
                customLabel: "",
                scheduleType: "daily",
                notes: "",
                priority: "must",
              },
            ],
          }
        : current,
    );
    setFocusRowId(id);
  };

  useEffect(() => {
    if (!focusRowId || !taskModal) return;
    const frame = requestAnimationFrame(() => {
      taskTableRef.current?.scrollTo({
        top: taskTableRef.current.scrollHeight,
        behavior: "smooth",
      });
      requestAnimationFrame(() => setFocusRowId(null));
    });
    return () => cancelAnimationFrame(frame);
  }, [focusRowId, taskModal]);

  const closeOverlay = () => {
    setTaskModal(null);
    setTaskModalError("");
    setTaskRowErrors({});
    setFocusRowId(null);
  };
  const openTaskPicker = (petGroupKey: string) => {
    const petGroup = petCareGroups.find((group) => group.key === petGroupKey);
    setTaskModal({
      petGroupKey,
      petIds: [...(petGroup?.petIds ?? [])],
      rows: [createModalRow()],
      sourceItems: [],
      orderSlots: [],
    });
    setTaskModalError("");
    setTaskRowErrors({});
  };
  const editTaskGroup = (
    petGroupKey: string,
    items: BoardingDisplayTaskItem[],
  ) => {
    const sortedItems = [...items].sort(
      (a, b) => a.routine.order - b.routine.order,
    );
    const petIds = [...(sortedItems[0]?.petIds ?? [])];
    setTaskModal({
      petGroupKey,
      petIds,
      rows: sortedItems.map(({ config, routine }) => ({
        id: crypto.randomUUID(),
        templateId: config.custom
          ? customBoardingTaskId
          : config.templateId,
        customLabel: config.custom ? config.label : "",
        scheduleType: routine.scheduleType,
        notes: routine.instructions,
        priority: routine.priority,
        source: {
          templateId: config.templateId,
          routineId: routine.id,
        },
      })),
      sourceItems: sortedItems.flatMap((item) =>
        item.sourceItems.map(({ config, routine }) => ({
          templateId: config.templateId,
          routineId: routine.id,
        })),
      ),
      orderSlots: sortedItems.map(({ routine }) => routine.order),
    });
    setTaskModalError("");
    setTaskRowErrors({});
  };
  const updateTaskModal = (patch: Partial<BoardingTaskModalDraft>) =>
    setTaskModal((current) => (current ? { ...current, ...patch } : current));
  const updateTaskRow = (
    id: string,
    patch: Partial<BoardingTaskModalRow>,
  ) =>
    setTaskModal((current) =>
      current
        ? {
            ...current,
            rows: current.rows.map((row) =>
              row.id === id ? { ...row, ...patch } : row,
            ),
          }
        : current,
    );
  const moveTaskRow = (id: string, direction: -1 | 1) =>
    setTaskModal((current) => {
      if (!current) return current;
      const index = current.rows.findIndex((row) => row.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.rows.length)
        return current;
      const rows = [...current.rows];
      [rows[index], rows[nextIndex]] = [rows[nextIndex], rows[index]];
      return { ...current, rows };
    });
  const removeTaskRow = (id: string) =>
    setTaskModal((current) =>
      current && current.rows.length > 1
        ? { ...current, rows: current.rows.filter((row) => row.id !== id) }
        : current,
    );
  const removeTaskGroup = (items: BoardingDisplayTaskItem[]) => {
    const groupKeys = new Set(
      items.flatMap((item) =>
        item.sourceItems.map(
          ({ config, routine }) => config.templateId + "::" + routine.id,
        ),
      ),
    );
    onChange(
      value.flatMap((config) => {
        const routines = config.routines.filter(
          (routine) =>
            !groupKeys.has(config.templateId + "::" + routine.id),
        );
        return routines.length ? [{ ...config, routines }] : [];
      }),
    );
  };
  const saveTaskModal = () => {
    if (!taskModal) return;
    setTaskModalError(taskModal.petIds.length ? "" : copy.choosePetGroup);
    const taskNames = new Map(
      taskModal.rows.map((row) => {
        const option = localizedOptions.find(
          (candidate) => candidate.id === row.templateId,
        );
        const label =
          row.templateId === customBoardingTaskId
            ? row.customLabel.trim()
            : option?.label ?? "";
        return [row.id, label] as const;
      }),
    );
    const normalizedNameCounts = Array.from(taskNames.values()).reduce<
      Map<string, number>
    >((counts, label) => {
      const normalized = label
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleLowerCase(lang);
      if (normalized)
        counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
      return counts;
    }, new Map());
    const rowErrors = Object.fromEntries(
      taskModal.rows.flatMap((row) => {
        const label = taskNames.get(row.id) ?? "";
        if (!label) return [[row.id, groupCopy.taskNameRequired]];
        const normalized = label
          .trim()
          .replace(/\s+/g, " ")
          .toLocaleLowerCase(lang);
        if ((normalizedNameCounts.get(normalized) ?? 0) > 1)
          return [[row.id, groupCopy.duplicateTaskName]];
        return [];
      }),
    );
    setTaskRowErrors(rowErrors);
    if (!taskModal.petIds.length || Object.keys(rowErrors).length) return;

    const targetPetIdSet = new Set(taskModal.petIds);
    const modalTaskLabels = new Set(
      taskModal.rows.map((row) => {
        const custom = row.templateId === customBoardingTaskId;
        const option = localizedOptions.find((o) => o.id === row.templateId);
        return (custom ? row.customLabel : option?.label ?? "")
          .trim()
          .toLowerCase();
      }),
    );

    let nextValue = value.map((config) => ({
      ...config,
      routines: [...config.routines],
    }));

    if (taskModal.sourceItems.length) {
      const sourceKeys = new Set(
        taskModal.sourceItems.map(
          (source) => source.templateId + "::" + source.routineId,
        ),
      );
      nextValue = nextValue.flatMap((config) => {
        const routines = config.routines.filter(
          (routine) =>
            !sourceKeys.has(config.templateId + "::" + routine.id),
        );
        return routines.length ? [{ ...config, routines }] : [];
      });
    }

    nextValue = nextValue.flatMap((config) => {
      const routines = config.routines.flatMap((routine) => {
        if (
          modalTaskLabels.has(config.label.trim().toLowerCase()) &&
          routine.petIds.some((p) => targetPetIdSet.has(p))
        ) {
          const remainingPetIds = routine.petIds.filter(
            (p) => !targetPetIdSet.has(p),
          );
          return remainingPetIds.length
            ? [{ ...routine, petIds: remainingPetIds }]
            : [];
        }
        return [routine];
      });
      return routines.length ? [{ ...config, routines }] : [];
    });

    for (const [rowIndex, row] of taskModal.rows.entries()) {
      const custom = row.templateId === customBoardingTaskId;
      const option = localizedOptions.find(
        (candidate) => candidate.id === row.templateId,
      );
      const label = custom ? row.customLabel.trim() : option?.label ?? "";
      const templateId = custom
        ? `boarding-custom-${crypto.randomUUID()}`
        : row.templateId;

      for (const petId of taskModal.petIds) {
        const routine: BoardingRoutine = {
          id: crypto.randomUUID(),
          petIds: [petId],
          priority: row.priority,
          scheduleType: row.scheduleType,
          instructions: row.notes.trim(),
          order:
            taskModal.orderSlots[rowIndex] ??
            nextOrder + Math.max(0, rowIndex - taskModal.orderSlots.length),
        };
        const existing = nextValue.find(
          (config) => config.templateId === templateId,
        );
        nextValue = existing
          ? nextValue.map((config) =>
              config.templateId === templateId
                ? { ...config, routines: [...config.routines, routine] }
                : config,
            )
          : [
              ...nextValue,
              { templateId, label, custom, routines: [routine] },
            ];
      }
    }
    onChange(nextValue);
    closeOverlay();
  };
  useEffect(() => {
    if (!overlayOpen || !overlayPanelRef.current || !overlayAnchorRef.current)
      return;
    const panel = overlayPanelRef.current;
    const scroller = findScrollContainer(overlayAnchorRef.current);
    requestAnimationFrame(() => {
      const panelRect = panel.getBoundingClientRect();
      const scrollRect = scroller.getBoundingClientRect();
      if (
        panelRect.top < scrollRect.top + 12 ||
        panelRect.bottom > scrollRect.bottom - 20
      )
        scroller.scrollTop += panelRect.top - scrollRect.top - 12;
    });
  }, [overlayOpen]);
  const allItems = value.flatMap((config) =>
    config.routines.map((routine) => ({ config, routine })),
  );
  const itemsForPetGroup = (petIds: string[]) =>
    allItems
      .filter(({ routine }) =>
        routine.petIds.some((petId) => petIds.includes(petId)),
      )
      .sort((a, b) => a.routine.order - b.routine.order);
  const copyTasksFromGroup = (sourcePetGroupKey: string) => {
    const sourceGroup = petCareGroups.find(
      (group) => group.key === sourcePetGroupKey,
    );
    const targetGroup = petCareGroups.find(
      (group) => group.key === copyTargetGroupKey,
    );
    if (!sourceGroup || !targetGroup) return;
    const result = copyBoardingTasksToPetGroup({
      value,
      sourcePetIds: sourceGroup.petIds,
      targetPetIds: targetGroup.petIds,
    });
    if (result.copiedCount) onChange(result.value);
    setCopyTargetGroupKey(null);
  };
  const invalidRoutine = allItems.some(
    ({ routine }) =>
      !routine.petIds.some((petId) => pets.some((pet) => pet.id === petId)),
  );
  const scheduleOptions: Array<{ id: BoardingScheduleType; label: string }> = [
    { id: "daily", label: groupCopy.daily },
    { id: "repeating", label: groupCopy.regularly },
    { id: "once", label: groupCopy.once },
    { id: "as-needed", label: groupCopy.asNeeded },
  ];
  const taskModalPets = (taskModalGroup?.petIds ?? []).flatMap((petId) => {
    const pet = pets.find((candidate) => candidate.id === petId);
    return pet ? [pet] : [];
  });
  const taskModalPetType = taskModalPets[0]
    ? localizedPetDisplayType(taskModalPets[0])
    : "";
  const allTaskModalPetsSelected =
    taskModalPets.length > 0 &&
    taskModalPets.every((pet) => taskModal?.petIds.includes(pet.id));
  const clearTaskRowError = (rowId: string) =>
    setTaskRowErrors((current) => {
      if (!current[rowId]) return current;
      const next = { ...current };
      delete next[rowId];
      return next;
    });
  const routineScheduleLabel = (routine: BoardingRoutine) => {
    if (routine.scheduleType === "daily") return groupCopy.daily;
    if (routine.scheduleType === "repeating") return groupCopy.regularly;
    if (routine.scheduleType === "once") return groupCopy.once;
    return groupCopy.asNeeded;
  };
  const routineScheduleClassName = (
    scheduleType: BoardingScheduleType,
  ) => {
    if (scheduleType === "daily")
      return "border-sky-200 bg-sky-50 text-sky-700";
    if (scheduleType === "repeating")
      return "border-violet-200 bg-violet-50 text-violet-700";
    if (scheduleType === "once")
      return "border-amber-300 bg-amber-50 text-amber-800";
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  };
  return (
    <div className="space-y-5">
      {showValidation && invalidRoutine && (
        <div
          role="alert"
          className="rounded-[14px] border border-danger-border bg-danger-bg px-4 py-3 text-sm font-semibold text-danger-text"
        >
          {copy.completeEveryRoutine}
        </div>
      )}
      <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
        {t.core.needPublishingTaskForm.careTasks}
      </h3>
      {!petCareGroups.length ? (
        <div className="rounded-[16px] border border-dashed border-[#d9d1dc] bg-white px-5 py-8 text-center text-sm font-medium text-[#817a85]">
          {copy.addPetFirst}
        </div>
      ) : null}
      {petCareGroups.map((group) => {
        const groupPets = group.petIds.flatMap((petId) => {
          const pet = pets.find((item) => item.id === petId);
          return pet ? [pet] : [];
        });
        const items = itemsForPetGroup(group.petIds);
        const mergedItems = mergeIdenticalBoardingTaskItems(
          items,
          group.petIds,
        );
        const uncoveredPets = groupPets.filter(
          (pet) =>
            !items.some(({ routine }) => routine.petIds.includes(pet.id)),
        );
        const GroupIcon =
          petTypes.find(
            (type) => type.id === groupPets[0]?.type.trim().toLowerCase(),
          )?.icon ?? PiSparkle;
        const groupNames = groupPets
          .map(
            (pet) =>
              pet.name ||
              localizedPetDisplayType(pet) ||
              `Pet ${pets.indexOf(pet) + 1}`,
          )
          .join(" & ");
        const itemGroups = mergedItems.reduce<
          Array<{ key: string; petIds: string[]; items: typeof mergedItems }>
        >((groups, item) => {
          const petIds = group.petIds.filter((petId) =>
            item.petIds.includes(petId),
          );
          const key = [...petIds].sort().join("|");
          const existing = groups.find((candidate) => candidate.key === key);
          if (existing) existing.items.push(item);
          else groups.push({ key, petIds, items: [item] });
          return groups;
        }, []);
        const canCopy = petCareGroups.some(
          (candidate) =>
            candidate.key !== group.key &&
            itemsForPetGroup(candidate.petIds).length > 0,
        );
        return (
          <div key={group.key} className="space-y-3">
            <h3 className="flex min-w-0 items-center gap-2 text-sm font-bold text-[var(--primary)]">
              <span className="shrink-0">
                {groupPets[0]
                  ? localizedPetDisplayType(groupPets[0])
                  : group.label}
              </span>
              {groupNames ? (
                <span className="inline-flex min-w-0 items-center gap-1 text-xs font-medium text-[#817a85]">
                  <GroupIcon
                    size={14}
                    aria-hidden="true"
                    className="shrink-0 text-[var(--primary-muted)]"
                  />
                  <span className="truncate">{groupNames}</span>
                </span>
              ) : null}
            </h3>
            <div className="relative w-fit max-w-full">
              <p className="absolute bottom-full right-0 mb-1.5 whitespace-nowrap text-right text-[11px] font-medium text-[#817a85]">
                {taskFormCopy.tasksCount.replace(
                  "{n}",
                  String(mergedItems.length),
                )}
              </p>
              <div className="w-fit max-w-full overflow-x-auto rounded-[15px] border border-[var(--primary-border)] bg-white">
                <table className="w-fit max-w-full table-auto border-collapse text-left text-xs">
                  <thead className="border-b border-[var(--outline-variant)] bg-[var(--primary-fixed)] text-[11px] font-semibold tracking-[0.02em] text-[var(--on-primary-fixed-variant)]">
                    <tr>
                      <th className="max-w-[280px] whitespace-normal px-3 py-2.5 text-center">
                        {groupCopy.petGroupColumn}
                      </th>
                      <th className="max-w-[360px] whitespace-normal px-3 py-2.5 text-center">
                        {groupCopy.taskColumn}
                      </th>
                      <th className="max-w-[320px] whitespace-normal px-3 py-2.5 text-center">
                        {groupCopy.notesColumn}
                      </th>
                      <th className="w-20 max-w-20 whitespace-normal px-3 py-2.5 text-center">
                        {groupCopy.actionsColumn}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eee9ef]">
                    {mergedItems.length ? (
                      itemGroups.flatMap((petTaskGroup) =>
                        petTaskGroup.items.map(
                          ({ config, routine }, taskIndex) => {
                            const TaskIcon =
                              localizedOptions.find(
                                (option) =>
                                  option.id === config.templateId,
                              )?.icon ?? PiSparkle;
                            const targetPets = petTaskGroup.petIds.flatMap(
                              (petId) => {
                                const pet = groupPets.find(
                                  (candidate) => candidate.id === petId,
                                );
                                return pet ? [pet] : [];
                              },
                            );
                            const targetPetNames = targetPets
                              .map(
                                (pet) =>
                                  pet.name || localizedPetDisplayType(pet),
                              )
                              .join(" & ");
                            return (
                              <tr
                                key={routine.id}
                                className="text-[#514956]"
                              >
                                {taskIndex === 0 ? (
                                  <td
                                    rowSpan={petTaskGroup.items.length}
                                    className="max-w-[280px] px-3 py-3 align-middle"
                                  >
                                    <div className="flex max-w-full flex-wrap items-center gap-2">
                                      {targetPets.map((pet) => (
                                        <div
                                          key={pet.id}
                                          className="flex min-w-0 max-w-full items-center gap-2 rounded-[12px] border border-[#dcd3e3] bg-transparent p-2"
                                        >
                                          <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
                                            <PetDraftAvatar pet={pet} />
                                          </span>
                                          <span className="min-w-0 max-w-[120px]">
                                            <span className="block truncate text-xs font-bold text-[#35243f]">
                                              {pet.name ||
                                                localizedPetDisplayType(pet)}
                                            </span>
                                            <span className="mt-0.5 block truncate text-[10px] text-[#817a85]">
                                              {localizedPetDisplayType(pet)}
                                            </span>
                                          </span>
                                        </div>
                                      ))}
                                      {!targetPets.length ? (
                                        <span className="text-xs text-[#9a939f]">
                                          {copy.noPets}
                                        </span>
                                      ) : null}
                                    </div>
                                  </td>
                                ) : null}
                                <td className="max-w-[360px] whitespace-normal px-3 py-3 align-middle">
                                  <div className="flex items-center gap-2.5">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary-fixed)] text-[10px] font-bold text-[var(--primary)]">
                                      {taskIndex + 1}
                                    </span>
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#f6f2f7] text-[#8a5d34]">
                                      <TaskIcon size={17} />
                                    </span>
                                    <span className="min-w-0 font-semibold [overflow-wrap:anywhere]">
                                      {config.label}
                                    </span>
                                    <span
                                      className={cn(
                                        "inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold",
                                        routineScheduleClassName(
                                          routine.scheduleType,
                                        ),
                                      )}
                                    >
                                      {routineScheduleLabel(routine)}
                                    </span>
                                  </div>
                                </td>
                                <td className="max-w-[320px] whitespace-normal px-3 py-3 text-center align-middle">
                                  <span
                                    className={cn(
                                      "block min-w-0 break-words [overflow-wrap:anywhere]",
                                      routine.instructions.trim()
                                        ? "text-[#514956]"
                                        : "text-[#aaa4ae]",
                                    )}
                                  >
                                    {routine.instructions.trim() || "—"}
                                  </span>
                                </td>
                                {taskIndex === 0 ? (
                                  <td
                                    rowSpan={petTaskGroup.items.length}
                                    className="w-20 max-w-20 px-2 py-3 align-middle"
                                  >
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        type="button"
                                        aria-label={
                                          copy.edit + " " + targetPetNames
                                        }
                                        onClick={() =>
                                          editTaskGroup(
                                            group.key,
                                            petTaskGroup.items,
                                          )
                                        }
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--primary)] transition hover:bg-[var(--primary-fixed)]"
                                      >
                                        <PiPencilSimple size={15} />
                                      </button>
                                      <button
                                        type="button"
                                        aria-label={
                                          copy.removeRoutine +
                                          " " +
                                          targetPetNames
                                        }
                                        onClick={() =>
                                          removeTaskGroup(petTaskGroup.items)
                                        }
                                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-bg text-danger-text transition hover:bg-danger-ring"
                                      >
                                        <PiTrash size={15} />
                                      </button>
                                    </div>
                                  </td>
                                ) : null}
                              </tr>
                            );
                          },
                        ),
                      )
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-5 py-6 text-center align-middle">
                          {showValidation ? (
                            <p
                              role="alert"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-danger-bg px-3 py-2 text-xs font-semibold text-danger-text"
                            >
                              <PiWarningCircle size={15} className="shrink-0" />
                              {copy.missingPetRoutines.replace(
                                "{pets}",
                                uncoveredPets
                                  .map(
                                    (pet) =>
                                      pet.name ||
                                      localizedPetDisplayType(pet),
                                  )
                                  .join(", "),
                              )}
                            </p>
                          ) : (
                            <p className="text-sm font-bold text-[#514956]">
                              {groupCopy.noTasks}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                    {items.length > 0 &&
                    showValidation &&
                    uncoveredPets.length > 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-2.5 text-center align-middle">
                          <p
                            role="alert"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-danger-bg px-3 py-2 text-xs font-semibold text-danger-text"
                          >
                            <PiWarningCircle size={15} className="shrink-0" />
                            {copy.missingPetRoutines.replace(
                              "{pets}",
                              uncoveredPets
                                .map(
                                  (pet) =>
                                    pet.name || localizedPetDisplayType(pet),
                                )
                                .join(", "),
                            )}
                          </p>
                        </td>
                      </tr>
                    ) : null}
                    <tr>
                      <td colSpan={4} className="px-3 py-2 align-middle">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openTaskPicker(group.key)}
                            className="inline-flex items-center gap-2 rounded-[11px] border border-[var(--primary-border)] bg-white py-1.5 pl-1.5 pr-3 text-xs font-bold text-[var(--primary)] transition hover:bg-[var(--primary-subtle)]"
                          >
                            <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[var(--primary)] text-white">
                              <PiPlus size={14} />
                            </span>
                            {copy.addATask}
                          </button>
                          <button
                            type="button"
                            disabled={!canCopy}
                            onClick={() => setCopyTargetGroupKey(group.key)}
                            className="inline-flex items-center gap-2 rounded-[11px] border border-[var(--primary-border)] bg-white py-1.5 pl-1.5 pr-3 text-xs font-bold text-[var(--primary)] transition hover:bg-[var(--primary-subtle)] disabled:pointer-events-none disabled:opacity-40"
                          >
                            <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[var(--primary-fixed)] text-[var(--primary)]">
                              <PiCopy size={14} />
                            </span>
                            {groupCopy.copyFrom}
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={overlayAnchorRef} className="relative h-0 w-full" />
      {taskModal ? (
        <ModalShell
          title={
            t.core.needPublishingTaskForm.configureTask +
            " · " +
            taskModalPetType
          }
          closeLabel={copy.cancel}
          cancelLabel={copy.cancel}
          saveLabel={taskFormCopy.save}
          onClose={closeOverlay}
          onCancel={closeOverlay}
          onSave={saveTaskModal}
          panelRef={overlayPanelRef}
          panelClassName="max-w-[960px] rounded-[20px] border-[#d8c9e3] bg-white"
          bodyClassName="bg-white md:px-6"
        >
          <p className="text-sm text-[#817a85]">{groupCopy.intro}</p>

          <section className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                {t.core.needPublishingTaskForm.whoNeeds}
              </p>
              <button
                type="button"
                onClick={() => {
                  updateTaskModal({
                    petIds: allTaskModalPetsSelected
                      ? []
                      : taskModalPets.map((pet) => pet.id),
                  });
                  setTaskModalError("");
                }}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25",
                  allTaskModalPetsSelected
                    ? "border-[var(--primary-border-strong)] bg-[var(--primary-fixed)] text-[var(--primary)] hover:bg-[#e6d8ee]"
                    : "border-[#bba9c8] bg-[var(--primary-subtle)] text-[var(--primary)] hover:border-[var(--primary-border-strong)] hover:bg-[var(--primary-fixed)]",
                )}
              >
                <PiCheck size={14} />
                {allTaskModalPetsSelected
                  ? groupCopy.deselectAll
                  : groupCopy.selectAll}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {taskModalPets.map((pet) => {
                const selected = taskModal.petIds.includes(pet.id);
                return (
                  <button
                    key={pet.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      updateTaskModal({
                        petIds: selected
                          ? taskModal.petIds.filter((id) => id !== pet.id)
                          : [...taskModal.petIds, pet.id],
                      });
                      setTaskModalError("");
                    }}
                    className={cn(
                      "flex w-fit max-w-full min-w-0 items-center gap-3 rounded-[14px] border p-2.5 text-left transition",
                      selected
                        ? "border-[var(--primary)] bg-[#f4ecfa] ring-2 ring-[#e7d9f0]"
                        : "border-[#ded9e0] bg-white hover:border-[var(--primary-border)]",
                    )}
                  >
                    <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[#e3d7c8] bg-[#fff8e8]">
                      <PetDraftAvatar pet={pet} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-[#35243f]">
                        {pet.name || localizedPetDisplayType(pet)}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[#817a85]">
                        {localizedPetDisplayType(pet)}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                        selected
                          ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                          : "border-[#cfc3d7] text-transparent",
                      )}
                    >
                      <PiCheck size={14} />
                    </span>
                  </button>
                );
              })}
              {taskModalError ? (
                <p
                  role="alert"
                  className="inline-flex max-w-full items-center gap-1.5 rounded-[10px] border border-danger-border bg-danger-bg px-3 py-2 text-xs font-bold text-danger-text"
                >
                  <PiWarningCircle size={14} className="shrink-0" />
                  {taskModalError}
                </p>
              ) : null}
            </div>
          </section>

          <section className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                {t.core.needPublishingTaskForm.task}
              </p>
              <span className="text-[11px] text-[#9a939f]">
                {taskFormCopy.tasksCount.replace(
                  "{n}",
                  String(taskModal.rows.length),
                )}
              </span>
            </div>
            <div
              ref={taskTableRef}
              className="max-h-[310px] overflow-auto rounded-[14px] border border-[var(--primary-border)] bg-white"
            >
              <table className="w-full min-w-[820px] table-fixed border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 border-b border-[var(--outline-variant)] bg-[var(--primary-fixed)] text-[11px] font-semibold tracking-[0.02em] text-[var(--on-primary-fixed-variant)]">
                  <tr>
                    <th className="w-[7%] px-3 py-2.5 text-center">
                      {taskFormCopy.index}
                    </th>
                    <th className="w-[28%] px-3 py-2.5 text-center">
                      {groupCopy.taskName}
                    </th>
                    <th className="w-[22%] px-3 py-2.5 text-center">
                      {groupCopy.frequency}
                    </th>
                    <th className="w-[31%] px-3 py-2.5 text-center">
                      {groupCopy.notes}
                    </th>
                    <th className="w-[12%] px-3 py-2.5 text-center">
                      {groupCopy.actionsColumn}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee9ef]">
                  {taskModal.rows.map((row, index) => {
                    const nameError = taskRowErrors[row.id];
                    return (
                      <tr key={row.id} className="align-middle text-[#514956]">
                        <td className="px-3 py-3 text-center align-middle font-bold text-[var(--primary)]">
                          {index + 1}
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <VisitTaskNameCombobox
                            ariaLabel={groupCopy.taskName + " " + (index + 1)}
                            value={row.templateId}
                            customValue={row.customLabel}
                            customValueKey={customBoardingTaskId}
                            options={localizedOptions.map((option) => ({
                              value: option.id,
                              label: option.label,
                              icon: option.icon,
                            }))}
                            placeholder={
                              t.core.needPublishingTaskForm.taskNamePlaceholder
                            }
                            autoFocus={row.id === focusRowId}
                            error={nameError}
                            errorId={`boarding-task-name-error-${row.id}`}
                            onChange={(next) => {
                              updateTaskRow(row.id, {
                                templateId: next.value,
                                customLabel: next.customValue,
                              });
                              clearTaskRowError(row.id);
                            }}
                          />
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <VisitSelect
                            ariaLabel={groupCopy.frequency + " " + (index + 1)}
                            value={row.scheduleType}
                            options={scheduleOptions.map((option) => ({
                              value: option.id,
                              label: option.label,
                            }))}
                            onChange={(next) => {
                              updateTaskRow(row.id, {
                                scheduleType: next as BoardingScheduleType,
                              });
                              clearTaskRowError(row.id);
                            }}
                            className="h-10 rounded-lg px-3 text-xs font-semibold"
                            listClassName="z-[1300]"
                          />
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <input
                            aria-label={groupCopy.notes + " " + (index + 1)}
                            value={row.notes}
                            onChange={(event) => {
                              updateTaskRow(row.id, {
                                notes: event.target.value,
                              });
                              clearTaskRowError(row.id);
                            }}
                            className={cn(
                              inputClass,
                              "h-10 w-full rounded-lg px-3 text-xs font-semibold placeholder:font-normal",
                            )}
                            placeholder={groupCopy.notesPlaceholder}
                          />
                        </td>
                        <td className="px-2 py-3 align-middle">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              aria-label={groupCopy.moveUp + " " + (index + 1)}
                              disabled={index === 0}
                              onClick={() => moveTaskRow(row.id, -1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#706a78] transition hover:bg-[var(--primary-fixed)] disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <PiCaretUp size={16} />
                            </button>
                            <button
                              type="button"
                              aria-label={groupCopy.moveDown + " " + (index + 1)}
                              disabled={index === taskModal.rows.length - 1}
                              onClick={() => moveTaskRow(row.id, 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#706a78] transition hover:bg-[var(--primary-fixed)] disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <PiCaretDown size={16} />
                            </button>
                            <button
                              type="button"
                              aria-label={copy.removeRoutine + " " + (index + 1)}
                              disabled={taskModal.rows.length <= 1}
                              onClick={() => removeTaskRow(row.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-bg text-danger-text transition hover:bg-danger-ring disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <PiTrash size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={addTaskRow}
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-[10px] border border-[var(--primary-border)] bg-[var(--primary-fixed)] py-1 pl-1.5 pr-3.5 text-xs font-bold text-[var(--on-primary-fixed-variant)] transition hover:border-[var(--primary-border-strong)]"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--primary)] text-white">
                <PiPlus size={15} />
              </span>
              {copy.addTask}
            </button>
          </section>
        </ModalShell>
      ) : null}
      {copyTargetGroupKey ? (
        <ModalShell
          title={groupCopy.copyTitle}
          closeLabel={copy.cancel}
          cancelLabel={copy.cancel}
          showSave={false}
          onClose={() => setCopyTargetGroupKey(null)}
          onCancel={() => setCopyTargetGroupKey(null)}
          panelClassName="max-w-[620px] rounded-[20px] border-[#d8c9e3]"
        >
          <p className="text-sm leading-6 text-[#706a78]">
            {groupCopy.copyDetail}
          </p>
          <div className="mt-4 space-y-2">
            {petCareGroups
              .filter(
                (group) =>
                  group.key !== copyTargetGroupKey &&
                  itemsForPetGroup(group.petIds).length > 0,
              )
              .map((group) => {
                const itemCount = itemsForPetGroup(group.petIds).length;
                return (
                  <button
                    type="button"
                    key={group.key}
                    onClick={() => copyTasksFromGroup(group.key)}
                    className="flex w-full items-center justify-between gap-4 rounded-[14px] border border-[#ded9e0] bg-white px-4 py-3 text-left transition hover:border-[var(--primary-border)] hover:bg-[var(--primary-subtle)]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-[#35243f]">
                        {group.label}
                      </span>
                      <span className="mt-1 block text-xs text-[#817a85]">
                        {itemCount} {itemCount === 1 ? groupCopy.task : groupCopy.tasks}
                      </span>
                    </span>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white">
                      <PiCopy size={16} />
                    </span>
                  </button>
                );
              })}
            {!petCareGroups.some(
              (group) =>
                group.key !== copyTargetGroupKey &&
                itemsForPetGroup(group.petIds).length > 0,
            ) ? (
              <p className="rounded-[14px] border border-dashed border-[#d9d1dc] px-4 py-6 text-center text-sm text-[#817a85]">
                {groupCopy.noCopySource}
              </p>
            ) : null}
          </div>
        </ModalShell>
      ) : null}
      <Field label={copy.additionalNotes} optional>
        <textarea
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          className={textareaClass}
          placeholder={copy.additionalNotesPlaceholder}
        />
      </Field>
    </div>
  );
}

// Compatibility exports
export const BoardingTaskEditor = StepBoardingTasks;
export const GuidedNeedBoardingTasksStep = StepBoardingTasks;
