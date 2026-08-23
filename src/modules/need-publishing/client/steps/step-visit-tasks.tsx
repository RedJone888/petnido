"use client";

import { useEffect, useRef, useState } from "react";
import type { IconType } from "react-icons";
import {
  PiCaretDown,
  PiCaretUp,
  PiCheck,
  PiCopy,
  PiFlag,
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
  CareType,
  PetDraft,
  TaskPlan,
} from "@/domain/publishing/legacy-need-draft-v3";
import { homeVisitTaskFingerprint } from "@/modules/need-publishing/domain/task-fingerprint";
import {
  localizeTaskLabel,
  taskPersistenceLabel,
} from "@/modules/need-publishing/domain/task-catalog";
import {
  replaceVisitRows,
  rowsForVisit,
  type VisitTaskEditRow,
} from "../visit-task-order";
import cn from "@/lib/cn";
import { VisitTaskNameCombobox } from "../components/controls/visit-task-combobox";
import {
  Field,
  groupTaskRowsByPetGroup,
  inputClass,
  petDisplayType,
  PetDraftAvatar,
  TaskPriorityButtons,
  textareaClass,
  visitTimeLabel,
  type PetTaskState,
} from "../guided-need-flow-shared";
import { PublishingValidationAlert } from "../components/publishing-validation-alert";
import { visitTaskRequiredMessage } from "../validation-copy";

const customTaskId = "__custom-visit-task__";

type VisitRow = VisitTaskEditRow;

type RowError = { pets?: string; name?: string };

function rowFingerprint(
  row: Pick<
    VisitRow,
    "petIds" | "templateId" | "custom" | "label" | "priority" | "notes"
  >,
) {
  return homeVisitTaskFingerprint({
    assignmentPetKeys: row.petIds,
    taskName: row.label,
    taskCode: row.custom ? null : row.templateId,
    custom: row.custom,
    priority: row.priority,
    notes: row.notes,
  });
}

