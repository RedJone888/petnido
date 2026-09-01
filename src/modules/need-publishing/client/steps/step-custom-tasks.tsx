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
  PetDraft,
  TaskPlan,
} from "@/domain/publishing/legacy-need-draft-v3";
import { customTaskFingerprint } from "@/modules/need-publishing/domain/task-fingerprint";
import {
  localizeTaskLabel,
  taskPersistenceLabel,
} from "@/modules/need-publishing/domain/task-catalog";
import cn from "@/lib/cn";
import { VisitTaskNameCombobox } from "../components/controls/visit-task-combobox";
import {
  Field,
  groupTaskRowsByPetGroup,
  inputClass,
  petDisplayType,
  PetDraftAvatar,
  textareaClass,
  type PetTaskState,
} from "../guided-need-flow-shared";
import { PublishingValidationAlert } from "../components/publishing-validation-alert";

const customTaskId = "__custom-task__";

type CustomTaskModalRow = {
  id: string;
  petIds: string[];
  templateId: string;
  customLabel: string;
  notes: string;
};

type RowError = { pets?: string; name?: string };

function customTaskRows(tasks: TaskPlan[], lang: "en" | "zh" | "ja") {
  const rows = new Map<string, { petIds: string[]; state: PetTaskState }>();
  [...tasks]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .forEach((task) => {
      const key = customTaskFingerprint({
        assignmentPetKeys: task.petIds,
        taskName: task.label,
        taskCode: task.custom ? null : task.templateId,
        custom: task.custom,
        notes: task.notes,
      });
      const existing = rows.get(key);
      if (existing) {
        task.petIds.forEach((petId) => {
          if (!existing.petIds.includes(petId)) existing.petIds.push(petId);
        });
        return;
      }
      rows.set(key, {
        petIds: [...task.petIds],
        state: {
          name: localizeTaskLabel(task.label, lang, {
            templateId: task.templateId,
            custom: task.custom,
          }),
          templateId: task.templateId,
          custom: task.custom,
          priority: task.priority,
          notes: task.notes ?? "",
          order: task.order ?? 0,
          representativeTaskId: task.id,
        },
      });
    });
  return Array.from(rows.values());
}

