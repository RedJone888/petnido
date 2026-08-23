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
      const petIds = routine.petIds.filter((petId) => groupSet.has(petId));
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
        ? row.label
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
                <div>
                  <h4 className="font-bold text-[#35243f]">{groupPets[0] ? displayPetType(groupPets[0]) : group.label}</h4>
                  <div className="mt-1 flex flex-wrap gap-1.5">{groupPets.map((pet) => <span key={pet.id} className="inline-flex items-center gap-1 rounded-full bg-[#f7f2fa] px-2 py-1 text-[11px] font-semibold text-[#625a68]"><span className="h-5 w-5 overflow-hidden rounded-full"><PetDraftAvatar pet={pet} /></span>{pet.name || displayPetType(pet)}</span>)}</div>
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
                                  <span className="shrink-0 rounded-full bg-[#f4ecfa] px-2 py-1 font-semibold text-[var(--primary)]">{frequencyLabel(row.frequency)}</span>
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
                <div className="hidden overflow-x-auto rounded-xl border border-[#e6ddea] md:block">
                  <table className="w-full min-w-[760px] table-auto border-collapse text-xs">
                    <thead className="bg-[var(--primary-fixed)] text-[var(--on-primary-fixed-variant)]"><tr><th className="px-3 py-2.5 text-left">{taskCopy.petGroupColumn}</th><th className="w-14 px-3 py-2.5 text-center">{taskCopy.index}</th><th className="px-3 py-2.5 text-left">{taskCopy.taskColumn}</th><th className="px-3 py-2.5 text-center">{taskCopy.frequency}</th><th className="px-3 py-2.5 text-left">{taskCopy.notesColumn}</th></tr></thead>
                    <tbody className="divide-y divide-[#eee9ef]">
                      {assignmentGroups.flatMap((assignmentGroup) => {
                        const rowPets = assignmentGroup.petIds.flatMap((petId) => {
                          const pet = pets.find((candidate) => candidate.id === petId);
                          return pet ? [pet] : [];
                        });
                        return assignmentGroup.items.map((row, index) => {
                          const absoluteIndex = rows.findIndex((candidate) => candidate.id === row.id) + 1;
                          const TaskIcon = localizedOptions.find((option) => option.id === row.templateId)?.icon ?? PiSparkle;
                          return <tr key={fingerprint(row)}>{index === 0 ? <td rowSpan={assignmentGroup.items.length} className="px-3 py-3 align-middle"><div className="flex flex-wrap gap-1.5">{rowPets.map((pet) => <span key={pet.id} className="inline-flex items-center gap-1.5 rounded-lg border border-[#ded9e0] px-2 py-1.5 font-semibold"><span className="h-5 w-5 overflow-hidden rounded-full"><PetDraftAvatar pet={pet} /></span>{pet.name || displayPetType(pet)}</span>)}</div></td> : null}<td className="px-3 py-3 text-center font-bold text-[var(--primary)]">{absoluteIndex}</td><td className="px-3 py-3 font-semibold"><span className="inline-flex items-center gap-2"><TaskIcon size={16} className="text-[#8a5d34]" />{localizeTaskLabel(row.label, lang, { templateId: row.templateId, custom: row.custom })}</span></td><td className="px-3 py-3 text-center"><span className="rounded-full bg-[#f4ecfa] px-2 py-1 font-semibold text-[var(--primary)]">{frequencyLabel(row.frequency)}</span></td><td className="max-w-[300px] break-words px-3 py-3 text-[#706a78]">{row.notes || "—"}</td></tr>;
                        });
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
        <ModalShell title={`${taskCopy.configureTask} · ${editingGroup.label}`} closeLabel={copy.cancel} cancelLabel={copy.cancel} saveLabel={taskCopy.save} onClose={closeEditor} onCancel={closeEditor} onSave={saveEditor} panelClassName="max-h-[80dvh] max-w-[1180px] rounded-[20px] border-[#d8c9e3] bg-white" bodyClassName="bg-white md:px-6">
          <div ref={tableRef} className="overflow-y-auto overflow-x-hidden rounded-[14px] border border-[var(--primary-border)] bg-white md:max-h-[450px] md:overflow-auto">
            <table className="block w-full border-collapse text-xs md:table md:min-w-[1000px] md:table-fixed">
              <thead className="sticky top-0 z-10 hidden bg-[var(--primary-fixed)] text-[var(--on-primary-fixed-variant)] md:table-header-group"><tr><th className="w-[22%] px-3 py-2.5">{taskCopy.whoNeeds}</th><th className="w-[25%] px-3 py-2.5">{taskCopy.taskName}</th><th className="w-[20%] px-3 py-2.5">{taskCopy.frequency}</th><th className="w-[22%] px-3 py-2.5">{taskCopy.notesColumn}</th><th className="w-[11%] px-3 py-2.5">{taskCopy.actionsColumn}</th></tr></thead>
              <tbody className="block space-y-3 bg-[#f7f3fa] p-2 md:table-row-group md:space-y-0 md:bg-transparent md:p-0">
                {modalRows.map((row, index) => (
                  <tr key={row.id} className="block rounded-xl border border-[#e6ddea] bg-white p-3 md:table-row md:rounded-none md:border-0 md:p-0">
                    <td className="block py-2 align-top md:table-cell md:px-3 md:py-3"><div className="mb-3 flex items-center gap-2 border-b border-[#eee9ef] pb-2 md:hidden"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-[11px] font-bold text-white">{index + 1}</span><span className="text-xs font-bold text-[#514956]">{taskCopy.task} {index + 1}</span></div><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a5d34] md:hidden">{taskCopy.whoNeeds}</span><div className="flex flex-wrap gap-1.5">{editingGroup.petIds.flatMap((petId) => { const pet = pets.find((candidate) => candidate.id === petId); return pet ? [pet] : []; }).map((pet) => { const selected = row.petIds.includes(pet.id); return <button key={pet.id} type="button" aria-pressed={selected} onClick={() => updateRow(row.id, { petIds: selected ? row.petIds.filter((id) => id !== pet.id) : [...row.petIds, pet.id] })} className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold", selected ? "border-[var(--primary)] bg-[var(--primary-fixed)] text-[var(--primary)]" : "border-[#ded9e0] text-[#817a85]")}><span className="h-5 w-5 overflow-hidden rounded-full"><PetDraftAvatar pet={pet} /></span>{pet.name || displayPetType(pet)}{selected ? <PiCheck size={12} /> : null}</button>; })}</div>{rowErrors[row.id]?.pets ? <p className="mt-1.5 text-[11px] font-semibold text-danger-text">{rowErrors[row.id]?.pets}</p> : null}</td>
                    <td className="block py-2 align-top md:table-cell md:px-3 md:py-3"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a5d34] md:hidden">{taskCopy.taskName}</span><VisitTaskNameCombobox ariaLabel={`${taskCopy.taskName} ${index + 1}`} value={row.templateId} customValue={row.customLabel} customValueKey={customTaskId} options={comboboxOptions} placeholder={taskCopy.taskNamePlaceholder} autoFocus={focusRowId === row.id} error={rowErrors[row.id]?.name} errorId={`boarding-task-error-${row.id}`} onChange={(next) => updateRow(row.id, { templateId: next.value, customLabel: next.customValue, custom: next.value === customTaskId })} /></td>
                    <td className="block py-2 align-top md:table-cell md:px-3 md:py-3"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a5d34] md:hidden">{taskCopy.frequency}</span><VisitSelect ariaLabel={`${taskCopy.frequency} ${index + 1}`} value={row.frequency} options={frequencyOptions} onChange={(next) => updateRow(row.id, { frequency: next as BoardingScheduleType })} /></td>
                    <td className="block py-2 align-top md:table-cell md:px-3 md:py-3"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a5d34] md:hidden">{taskCopy.notesColumn}</span><input value={row.notes} title={row.notes} onChange={(event) => updateRow(row.id, { notes: event.target.value })} className={cn(inputClass, "h-10 w-full rounded-lg px-3 text-xs")} placeholder={taskCopy.notesPlaceholder} /></td>
                    <td className="block pt-2 align-top md:table-cell md:px-2 md:py-3"><div className="flex justify-end gap-1 md:justify-center"><button type="button" disabled={index === 0} onClick={() => moveRow(row.id, -1)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--primary-fixed)] disabled:opacity-30"><PiCaretUp size={16} /></button><button type="button" disabled={index === modalRows.length - 1} onClick={() => moveRow(row.id, 1)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--primary-fixed)] disabled:opacity-30"><PiCaretDown size={16} /></button><button type="button" disabled={modalRows.length === 1} onClick={() => setModalRows((current) => current.filter((candidate) => candidate.id !== row.id))} className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-bg text-danger-text disabled:cursor-not-allowed disabled:opacity-30"><PiTrash size={15} /></button></div></td>
                  </tr>
                ))}
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
