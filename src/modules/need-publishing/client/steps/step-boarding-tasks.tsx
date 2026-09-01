"use client";

import { useEffect, useRef, useState } from "react";
import type { IconType } from "react-icons";
import {
  PiCaretDown,
  PiCaretUp,
  PiCheck,
  PiPencilSimple,
  PiPlus,
  PiSparkle,
  PiTrash,
  PiWarningCircle,
  PiX,
} from "react-icons/pi";
import { useLanguage } from "@/components/providers/language-provider";
import { useNeedPublishingMessages } from "@/modules/need-publishing/client";
import { ModalShell } from "@/components/ui/modal-shell";
import type {
  BoardingScheduleType,
  BoardingTaskConfig,
  PetDraft,
} from "@/domain/publishing/legacy-need-draft-v3";
import { boardingTaskFingerprint } from "@/modules/need-publishing/domain/task-fingerprint";
import {
  localizeTaskLabel,
  taskPersistenceLabel,
} from "@/modules/need-publishing/domain/task-catalog";
import cn from "@/lib/cn";
import {
  VisitSelect,
  VisitTaskNameCombobox,
} from "../components/controls/visit-task-combobox";
import {
  buildPetCareGroups,
  Field,
  inputClass,
  petDisplayType,
  PetDraftAvatar,
  textareaClass,
} from "../guided-need-flow-shared";
import { groupTaskRowsByPetGroup } from "../task-grouping";
import { PublishingValidationAlert } from "../components/publishing-validation-alert";

const customTaskId = "__custom-boarding-task__";

function frequencyBadgeStyle(freq: BoardingScheduleType) {
  switch (freq) {
    case "daily":
      return "border border-purple-200/80 bg-purple-50 text-purple-800";
    case "repeating":
      return "border border-indigo-200/80 bg-indigo-50 text-indigo-800";
    case "once":
      return "border border-sky-200/80 bg-sky-50 text-sky-800";
    case "as-needed":
    default:
      return "border border-emerald-200/80 bg-emerald-50 text-emerald-800";
  }
}

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/Popover";

function NotesCellInput({
  value,
  placeholder,
  onChange,
  side = "bottom",
}: {
  value: string;
  placeholder?: string;
  onChange: (val: string) => void;
  side?: "top" | "bottom";
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen && inputRef.current) {
      inputRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <div className="relative flex w-full items-center">
        <PopoverTrigger asChild>
          <input
            ref={inputRef}
            value={value}
            title={value}
            readOnly
            onClick={() => handleOpen(true)}
            className={cn(
              inputClass,
              "h-10 w-full cursor-pointer rounded-lg px-3 text-xs",
            )}
            placeholder={placeholder}
          />
        </PopoverTrigger>
      </div>

      <PopoverContent
        align="start"
        side={side}
        avoidCollisions={true}
        className="z-[1300] w-[300px] sm:w-[340px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
      >
        <div className="flex items-center justify-between pb-1.5 text-[11px] font-bold text-slate-500">
          <span>Notes</span>
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs font-semibold text-danger-text hover:underline"
            >
              Clear all
            </button>
          ) : null}
        </div>
        <textarea
          autoFocus
          value={value}
          rows={4}
          onChange={(e) => onChange(e.target.value)}
          className="w-full resize-y rounded-lg border border-slate-200 p-2 text-xs leading-relaxed text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder={placeholder}
        />
      </PopoverContent>
    </Popover>
  );
}

type BoardingRow = {
  id: string;
  petIds: string[];
  templateId: string;
  customLabel: string;
  label: string;
  custom: boolean;
  frequency: BoardingScheduleType;
  notes: string;
  order: number;
};

type RowError = { pets?: string; name?: string };

function fingerprint(
  row: Pick<
    BoardingRow,
    "petIds" | "templateId" | "custom" | "label" | "frequency" | "notes"
  >,
) {
  return boardingTaskFingerprint({
    assignmentPetKeys: row.petIds,
    taskName: row.label,
    taskCode: row.custom ? null : row.templateId,
    custom: row.custom,
    frequency: row.frequency,
    notes: row.notes,
  });
}