export function StepCustomTasks({
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
  value: TaskPlan[];
  onChange: (value: TaskPlan[]) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  showValidation: boolean;
}) {
  const { lang, t } = useLanguage();
  const needMessages = useNeedPublishingMessages();
  const copy = needMessages.needPublishingTaskForm;
  const localizedOptions = options.map((option) => ({
    ...option,
    label:
      needMessages.needPublishing.taskLabels[
        option.id as keyof typeof needMessages.needPublishing.taskLabels
      ] ?? option.label,
  }));
  const localizedPetDisplayType = (pet: PetDraft) => petDisplayType(pet, lang);
  const taskRows = customTaskRows(value, lang);
  const groupedRows = groupTaskRowsByPetGroup(taskRows);
  const allPetIds = pets.map((pet) => pet.id);
  const [modalRows, setModalRows] = useState<CustomTaskModalRow[] | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, RowError>>({});
  const [focusRowId, setFocusRowId] = useState<string | null>(null);
  const taskTableRef = useRef<HTMLDivElement | null>(null);

  const createRow = (): CustomTaskModalRow => ({
    id: crypto.randomUUID(),
    petIds: [...allPetIds],
    templateId: "",
    customLabel: "",
    notes: "",
  });

  const openEditor = () => {
    setModalRows(
      taskRows.length
        ? taskRows.map(({ petIds, state }) => ({
            id: crypto.randomUUID(),
            petIds: [...petIds],
            templateId: state.custom ? customTaskId : state.templateId,
            customLabel: state.custom ? state.name : "",
            notes: state.notes,
          }))
        : [createRow()],
    );
    setRowErrors({});
  };

  const closeEditor = () => {
    setModalRows(null);
    setRowErrors({});
  };

  const updateRow = (rowId: string, patch: Partial<CustomTaskModalRow>) => {
    setRowErrors((current) => {
      const next = { ...current };
      delete next[rowId];
      return next;
    });
    setModalRows((current) =>
      current?.map((row) =>
        row.id === rowId ? { ...row, ...patch } : row,
      ) ?? null,
    );
  };

  const addRow = () => {
    const row = createRow();
    setModalRows((current) => (current ? [...current, row] : [row]));
    setFocusRowId(row.id);
  };

  useEffect(() => {
    if (!focusRowId || !modalRows) return;
    const frame = requestAnimationFrame(() => {
      taskTableRef.current?.scrollTo({
        top: taskTableRef.current.scrollHeight,
        behavior: "smooth",
      });
      requestAnimationFrame(() => setFocusRowId(null));
    });
    return () => cancelAnimationFrame(frame);
  }, [focusRowId, modalRows]);

  const removeRow = (rowId: string) =>
    setModalRows((current) =>
      current?.filter((row) => row.id !== rowId) ?? null,
    );

  const moveRow = (rowId: string, direction: -1 | 1) =>
    setModalRows((current) => {
      if (!current) return current;
      const rows = [...current];
      const index = rows.findIndex((row) => row.id === rowId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= rows.length) return current;
      [rows[index], rows[target]] = [rows[target], rows[index]];
      return rows;
    });

  const taskName = (row: CustomTaskModalRow) => {
    if (row.templateId === customTaskId) return row.customLabel.trim();
    return (
      localizedOptions.find((option) => option.id === row.templateId)?.label ??
      ""
    );
  };

  const saveEditor = () => {
    if (!modalRows) return;
    const fingerprints = modalRows.map((row) =>
      customTaskFingerprint({
        assignmentPetKeys: row.petIds,
        taskName: taskName(row),
        taskCode: row.templateId,
        custom: row.templateId === customTaskId,
        notes: row.notes,
      }),
    );
    const counts = new Map<string, number>();
    fingerprints.forEach((fingerprint) => {
      if (fingerprint) {
        counts.set(fingerprint, (counts.get(fingerprint) ?? 0) + 1);
      }
    });
    const errors = Object.fromEntries(
      modalRows.flatMap((row, index) => {
        const error: RowError = {};
        if (!row.petIds.length) error.pets = copy.validationPetRequired;
        if (!taskName(row)) error.name = copy.validationTaskNameRequired;
        else if ((counts.get(fingerprints[index]) ?? 0) > 1) {
          error.name = copy.validationDuplicateTaskName;
        }
        return Object.keys(error).length ? [[row.id, error]] : [];
      }),
    );
    setRowErrors(errors);
    if (Object.keys(errors).length || !modalRows.length) return;

    onChange(
      modalRows.map((row, order) => {
        const custom = row.templateId === customTaskId;
        return {
          id: `custom-task-${crypto.randomUUID()}`,
          templateId: custom
            ? `custom-${crypto.randomUUID()}`
            : row.templateId,
          label: custom
            ? taskName(row)
            : taskPersistenceLabel({
                code: row.templateId,
                label: taskName(row),
                custom: false,
              }),
          priority: "must",
          petIds: [...row.petIds],
          visitNumbers: [],
          custom,
          notes: row.notes.trim() || undefined,
          order,
        } satisfies TaskPlan;
      }),
    );
    closeEditor();
  };

  const petsWithoutTasks = pets.filter(
    (pet) => !value.some((task) => task.petIds.includes(pet.id)),
  );
  const petsWithoutTasksMessage = petsWithoutTasks.length
    ? copy.validationPets.replace(
        "{pets}",
        petsWithoutTasks
          .map((pet) =>
            copy.petGroupPrefix.replace(
              "{name}",
              pet.name || localizedPetDisplayType(pet),
            ),
          )
          .join(", "),
      )
    : "";
  const comboboxOptions = localizedOptions.map((option) => ({
    value: option.id,
    label: option.label,
    icon: option.icon,
  }));

  return (
    <div className="space-y-5">
      <section className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
          {copy.careTasks}
        </h3>
        {taskRows.length ? (
          <div className="w-full md:w-fit md:max-w-full">
            <p className="mb-1.5 text-right text-[11px] font-medium text-[#817a85]">
              {copy.tasksCount.replace("{n}", String(taskRows.length))}
            </p>
            <div className="space-y-3 md:hidden">
              {groupedRows.map((group, groupIndex) => {
                const targetPets = group.petIds.flatMap((petId) => {
                  const pet = pets.find((candidate) => candidate.id === petId);
                  return pet ? [pet] : [];
                });
                return (
                  <section key={`${groupIndex}-${group.petIds.join("-")}`} className="overflow-hidden rounded-xl border border-[var(--primary-border)] bg-white">
                    <div className="flex flex-wrap gap-2 bg-[var(--primary-fixed)] px-3 py-2.5">
                      {targetPets.map((pet) => (
                        <span key={pet.id} className="inline-flex items-center gap-1.5 rounded-lg border border-[#dcd3e3] bg-white px-2 py-1.5 text-xs font-semibold">
                          <span className="h-6 w-6 overflow-hidden rounded-full"><PetDraftAvatar pet={pet} /></span>
                          {pet.name || localizedPetDisplayType(pet)}
                        </span>
                      ))}
                    </div>
                    <div className="divide-y divide-[#eee9ef]">
                      {group.items.map(({ state }) => {
                        const TaskIcon = localizedOptions.find((option) => option.id === state.templateId)?.icon ?? PiSparkle;
                        return (
                          <div key={state.representativeTaskId} className="space-y-1.5 px-3 py-3 text-xs">
                            <div className="grid grid-cols-[20px_16px_minmax(0,1fr)] items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f4ecfa] font-bold text-[var(--primary)]">{state.order + 1}</span>
                              <TaskIcon size={16} className="text-[#8a5d34]" />
                              <span className="min-w-0 break-words font-semibold [overflow-wrap:anywhere]">{state.name}</span>
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
            <div className="hidden max-w-full overflow-x-auto rounded-[15px] border border-[var(--primary-border)] bg-white md:block">
              <table className="min-w-[650px] table-auto border-collapse text-left text-xs">
                <thead className="border-b border-[var(--outline-variant)] bg-[var(--primary-fixed)] text-[11px] font-semibold text-[var(--on-primary-fixed-variant)]">
                  <tr>
                    <th className="max-w-[280px] px-3 py-2.5 text-center">{copy.whoNeeds}</th>
                    <th className="w-14 px-3 py-2.5 text-center">{copy.index}</th>
                    <th className="max-w-[320px] px-3 py-2.5 text-center">{copy.task}</th>
                    <th className="max-w-[320px] px-3 py-2.5 text-center">{copy.notes}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee9ef]">
                  {groupedRows.flatMap((group) => {
                    const targetPets = group.petIds.flatMap((petId) => {
                      const pet = pets.find((candidate) => candidate.id === petId);
                      return pet ? [pet] : [];
                    });
                    return group.items.map(({ state }, index) => {
                      const TaskIcon =
                        localizedOptions.find(
                          (option) => option.id === state.templateId,
                        )?.icon ?? PiSparkle;
                      return (
                        <tr key={state.representativeTaskId} className="text-[#514956]">
                          {index === 0 ? (
                            <td rowSpan={group.items.length} className="max-w-[280px] px-3 py-3 align-middle">
                              <div className="flex flex-wrap gap-2">
                                {targetPets.map((pet) => (
                                  <div key={pet.id} className="flex min-w-0 items-center gap-2 rounded-xl border border-[#dcd3e3] p-2">
                                    <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full"><PetDraftAvatar pet={pet} /></span>
                                    <span className="min-w-0">
                                      <span className="block max-w-[120px] truncate font-bold text-[#35243f]">{pet.name || localizedPetDisplayType(pet)}</span>
                                      <span className="block max-w-[120px] truncate text-[10px] text-[#817a85]">{localizedPetDisplayType(pet)}</span>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          ) : null}
                          <td className="px-3 py-3 text-center font-bold text-[var(--primary)]">{state.order + 1}</td>
                          <td className="max-w-[320px] px-3 py-3 align-middle">
                            <span className="flex items-center gap-2 font-semibold">
                              <TaskIcon size={16} className="shrink-0 text-[#8a5d34]" />
                              <span className="break-words [overflow-wrap:anywhere]">{state.name}</span>
                            </span>
                          </td>
                          <td className="max-w-[320px] px-3 py-3 text-center align-middle">
                            <span className={cn("break-words [overflow-wrap:anywhere]", state.notes ? "text-[#514956]" : "text-[#aaa4ae]")}>{state.notes || "—"}</span>
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
        <div className="flex flex-col items-start gap-3">
        <button
          type="button"
          disabled={!pets.length}
          onClick={openEditor}
          className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-[var(--primary-border)] bg-[var(--primary-fixed)] py-1 pl-1.5 pr-3.5 text-[11px] font-bold text-[var(--on-primary-fixed-variant)] transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--primary)] text-white">
            {taskRows.length ? <PiPencilSimple size={15} /> : <PiPlus size={15} />}
          </span>
          {taskRows.length ? copy.edit : copy.addTask}
        </button>
        {showValidation && !taskRows.length ? (
          <PublishingValidationAlert>{copy.validationNoTask}</PublishingValidationAlert>
        ) : null}
        {showValidation && petsWithoutTasksMessage ? (
          <PublishingValidationAlert>{petsWithoutTasksMessage}</PublishingValidationAlert>
        ) : null}
        </div>
      </section>

      <section>
        <Field label={copy.additionalNotes} optional hint={copy.customAdditionalHint} hintInline hintInlineRight>
          <textarea value={notes} onChange={(event) => onNotesChange(event.target.value)} className={textareaClass} placeholder={copy.customAdditionalPlaceholder} />
        </Field>
      </section>

      {modalRows ? (
        <ModalShell
          title={copy.configureTask}
          closeLabel={copy.cancel}
          cancelLabel={copy.cancel}
          saveLabel={copy.save}
          onClose={closeEditor}
          onCancel={closeEditor}
          onSave={saveEditor}
          panelClassName="max-h-[80dvh] max-w-[1120px] rounded-[20px] border-[#d8c9e3] bg-white"
          bodyClassName="bg-white md:px-6"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">{copy.taskName}</p>
            <span className="text-[11px] text-[#9a939f]">{modalRows.length}</span>
          </div>
          <div ref={taskTableRef} className="overflow-y-auto overflow-x-hidden rounded-[14px] border border-[var(--primary-border)] bg-white md:max-h-[430px] md:overflow-auto">
            <table className="block w-full border-collapse text-left text-xs md:table md:min-w-[1020px] md:table-fixed">
              <thead className="sticky top-0 z-10 hidden border-b border-[var(--outline-variant)] bg-[var(--primary-fixed)] text-[11px] font-semibold text-[var(--on-primary-fixed-variant)] md:table-header-group">
                <tr>
                  <th className="w-[30%] px-3 py-2.5 text-center">{copy.whoNeeds}</th>
                  <th className="w-[30%] px-3 py-2.5 text-center">{copy.taskName}</th>
                  <th className="w-[25%] px-3 py-2.5 text-center">{copy.notes}</th>
                  <th className="w-[15%] px-3 py-2.5 text-center">{copy.actions}</th>
                </tr>
              </thead>
              <tbody className="block space-y-3 bg-[#f7f3fa] p-2 md:table-row-group md:space-y-0 md:bg-transparent md:p-0">
                {modalRows.map((row, index) => (
                  <tr key={row.id} className="block rounded-xl border border-[#e6ddea] bg-white p-3 text-[#514956] md:table-row md:rounded-none md:border-0 md:p-0">
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
                            <button
                              key={pet.id}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => updateRow(row.id, { petIds: selected ? row.petIds.filter((id) => id !== pet.id) : [...row.petIds, pet.id] })}
                              className={cn(
                                "inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition",
                                selected ? "border-[var(--primary)] bg-[var(--primary-fixed)] text-[var(--primary)]" : "border-[#ded9e0] bg-white text-[#817a85]",
                              )}
                            >
                              <span className="h-5 w-5 shrink-0 overflow-hidden rounded-full"><PetDraftAvatar pet={pet} /></span>
                              <span className="max-w-[90px] truncate">{pet.name || localizedPetDisplayType(pet)}</span>
                              {selected ? <PiCheck size={12} /> : null}
                            </button>
                          );
                        })}
                      </div>
                      {rowErrors[row.id]?.pets ? <p className="mt-1.5 text-[11px] font-semibold text-danger-text">{rowErrors[row.id]?.pets}</p> : null}
                    </td>
                    <td className="block py-2 align-top md:table-cell md:px-3 md:py-3">
                      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a5d34] md:hidden">{copy.taskName}</span>
                      <VisitTaskNameCombobox
                        ariaLabel={`${copy.taskName} ${index + 1}`}
                        value={row.templateId}
                        customValue={row.customLabel}
                        customValueKey={customTaskId}
                        options={comboboxOptions}
                        placeholder={copy.taskNamePlaceholder}
                        autoFocus={row.id === focusRowId}
                        error={rowErrors[row.id]?.name}
                        errorId={`custom-task-name-error-${row.id}`}
                        onChange={(next) => updateRow(row.id, { templateId: next.value, customLabel: next.customValue })}
                      />
                    </td>
                    <td className="block py-2 align-top md:table-cell md:px-3 md:py-3">
                      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a5d34] md:hidden">{copy.notes}</span>
                      <input aria-label={`${copy.notes} ${index + 1}`} value={row.notes} onChange={(event) => updateRow(row.id, { notes: event.target.value })} className={cn(inputClass, "h-10 w-full rounded-lg px-3 text-xs")} placeholder={copy.taskNotesPlaceholder} />
                    </td>
                    <td className="block pt-2 align-top md:table-cell md:px-2 md:py-3">
                      <div className="flex items-center justify-end gap-1 md:justify-center">
                        <button type="button" aria-label={`${copy.task} ${index + 1} ${copy.moveUp}`} disabled={index === 0} onClick={() => moveRow(row.id, -1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#706a78] hover:bg-[var(--primary-fixed)] disabled:opacity-30"><PiCaretUp size={16} /></button>
                        <button type="button" aria-label={`${copy.task} ${index + 1} ${copy.moveDown}`} disabled={index === modalRows.length - 1} onClick={() => moveRow(row.id, 1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#706a78] hover:bg-[var(--primary-fixed)] disabled:opacity-30"><PiCaretDown size={16} /></button>
                        <button type="button" aria-label={`${copy.deleteConfiguration} ${index + 1}`} disabled={modalRows.length === 1} onClick={() => removeRow(row.id)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-bg text-danger-text hover:bg-danger-ring disabled:cursor-not-allowed disabled:opacity-30"><PiTrash size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" onClick={addRow} className="inline-flex h-9 items-center gap-2 rounded-full border border-dashed border-[var(--primary-border)] bg-[var(--primary-subtle)] px-3 text-xs font-bold text-[var(--primary)] hover:bg-[var(--primary-fixed)]">
              <PiPlus size={15} /> {copy.addTask}
            </button>
            {!modalRows.length ? <p className="text-xs font-semibold text-danger-text">{copy.validationNoTask}</p> : null}
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}