export function StepVisitTasks({
  options,
  pets,
  value,
  onChange,
  notes,
  onNotesChange,
  careType: _careType,
  visitsPerDay,
  visitTimes,
  exactTimes,
  showValidation,
}: {
  options: Array<{ id: string; label: string; icon: IconType }>;
  pets: PetDraft[];
  value: TaskPlan[];
  onChange: (value: TaskPlan[]) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  careType: CareType;
  visitsPerDay: number;
  visitTimes: string[];
  exactTimes: string[];
  showValidation: boolean;
}) {
  const { lang, t } = useLanguage();
  const needMessages = useNeedPublishingMessages();
  const copy = needMessages.needPublishingTaskForm;
  const visitNumbers = Array.from(
    { length: Math.max(1, visitsPerDay) },
    (_, index) => index + 1,
  );
  const localizedOptions = options.map((option) => ({
    ...option,
    label:
      needMessages.needPublishing.taskLabels[
        option.id as keyof typeof needMessages.needPublishing.taskLabels
      ] ?? option.label,
  }));
  const displayPetType = (pet: PetDraft) => petDisplayType(pet, lang);
  const [editingVisit, setEditingVisit] = useState<number | null>(null);
  const [modalRows, setModalRows] = useState<VisitRow[]>([]);
  const [rowErrors, setRowErrors] = useState<Record<string, RowError>>({});
  const [focusRowId, setFocusRowId] = useState<string | null>(null);
  const [copyTargetVisit, setCopyTargetVisit] = useState<number | null>(null);
  const taskTableRef = useRef<HTMLDivElement | null>(null);

  const taskName = (row: VisitRow) =>
    row.templateId === customTaskId
      ? row.customLabel.trim()
      : (localizedOptions.find((option) => option.id === row.templateId)?.label ??
        row.label);

  const createRow = (): VisitRow => ({
    id: crypto.randomUUID(),
    petIds: pets.map((pet) => pet.id),
    templateId: "",
    customLabel: "",
    label: "",
    custom: false,
    priority: "must",
    notes: "",
  });

  const openEditor = (visit: number) => {
    const rows = rowsForVisit(value, visit, lang);
    setEditingVisit(visit);
    setModalRows(rows.length ? rows : [createRow()]);
    setRowErrors({});
  };

  const closeEditor = () => {
    setEditingVisit(null);
    setModalRows([]);
    setRowErrors({});
  };

  const updateRow = (rowId: string, patch: Partial<VisitRow>) => {
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
    if (!focusRowId || editingVisit === null) return;
    const frame = requestAnimationFrame(() => {
      taskTableRef.current?.scrollTo({
        top: taskTableRef.current.scrollHeight,
        behavior: "smooth",
      });
      requestAnimationFrame(() => setFocusRowId(null));
    });
    return () => cancelAnimationFrame(frame);
  }, [editingVisit, focusRowId, modalRows]);

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
    if (editingVisit === null) return;
    const normalizedRows = modalRows.map((row) => ({
      ...row,
      label: row.templateId === customTaskId
        ? row.customLabel.trim()
        : taskPersistenceLabel({
            code: row.templateId,
            label: taskName(row),
            custom: false,
          }),
      custom: row.templateId === customTaskId,
    }));
    const counts = new Map<string, number>();
    normalizedRows.forEach((row) => {
      const fingerprint = rowFingerprint(row);
      counts.set(fingerprint, (counts.get(fingerprint) ?? 0) + 1);
    });
    const errors = Object.fromEntries(
      normalizedRows.flatMap((row) => {
        const error: RowError = {};
        if (!row.petIds.length) error.pets = copy.validationPetRequired;
        if (!row.label) error.name = copy.validationTaskNameRequired;
        else if ((counts.get(rowFingerprint(row)) ?? 0) > 1) {
          error.name = copy.validationDuplicateTaskName;
        }
        return Object.keys(error).length ? [[row.id, error]] : [];
      }),
    );
    setRowErrors(errors);
    // An empty visit is allowed to be saved temporarily so a task can be
    // removed from just this visit. The surrounding validation then points
    // back to the missing visit before publish, and replaceVisitRows removes
    // only this visit from shared task entities.
    if (Object.keys(errors).length || !normalizedRows.length) return;
    onChange(replaceVisitRows(value, editingVisit, normalizedRows));
    closeEditor();
  };

  const copyVisit = (sourceVisit: number, targetVisit: number) => {
    const source = rowsForVisit(value, sourceVisit, lang);
    const target = rowsForVisit(value, targetVisit, lang);
    const fingerprints = new Set(target.map(rowFingerprint));
    const additions = source.filter((row) => !fingerprints.has(rowFingerprint(row)));
    onChange(replaceVisitRows(value, targetVisit, [...target, ...additions]));
    setCopyTargetVisit(null);
  };

  const petsWithoutTasks = pets.filter(
    (pet) => !value.some((task) => task.petIds.includes(pet.id)),
  );
  const comboboxOptions = localizedOptions.map((option) => ({
    value: option.id,
    label: option.label,
    icon: option.icon,
  }));

  return (
    <div className="space-y-6">
      <section className="space-y-5">
        <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">{copy.careTasks}</h3>
        {visitNumbers.map((visit, visitIndex) => {
          const rows = rowsForVisit(value, visit, lang);
          const displayRows = rows.map((row, order) => ({
            petIds: row.petIds,
            state: {
              name: localizeTaskLabel(row.label, lang, {
                templateId: row.templateId,
                custom: row.custom,
              }),
              templateId: row.custom ? row.customLabel : row.templateId,
              custom: row.custom,
              priority: row.priority,
              notes: row.notes,
              order,
              representativeTaskId: row.id,
            } satisfies PetTaskState,
          }));
          const groups = groupTaskRowsByPetGroup(displayRows);
          const visitName = needMessages.needPublishing.visitSchedule.visit.replace(
            "{n}",
            String(visit),
          );
          return (
            <article key={visit} className="rounded-2xl border border-[var(--primary-border)] bg-white p-4">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-[#35243f]">{visitName}</h4>
                  <p className="mt-0.5 text-xs text-[#817a85]">{visitTimeLabel(visitTimes[visitIndex], exactTimes[visitIndex])}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {visitNumbers.some(
                    (candidate) =>
                      candidate !== visit &&
                      rowsForVisit(value, candidate, lang).length,
                  ) ? (
                    <div className="relative">
                      <button type="button" onClick={() => setCopyTargetVisit(copyTargetVisit === visit ? null : visit)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#d8c9e3] px-3 text-xs font-bold text-[var(--primary)] hover:bg-[var(--primary-fixed)]">
                        <PiCopy size={15} /> {needMessages.needPublishingClient.visitTasks.copyFromVisit}
                      </button>
                      {copyTargetVisit === visit ? (
                        <div className="absolute right-0 top-11 z-20 min-w-48 rounded-xl border border-[#d8c9e3] bg-white p-1.5 shadow-xl">
                          {visitNumbers
                            .filter(
                              (candidate) =>
                                candidate !== visit &&
                                rowsForVisit(value, candidate, lang).length,
                            )
                            .map((candidate) => (
                            <button key={candidate} type="button" onClick={() => copyVisit(candidate, visit)} className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#514956] hover:bg-[var(--primary-fixed)]">
                              {needMessages.needPublishing.visitSchedule.visit.replace("{n}", String(candidate))}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <button type="button" onClick={() => openEditor(visit)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--primary)] px-3 text-xs font-bold text-white hover:opacity-90">
                    {rows.length ? <PiPencilSimple size={15} /> : <PiPlus size={15} />}
                    {rows.length ? copy.edit : copy.addTask}
                  </button>
                </div>
              </div>
              {rows.length ? (
                <>
                <div className="space-y-3 md:hidden">
                  {groups.map((group, groupIndex) => {
                    const groupPets = group.petIds.flatMap((petId) => {
                      const pet = pets.find((candidate) => candidate.id === petId);
                      return pet ? [pet] : [];
                    });
                    return (
                      <section key={`${visit}-${groupIndex}-${group.petIds.join("-")}`} className="overflow-hidden rounded-xl border border-[#e6ddea] bg-white">
                        <div className="flex flex-wrap gap-2 bg-[var(--primary-fixed)] px-3 py-2.5">
                          {groupPets.map((pet) => (
                            <span key={pet.id} className="inline-flex items-center gap-1.5 rounded-lg border border-[#dcd3e3] bg-white px-2 py-1.5 text-xs font-semibold">
                              <span className="h-6 w-6 overflow-hidden rounded-full"><PetDraftAvatar pet={pet} /></span>
                              {pet.name || displayPetType(pet)}
                            </span>
                          ))}
                        </div>
                        <div className="divide-y divide-[#eee9ef]">
                          {group.items.map(({ state }) => {
                            const TaskIcon = localizedOptions.find((option) => option.id === state.templateId)?.icon ?? PiSparkle;
                            return (
                              <div key={state.representativeTaskId} className="space-y-2 px-3 py-3 text-xs">
                                <div className="grid grid-cols-[20px_16px_minmax(0,1fr)_auto] items-center gap-2">
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f4ecfa] font-bold text-[var(--primary)]">{state.order + 1}</span>
                                  <TaskIcon size={16} className="text-[#8a5d34]" />
                                  <span className="min-w-0 break-words font-semibold [overflow-wrap:anywhere]">{state.name}</span>
                                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f4ecfa] px-2 py-1 font-semibold text-[var(--primary)]"><PiFlag size={13} />{state.priority === "must" ? copy.mustDo : copy.ifTime}</span>
                                </div>
                                {state.notes ? <p className="break-words pl-[52px] text-[#706a78] [overflow-wrap:anywhere]">{state.notes}</p> : null}
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
                    <thead className="bg-[var(--primary-fixed)] text-[var(--on-primary-fixed-variant)]">
                      <tr>
                        <th className="px-3 py-2.5 text-left">{copy.whoNeeds}</th>
                        <th className="w-14 px-3 py-2.5 text-center">{copy.index}</th>
                        <th className="px-3 py-2.5 text-left">{copy.task}</th>
                        <th className="px-3 py-2.5 text-center">{copy.priority}</th>
                        <th className="px-3 py-2.5 text-left">{copy.notes}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eee9ef]">
                      {groups.flatMap((group) => {
                        const groupPets = group.petIds.flatMap((petId) => {
                          const pet = pets.find((candidate) => candidate.id === petId);
                          return pet ? [pet] : [];
                        });
                        return group.items.map(({ state }, index) => {
                          const TaskIcon = localizedOptions.find((option) => option.id === state.templateId)?.icon ?? PiSparkle;
                          return (
                            <tr key={`${visit}-${state.representativeTaskId}`}>
                              {index === 0 ? (
                                <td rowSpan={group.items.length} className="px-3 py-3 align-middle">
                                  <div className="flex flex-wrap gap-2">
                                    {groupPets.map((pet) => (
                                      <span key={pet.id} className="inline-flex items-center gap-1.5 rounded-lg border border-[#dcd3e3] px-2 py-1.5 font-semibold">
                                        <span className="h-6 w-6 overflow-hidden rounded-full"><PetDraftAvatar pet={pet} /></span>
                                        {pet.name || displayPetType(pet)}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                              ) : null}
                              <td className="px-3 py-3 text-center font-bold text-[var(--primary)]">{state.order + 1}</td>
                              <td className="px-3 py-3"><span className="inline-flex items-center gap-2 font-semibold"><TaskIcon size={16} className="text-[#8a5d34]" />{state.name}</span></td>
                              <td className="px-3 py-3 text-center"><span className="inline-flex items-center gap-1 rounded-full bg-[#f4ecfa] px-2 py-1 font-semibold text-[var(--primary)]"><PiFlag size={13} />{state.priority === "must" ? copy.mustDo : copy.ifTime}</span></td>
                              <td className="max-w-[300px] break-words px-3 py-3 text-[#706a78]">{state.notes || "—"}</td>
                            </tr>
                          );
                        });
                      })}
                    </tbody>
                  </table>
                </div>
                </>
              ) : showValidation ? (
                <PublishingValidationAlert className="w-full">
                  {visitTaskRequiredMessage(lang, visit)}
                </PublishingValidationAlert>
              ) : (
                <p className="rounded-xl border border-dashed border-[#ded9e0] px-4 py-4 text-sm text-[#9a939f]">{copy.noTasksYet}</p>
              )}
            </article>
          );
        })}
        {showValidation && petsWithoutTasks.length ? (
          <PublishingValidationAlert className="w-fit">
            {copy.validationPets.replace("{pets}", petsWithoutTasks.map((pet) => pet.name || displayPetType(pet)).join(", "))}
          </PublishingValidationAlert>
        ) : null}
      </section>

      <Field label={copy.additionalNotes} optional hint={copy.additionalHint} hintInline hintInlineRight>
        <textarea value={notes} onChange={(event) => onNotesChange(event.target.value)} className={textareaClass} placeholder={copy.additionalPlaceholder} />
      </Field>

      {editingVisit !== null ? (
        <ModalShell
          title={`${copy.configureTask} · ${needMessages.needPublishing.visitSchedule.visit.replace("{n}", String(editingVisit))}`}
          closeLabel={copy.cancel}
          cancelLabel={copy.cancel}
          saveLabel={copy.save}
          onClose={closeEditor}
          onCancel={closeEditor}
          onSave={saveEditor}
          panelClassName="max-h-[80dvh] max-w-[1180px] rounded-[20px] border-[#d8c9e3] bg-white"
          bodyClassName="bg-white md:px-6"
        >
          <div ref={taskTableRef} className="overflow-y-auto overflow-x-hidden rounded-[14px] border border-[var(--primary-border)] bg-white md:max-h-[450px] md:overflow-auto">
            <table className="block w-full border-collapse text-left text-xs md:table md:min-w-[1080px] md:table-fixed">
              <thead className="sticky top-0 z-10 hidden bg-[var(--primary-fixed)] text-[var(--on-primary-fixed-variant)] md:table-header-group">
                <tr>
                  <th className="w-[27%] px-3 py-2.5 text-center">{copy.whoNeeds}</th>
                  <th className="w-[27%] px-3 py-2.5 text-center">{copy.taskName}</th>
                  <th className="w-[16%] px-3 py-2.5 text-center">{copy.priority}</th>
                  <th className="w-[18%] px-3 py-2.5 text-center">{copy.notes}</th>
                  <th className="w-[12%] px-3 py-2.5 text-center">{copy.actions}</th>
                </tr>
              </thead>
              <tbody className="block space-y-3 bg-[#f7f3fa] p-2 md:table-row-group md:space-y-0 md:bg-transparent md:p-0">
                {modalRows.map((row, index) => (
                  <tr key={row.id} className="block rounded-xl border border-[#e6ddea] bg-white p-3 md:table-row md:rounded-none md:border-0 md:p-0">
                    <td className="block py-2 align-top md:table-cell md:px-3 md:py-3">
                      <div className="mb-3 flex items-center gap-2 border-b border-[#eee9ef] pb-2 md:hidden">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-[11px] font-bold text-white">{index + 1}</span>
                        <span className="text-xs font-bold text-[#514956]">{copy.task} {index + 1}</span>
                      </div>
                      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a5d34] md:hidden">{copy.whoNeeds}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {pets.map((pet) => {
                          const selected = row.petIds.includes(pet.id);
                          return (
                            <button key={pet.id} type="button" aria-pressed={selected} onClick={() => updateRow(row.id, { petIds: selected ? row.petIds.filter((id) => id !== pet.id) : [...row.petIds, pet.id] })} className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold", selected ? "border-[var(--primary)] bg-[var(--primary-fixed)] text-[var(--primary)]" : "border-[#ded9e0] text-[#817a85]")}>
                              <span className="h-5 w-5 overflow-hidden rounded-full"><PetDraftAvatar pet={pet} /></span><span className="max-w-20 truncate">{pet.name || displayPetType(pet)}</span>{selected ? <PiCheck size={12} /> : null}
                            </button>
                          );
                        })}
                      </div>
                      {rowErrors[row.id]?.pets ? <p className="mt-1.5 text-[11px] font-semibold text-danger-text">{rowErrors[row.id]?.pets}</p> : null}
                    </td>
                    <td className="block py-2 align-top md:table-cell md:px-3 md:py-3">
                      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a5d34] md:hidden">{copy.taskName}</span>
                      <VisitTaskNameCombobox ariaLabel={`${copy.taskName} ${index + 1}`} value={row.templateId} customValue={row.customLabel} customValueKey={customTaskId} options={comboboxOptions} placeholder={copy.taskNamePlaceholder} autoFocus={focusRowId === row.id} error={rowErrors[row.id]?.name} errorId={`visit-task-error-${row.id}`} onChange={(next) => updateRow(row.id, { templateId: next.value, customLabel: next.customValue, custom: next.value === customTaskId })} />
                    </td>
                    <td className="block py-2 align-top md:table-cell md:px-3 md:py-3"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a5d34] md:hidden">{copy.priority}</span><TaskPriorityButtons value={row.priority} mustLabel={copy.mustDo} ifTimeLabel={copy.ifTime} onChange={(priority) => updateRow(row.id, { priority })} /></td>
                    <td className="block py-2 align-top md:table-cell md:px-3 md:py-3"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a5d34] md:hidden">{copy.notes}</span><input value={row.notes} onChange={(event) => updateRow(row.id, { notes: event.target.value })} className={cn(inputClass, "h-10 w-full rounded-lg px-3 text-xs")} placeholder={copy.taskNotesPlaceholder} /></td>
                    <td className="block pt-2 align-top md:table-cell md:px-2 md:py-3">
                      <div className="flex justify-end gap-1 md:justify-center">
                        <button type="button" disabled={index === 0} onClick={() => moveRow(row.id, -1)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--primary-fixed)] disabled:opacity-30"><PiCaretUp size={16} /></button>
                        <button type="button" disabled={index === modalRows.length - 1} onClick={() => moveRow(row.id, 1)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--primary-fixed)] disabled:opacity-30"><PiCaretDown size={16} /></button>
                        <button type="button" disabled={modalRows.length === 1} onClick={() => setModalRows((current) => current.filter((candidate) => candidate.id !== row.id))} className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-bg text-danger-text disabled:cursor-not-allowed disabled:opacity-30"><PiTrash size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" onClick={addRow} className="inline-flex h-9 items-center gap-2 rounded-full border border-dashed border-[var(--primary-border)] bg-[var(--primary-subtle)] px-3 text-xs font-bold text-[var(--primary)]"><PiPlus size={15} />{copy.addTask}</button>
            {!modalRows.length ? <p className="text-xs font-semibold text-danger-text">{copy.validationNoTask}</p> : null}
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}