function rowsForPetGroup(
  value: BoardingTaskConfig[],
  groupPetIds: string[],
  lang: "en" | "zh" | "ja",
) {
  const groupSet = new Set(groupPetIds);
  const rows = new Map<string, BoardingRow>();
  value.forEach((config) => {
    config.routines.forEach((routine) => {
      let petIds = routine.petIds.filter((petId) => groupSet.has(petId));
      if (!petIds.length && groupPetIds.length === 1) {
        petIds = groupPetIds;
      }
      if (!petIds.length) return;
      const key = boardingTaskFingerprint({
        assignmentPetKeys: petIds,
        taskName: config.label,
        taskCode: config.custom ? null : config.templateId,
        custom: config.custom,
        frequency: routine.scheduleType,
        notes: routine.instructions,
      });
      const existing = rows.get(key);
      if (existing) {
        petIds.forEach((petId) => {
          if (!existing.petIds.includes(petId)) existing.petIds.push(petId);
        });
        existing.order = Math.min(existing.order, routine.order);
        return;
      }
      rows.set(key, {
        id: crypto.randomUUID(),
        petIds,
        templateId: config.custom ? customTaskId : config.templateId,
        customLabel: config.custom ? config.label : "",
        label: localizeTaskLabel(config.label, lang, {
          templateId: config.templateId,
          custom: config.custom,
        }),
        custom: config.custom,
        frequency: routine.scheduleType,
        notes: routine.instructions,
        order: routine.order,
      });
    });
  });
  return Array.from(rows.values()).sort((a, b) => a.order - b.order);
}

function replacePetGroupRows(
  value: BoardingTaskConfig[],
  groupPetIds: string[],
  rows: BoardingRow[],
) {
  const groupSet = new Set(groupPetIds);
  const remaining = value.flatMap((config) => {
    const routines = config.routines.flatMap((routine) => {
      const petIds = routine.petIds.filter((petId) => !groupSet.has(petId));
      return petIds.length ? [{ ...routine, petIds }] : [];
    });
    return routines.length ? [{ ...config, routines }] : [];
  });
  const baseOrder =
    Math.max(
      -1,
      ...remaining.flatMap((config) =>
        config.routines.map((routine) => routine.order),
      ),
    ) + 1;
  return [
    ...remaining,
    ...rows.map((row, index) => ({
      templateId:
        row.custom && row.templateId === customTaskId
          ? `custom-${crypto.randomUUID()}`
          : row.templateId,
      label: row.custom
        ? row.customLabel.trim() || row.label.trim()
        : taskPersistenceLabel({
            code: row.templateId,
            label: row.label,
            custom: false,
          }),
      custom: row.custom,
      routines: [
        {
          id: `boarding-routine-${crypto.randomUUID()}`,
          petIds: [...row.petIds].sort(),
          priority: "must" as const,
          scheduleType: row.frequency,
          instructions: row.notes.trim(),
          order: baseOrder + index,
        },
      ],
    })),
  ];
}

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
  const needMessages = useNeedPublishingMessages();
  const copy = needMessages.needPublishingBoardingForm;
  const taskCopy = needMessages.needPublishingTaskForm;
  const displayPetType = (pet: PetDraft) => petDisplayType(pet, lang);
  const petGroups = buildPetCareGroups(pets, displayPetType);
  const localizedOptions = options.map((option) => {
    const key = option.id.replace(/^boarding-/, "");
    return {
      ...option,
      label:
        needMessages.needPublishing.taskLabels[
          key as keyof typeof needMessages.needPublishing.taskLabels
        ] ?? option.label,
    };
  });
  const [editingGroupKey, setEditingGroupKey] = useState<string | null>(null);
  const [modalRows, setModalRows] = useState<BoardingRow[]>([]);
  const [rowErrors, setRowErrors] = useState<Record<string, RowError>>({});
  const [focusRowId, setFocusRowId] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);
  const editingGroup = petGroups.find((group) => group.key === editingGroupKey);

  const nameForRow = (row: BoardingRow) =>
    row.templateId === customTaskId
      ? row.customLabel.trim()
      : (localizedOptions.find((option) => option.id === row.templateId)?.label ??
        row.label);
  const createRow = (): BoardingRow => ({
    id: crypto.randomUUID(),
    petIds: [...(editingGroup?.petIds ?? [])],
    templateId: "",
    customLabel: "",
    label: "",
    custom: false,
    frequency: "daily",
    notes: "",
    order: 0,
  });

  const openEditor = (groupKey: string) => {
    const group = petGroups.find((candidate) => candidate.key === groupKey);
    if (!group) return;
    const rows = rowsForPetGroup(value, group.petIds, lang);
    setEditingGroupKey(groupKey);
    setModalRows(
      rows.length
        ? rows
        : [
            {
              id: crypto.randomUUID(),
              petIds: [...group.petIds],
              templateId: "",
              customLabel: "",
              label: "",
              custom: false,
              frequency: "daily",
              notes: "",
              order: 0,
            },
          ],
    );
    setRowErrors({});
  };

  const closeEditor = () => {
    setEditingGroupKey(null);
    setModalRows([]);
    setRowErrors({});
  };
  const updateRow = (rowId: string, patch: Partial<BoardingRow>) => {
    setRowErrors((current) => {
      const next = { ...current };
      delete next[rowId];
      return next;
    });
    setModalRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
    );
  };
  const addRow = () => {
    const row = createRow();
    setModalRows((current) => [...current, row]);
    setFocusRowId(row.id);
  };
  useEffect(() => {
    if (!focusRowId) return;
    const frame = requestAnimationFrame(() => {
      tableRef.current?.scrollTo({ top: tableRef.current.scrollHeight, behavior: "smooth" });
      requestAnimationFrame(() => setFocusRowId(null));
    });
    return () => cancelAnimationFrame(frame);
  }, [focusRowId, modalRows]);
  const moveRow = (rowId: string, direction: -1 | 1) =>
    setModalRows((current) => {
      const rows = [...current];
      const index = rows.findIndex((row) => row.id === rowId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= rows.length) return current;
      [rows[index], rows[target]] = [rows[target], rows[index]];
      return rows;
    });

  const saveEditor = () => {
    if (!editingGroup) return;
    const normalizedRows = modalRows.map((row, order) => ({
      ...row,
      label:
        row.templateId === customTaskId
          ? row.customLabel.trim()
          : taskPersistenceLabel({
              code: row.templateId,
              label: nameForRow(row),
              custom: false,
            }),
      custom: row.templateId === customTaskId,
      order,
    }));
    const counts = new Map<string, number>();
    normalizedRows.forEach((row) =>
      counts.set(fingerprint(row), (counts.get(fingerprint(row)) ?? 0) + 1),
    );
    const errors = Object.fromEntries(
      normalizedRows.flatMap((row) => {
        const error: RowError = {};
        if (!row.petIds.length) error.pets = taskCopy.validationPetRequired;
        if (!row.label) error.name = taskCopy.validationTaskNameRequired;
        else if ((counts.get(fingerprint(row)) ?? 0) > 1) {
          error.name = taskCopy.validationDuplicateTaskName;
        }
        return Object.keys(error).length ? [[row.id, error]] : [];
      }),
    );
    setRowErrors(errors);
    if (!normalizedRows.length || Object.keys(errors).length) return;
    onChange(replacePetGroupRows(value, editingGroup.petIds, normalizedRows));
    closeEditor();
  };

  const frequencyLabel = (frequency: BoardingScheduleType) =>
    frequency === "daily"
      ? taskCopy.daily
      : frequency === "repeating"
        ? taskCopy.regularly
        : frequency === "once"
          ? taskCopy.once
          : taskCopy.asNeeded;
  const frequencyOptions = [
    { value: "daily", label: taskCopy.daily },
    { value: "repeating", label: taskCopy.regularly },
    { value: "once", label: taskCopy.once },
    { value: "as-needed", label: taskCopy.asNeeded },
  ];
  const comboboxOptions = localizedOptions.map((option) => ({
    value: option.id,
    label: option.label,
    icon: option.icon,
  }));

  return (
    <div className="space-y-6">
      <section className="space-y-5">
        <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">{taskCopy.careTasks}</h3>
        {!petGroups.length ? <p className="text-sm text-[#817a85]">{copy.addPetFirst}</p> : null}
        {petGroups.map((group) => {
          const rows = rowsForPetGroup(value, group.petIds, lang);
          const assignmentGroups = groupTaskRowsByPetGroup(rows);
          const groupPets = group.petIds.flatMap((petId) => {
            const pet = pets.find((candidate) => candidate.id === petId);
            return pet ? [pet] : [];
          });
          return (
            <article key={group.key} className="rounded-2xl border border-[var(--primary-border)] bg-white p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h4 className="font-bold text-[#35243f]">{groupPets[0] ? displayPetType(groupPets[0]) : group.label}</h4>
                  <div className="flex flex-wrap items-center gap-1.5">{groupPets.map((pet) => <span key={pet.id} className="inline-flex items-center gap-1.5 rounded-full bg-[#f7f2fa] px-2.5 py-1 text-xs font-bold text-[#625a68]"><span className="h-5 w-5 overflow-hidden rounded-full"><PetDraftAvatar pet={pet} /></span>{pet.name || displayPetType(pet)}</span>)}</div>
                </div>
                <button type="button" onClick={() => openEditor(group.key)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--primary)] px-3 text-xs font-bold text-white">
                  {rows.length ? <PiPencilSimple size={15} /> : <PiPlus size={15} />}{rows.length ? taskCopy.edit : copy.addATask}
                </button>
              </div>
              {rows.length ? (
                <>
                <div className="space-y-3 md:hidden">
                  {assignmentGroups.map((assignmentGroup, groupIndex) => {
                    const rowPets = assignmentGroup.petIds.flatMap((petId) => {
                      const pet = pets.find((candidate) => candidate.id === petId);
                      return pet ? [pet] : [];
                    });
                    return (
                      <section key={`${groupIndex}-${assignmentGroup.petIds.join("-")}`} className="overflow-hidden rounded-xl border border-[#e6ddea] bg-white">
                        <div className="flex flex-wrap gap-1.5 bg-[var(--primary-fixed)] px-3 py-2.5">
                          {rowPets.map((pet) => <span key={pet.id} className="inline-flex items-center gap-1.5 rounded-lg border border-[#ded9e0] bg-white px-2 py-1.5 text-xs font-semibold"><span className="h-5 w-5 overflow-hidden rounded-full"><PetDraftAvatar pet={pet} /></span>{pet.name || displayPetType(pet)}</span>)}
                        </div>
                        <div className="divide-y divide-[#eee9ef]">
                          {assignmentGroup.items.map((row) => {
                            const absoluteIndex = rows.findIndex((candidate) => candidate.id === row.id) + 1;
                            const TaskIcon = localizedOptions.find((option) => option.id === row.templateId)?.icon ?? PiSparkle;
                            return (
                              <div key={fingerprint(row)} className="space-y-2 px-3 py-3 text-xs">
                                <div className="grid grid-cols-[20px_16px_minmax(0,1fr)_auto] items-center gap-2">
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f4ecfa] font-bold text-[var(--primary)]">{absoluteIndex}</span>
                                  <TaskIcon size={16} className="text-[#8a5d34]" />
                                  <span className="min-w-0 break-words font-semibold [overflow-wrap:anywhere]">{localizeTaskLabel(row.label, lang, { templateId: row.templateId, custom: row.custom })}</span>
                                  <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold", frequencyBadgeStyle(row.frequency))}>{frequencyLabel(row.frequency)}</span>
                                </div>
                                {row.notes ? <p className="break-words pl-[52px] text-[#706a78] [overflow-wrap:anywhere]">{row.notes}</p> : null}
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
                <div className="hidden max-h-[260px] overflow-y-auto overflow-x-auto rounded-xl border border-[#EDE8E1] md:block">
                  <table className="w-full min-w-[720px] table-auto border-collapse text-xs">
                    <thead className="sticky top-0 z-10 border-b border-[#EDE8E1] bg-[#FAF6F0] text-[#8A5D34]">
                      <tr>
                        <th className="w-[200px] px-4 py-3 text-left font-bold">{taskCopy.whoNeeds}</th>
                        <th className="px-4 py-3 text-left font-bold">{taskCopy.careTasks}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDE8E1]">
                      {assignmentGroups.map((assignmentGroup, groupIdx) => {
                        const rowPets = assignmentGroup.petIds.flatMap((petId) => {
                          const pet = pets.find((candidate) => candidate.id === petId);
                          return pet ? [pet] : [];
                        });
                        return (
                          <tr key={`${groupIdx}-${assignmentGroup.petIds.join("-")}`}>
                            <td className="w-[200px] border-r border-[#EDE8E1] bg-white px-4 py-3 align-top">
                              <div className="flex flex-wrap gap-2">
                                {rowPets.map((pet) => (
                                  <span
                                    key={pet.id}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#ded9e0] bg-white px-2 py-1.5 text-xs font-semibold"
                                  >
                                    <span className="h-5 w-5 overflow-hidden rounded-full">
                                      <PetDraftAvatar pet={pet} />
                                    </span>
                                    {pet.name || displayPetType(pet)}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="bg-white p-0 align-middle">
                              <div className="flex flex-col justify-center divide-y divide-[#EDE8E1]">
                                {assignmentGroup.items.map((row) => {
                                  const absoluteIndex = rows.findIndex((candidate) => candidate.id === row.id) + 1;
                                  const TaskIcon = localizedOptions.find((option) => option.id === row.templateId)?.icon ?? PiSparkle;
                                  return (
                                    <div
                                      key={fingerprint(row)}
                                      className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5 text-xs sm:flex-nowrap"
                                    >
                                      <div className="flex shrink-0 items-center gap-2">
                                        <span className="w-5 shrink-0 text-center font-bold text-primary">
                                          {absoluteIndex}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 font-bold leading-5 text-[#2B231D]">
                                          <TaskIcon size={15} className="text-[#8a5d34]" />
                                          {localizeTaskLabel(row.label, lang, { templateId: row.templateId, custom: row.custom })}
                                        </span>
                                        <span
                                          className={cn(
                                            "inline-flex shrink-0 rounded-full border px-2 py-0.5 font-semibold text-[11px]",
                                            frequencyBadgeStyle(row.frequency),
                                          )}
                                        >
                                          {frequencyLabel(row.frequency)}
                                        </span>
                                      </div>
                                      <span className="min-w-0 flex-1 whitespace-pre-wrap break-words leading-5 text-[#514956] [overflow-wrap:anywhere]">
                                        {row.notes || "—"}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                </>
              ) : showValidation ? <PublishingValidationAlert className="w-full">{copy.missingPetRoutines.replace("{pets}", groupPets.map((pet) => pet.name || displayPetType(pet)).join(", "))}</PublishingValidationAlert> : <p className="rounded-xl border border-dashed border-[#ded9e0] px-4 py-4 text-sm text-[#9a939f]">{taskCopy.noTasksYet}</p>}
            </article>
          );
        })}
      </section>

      <Field label={copy.additionalNotes} optional><textarea value={notes} onChange={(event) => onNotesChange(event.target.value)} className={textareaClass} placeholder={copy.additionalNotesPlaceholder} /></Field>

      {editingGroup ? (
        <ModalShell title={`${taskCopy.configureTask} · ${editingGroup.label}`} closeLabel={copy.cancel} cancelLabel={copy.cancel} saveLabel={taskCopy.save} onClose={closeEditor} onCancel={closeEditor} onSave={saveEditor} panelClassName="max-h-[85dvh] max-w-[1180px] rounded-[20px] border-[#d8c9e3] bg-white flex flex-col" bodyClassName="bg-white md:px-6">
          <div ref={tableRef} className="max-h-[min(50dvh,360px)] overflow-y-auto overflow-x-hidden rounded-[14px] border border-[var(--primary-border)] bg-white md:overflow-auto">
            <table className="block w-full border-collapse text-xs md:table md:min-w-[1000px] md:table-fixed">
              <thead className="sticky top-0 z-10 hidden bg-[var(--primary-fixed)] text-[var(--on-primary-fixed-variant)] md:table-header-group">
                <tr>
                  <th className="w-[22%] px-3 py-2.5">{taskCopy.whoNeeds}</th>
                  <th className="w-12 px-2 py-2.5 text-center">No.</th>
                  <th className="w-[24%] px-3 py-2.5">{taskCopy.taskName}</th>
                  <th className="w-[18%] px-3 py-2.5">{taskCopy.frequency}</th>
                  <th className="w-[24%] px-3 py-2.5">{taskCopy.notesColumn}</th>
                  <th className="w-[12%] px-3 py-2.5 text-center">{taskCopy.actionsColumn}</th>
                </tr>
              </thead>
              <tbody className="block space-y-3 bg-[#f7f3fa] p-2 md:table-row-group md:space-y-0 md:bg-transparent md:p-0">
                {modalRows.map((row, index) => {
                  const isNearBottom = index >= Math.max(1, modalRows.length - 2);
                  const popoverSide = isNearBottom ? "top" : "bottom";
                  return (
                  <tr key={row.id} className="block rounded-xl border border-[#e6ddea] bg-white p-3 md:table-row md:rounded-none md:border-0 md:p-0">
                    <td className="block py-2 align-top md:table-cell md:px-3 md:py-3">
                      <div className="mb-3 flex items-center gap-2 border-b border-[#eee9ef] pb-2 md:hidden">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-[11px] font-bold text-white">{index + 1}</span>
                        <span className="text-xs font-bold text-[#514956]">{taskCopy.task} {index + 1}</span>
                      </div>
                      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a5d34] md:hidden">{taskCopy.whoNeeds}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {editingGroup.petIds.flatMap((petId) => { const pet = pets.find((candidate) => candidate.id === petId); return pet ? [pet] : []; }).map((pet) => {
                          const selected = row.petIds.includes(pet.id);
                          return (
                            <button
                              key={pet.id}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => updateRow(row.id, { petIds: selected ? row.petIds.filter((id) => id !== pet.id) : [...row.petIds, pet.id] })}
                              className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold", selected ? "border-[var(--primary)] bg-[var(--primary-fixed)] text-[var(--primary)]" : "border-[#ded9e0] text-[#817a85]")}
                            >
                              <span className="h-5 w-5 overflow-hidden rounded-full"><PetDraftAvatar pet={pet} /></span>
                              {pet.name || displayPetType(pet)}
                              {selected ? <PiCheck size={12} /> : null}
                            </button>
                          );
                        })}
                      </div>
                      {rowErrors[row.id]?.pets ? <p className="mt-1.5 text-[11px] font-semibold text-danger-text">{rowErrors[row.id]?.pets}</p> : null}
                    </td>
                    <td className="hidden px-2 py-3 text-center font-bold text-[var(--primary)] md:table-cell">{index + 1}</td>
                    <td className="block py-2 align-top md:table-cell md:px-3 md:py-3"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a5d34] md:hidden">{taskCopy.taskName}</span><VisitTaskNameCombobox ariaLabel={`${taskCopy.taskName} ${index + 1}`} value={row.templateId} customValue={row.customLabel} customValueKey={customTaskId} options={comboboxOptions} placeholder={taskCopy.taskNamePlaceholder} autoFocus={focusRowId === row.id} error={rowErrors[row.id]?.name} errorId={`boarding-task-error-${row.id}`} onChange={(next) => updateRow(row.id, { templateId: next.value, customLabel: next.customValue, custom: next.value === customTaskId })} /></td>
                    <td className="block py-2 align-top md:table-cell md:px-3 md:py-3"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a5d34] md:hidden">{taskCopy.frequency}</span><VisitSelect ariaLabel={`${taskCopy.frequency} ${index + 1}`} value={row.frequency} options={frequencyOptions} side={popoverSide} onChange={(next) => updateRow(row.id, { frequency: next as BoardingScheduleType })} /></td>
                    <td className="block py-2 align-top md:table-cell md:px-3 md:py-3"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a5d34] md:hidden">{taskCopy.notesColumn}</span><NotesCellInput value={row.notes} placeholder={taskCopy.notesPlaceholder} side={popoverSide} onChange={(notes) => updateRow(row.id, { notes })} /></td>
                    <td className="block pt-2 align-top md:table-cell md:px-2 md:py-3"><div className="flex justify-end gap-1 md:justify-center"><button type="button" disabled={index === 0} onClick={() => moveRow(row.id, -1)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--primary-fixed)] disabled:opacity-30"><PiCaretUp size={16} /></button><button type="button" disabled={index === modalRows.length - 1} onClick={() => moveRow(row.id, 1)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--primary-fixed)] disabled:opacity-30"><PiCaretDown size={16} /></button><button type="button" disabled={modalRows.length === 1} onClick={() => setModalRows((current) => current.filter((candidate) => candidate.id !== row.id))} className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-bg text-danger-text disabled:cursor-not-allowed disabled:opacity-30"><PiTrash size={15} /></button></div></td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" onClick={addRow} className="inline-flex h-9 items-center gap-2 rounded-full border border-dashed border-[var(--primary-border)] bg-[var(--primary-subtle)] px-3 text-xs font-bold text-[var(--primary)]"><PiPlus size={15} />{copy.addTask}</button>
            {!modalRows.length ? <p className="inline-flex items-center gap-1 text-xs font-semibold text-danger-text"><PiWarningCircle size={14} />{taskCopy.validationNoTask}</p> : null}
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}
