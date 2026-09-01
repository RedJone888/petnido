"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { IconType } from "react-icons";
import {
  PiCheck,
  PiCopy,
  PiDotsSixVertical,
  PiFlag,
  PiPencilSimple,
  PiPlus,
  PiSparkle,
  PiTrash,
  PiWarningCircle,
} from "react-icons/pi";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/Popover";

const customTaskId = "__custom-visit-task__";

type VisitRow = VisitTaskEditRow;

type RowError = { pets?: string; name?: string };

const restrictVisitRowToVerticalTable: Modifier = ({
  transform,
  draggingNodeRect,
  containerNodeRect,
}) => {
  if (!draggingNodeRect || !containerNodeRect) {
    return { ...transform, x: 0 };
  }
  const minimumY = containerNodeRect.top - draggingNodeRect.top;
  const maximumY = containerNodeRect.bottom - draggingNodeRect.bottom;
  return {
    ...transform,
    x: 0,
    y: Math.min(Math.max(transform.y, minimumY), maximumY),
  };
};

function priorityBadgeStyle(priority: VisitRow["priority"]) {
  return priority === "must"
    ? "border-amber-300 bg-amber-100 text-amber-900"
    : "border-sky-300 bg-sky-100 text-sky-800";
}

function NotesCellInput({
  value,
  placeholder,
  heading,
  clearLabel,
  onChange,
  side = "bottom",
}: {
  value: string;
  placeholder?: string;
  heading: string;
  clearLabel: string;
  onChange: (value: string) => void;
  side?: "top" | "bottom";
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
        avoidCollisions
        className="z-[1300] w-[300px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl sm:w-[340px]"
      >
        <div className="flex items-center justify-between pb-1.5 text-[11px] font-bold text-slate-500">
          <span>{heading}</span>
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs font-semibold text-danger-text hover:underline"
            >
              {clearLabel}
            </button>
          ) : null}
        </div>
        <textarea
          autoFocus
          value={value}
          rows={4}
          onChange={(event) => onChange(event.target.value)}
          className="w-full resize-y rounded-lg border border-slate-200 p-2 text-xs leading-relaxed text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder={placeholder}
        />
      </PopoverContent>
    </Popover>
  );
}

function SortableVisitRow({
  id,
  children,
  dragLabel,
  deleteLabel,
  deleteDisabled,
  onDelete,
}: {
  id: string;
  children: ReactNode;
  dragLabel: string;
  deleteLabel: string;
  deleteDisabled: boolean;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "block rounded-xl border border-[#e6ddea] bg-white p-3 md:table-row md:rounded-none md:border-0 md:p-0",
        isDragging && "relative z-20 shadow-lg opacity-90",
      )}
    >
      {children}
      <td className="block pt-2 align-top md:table-cell md:px-2 md:py-3 md:align-middle">
        <div className="flex justify-end gap-1 md:justify-center">
          <button
            type="button"
            aria-label={dragLabel}
            title={dragLabel}
            {...attributes}
            {...listeners}
            className="flex h-8 w-8 touch-none cursor-grab items-center justify-center rounded-lg text-[#817a85] hover:bg-[var(--primary-fixed)] active:cursor-grabbing"
          >
            <PiDotsSixVertical size={18} />
          </button>
          <button
            type="button"
            aria-label={deleteLabel}
            title={deleteLabel}
            disabled={deleteDisabled}
            onClick={onDelete}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-bg text-danger-text disabled:cursor-not-allowed disabled:opacity-30"
          >
            <PiTrash size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}

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
  const clearNotesLabel =
    lang === "ja" ? "すべてクリア" : lang === "zh" ? "全部清空" : "Clear all";
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
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
    const currentPetIds = new Set(pets.map((pet) => pet.id));
    const rows = rowsForVisit(value, visit, lang).map((row) => ({
      ...row,
      petIds: row.petIds.filter((petId) => currentPetIds.has(petId)),
    }));
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

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setModalRows((current) => {
      const from = current.findIndex((row) => row.id === active.id);
      const to = current.findIndex((row) => row.id === over.id);
      return from < 0 || to < 0 ? current : arrayMove(current, from, to);
    });
  };

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
          const knownPetIds = new Set(pets.map((pet) => pet.id));
          const rowsWithoutPets = rows.filter(
            (row) => !row.petIds.some((petId) => knownPetIds.has(petId)),
          );
          const displayRows = rows.map((row, order) => ({
            petIds: Array.from(
              new Set(row.petIds.filter((petId) => knownPetIds.has(petId))),
            ),
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
          const visitName = needMessages.needPublishingClient.visitTasks.dailyVisit.replace(
            "{n}",
            String(visit),
          );
          return (
            <article key={visit} className="rounded-2xl border border-[var(--primary-border)] bg-white p-4">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h4 className="font-bold text-[#35243f]">{visitName}</h4>
                  <span className="text-xs font-semibold text-[#817a85]">
                    · {visitTimeLabel(visitTimes[visitIndex], exactTimes[visitIndex])}
                  </span>
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
                              {needMessages.needPublishingClient.visitTasks.dailyVisit.replace("{n}", String(candidate))}
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
                                  <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 font-semibold", priorityBadgeStyle(state.priority))}><PiFlag size={13} />{state.priority === "must" ? copy.mustDo : copy.ifTime}</span>
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
                <div className="hidden max-h-[260px] overflow-y-auto overflow-x-auto rounded-xl border border-[#EDE8E1] md:block">
                  <table className="w-full min-w-[720px] table-auto border-collapse text-xs">
                    <thead className="sticky top-0 z-10 border-b border-[#EDE8E1] bg-[#FAF6F0] text-[#8A5D34]">
                      <tr>
                        <th className="w-[200px] px-4 py-3 text-left font-bold">{copy.whoNeeds}</th>
                        <th className="px-4 py-3 text-left font-bold">{copy.careTasks}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDE8E1]">
                      {groups.map((group, groupIndex) => {
                        const groupPets = group.petIds.flatMap((petId) => {
                          const pet = pets.find((candidate) => candidate.id === petId);
                          return pet ? [pet] : [];
                        });
                        return (
                          <tr key={`${visit}-${groupIndex}-${group.petIds.join("-")}`}>
                            <td className="w-[200px] border-r border-[#EDE8E1] bg-white px-4 py-3 align-top">
                              <div className="flex flex-wrap gap-2">
                                {groupPets.map((pet) => (
                                  <span key={pet.id} className="inline-flex items-center gap-1.5 rounded-lg border border-[#dcd3e3] bg-white px-2 py-1.5 font-semibold">
                                    <span className="h-6 w-6 overflow-hidden rounded-full"><PetDraftAvatar pet={pet} /></span>
                                    {pet.name || displayPetType(pet)}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="bg-white p-0 align-middle">
                              <div className="flex flex-col divide-y divide-[#EDE8E1]">
                                {group.items.map(({ state }) => {
                                  const TaskIcon = localizedOptions.find((option) => option.id === state.templateId)?.icon ?? PiSparkle;
                                  return (
                                    <div key={state.representativeTaskId} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5 sm:flex-nowrap">
                                      <div className="flex shrink-0 items-center gap-2">
                                        <span className="w-5 shrink-0 text-center font-bold text-primary">{state.order + 1}</span>
                                        <span className="inline-flex items-center gap-1.5 font-bold leading-5 text-[#2B231D]"><TaskIcon size={15} className="text-[#8a5d34]" />{state.name}</span>
                                        <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", priorityBadgeStyle(state.priority))}><PiFlag size={12} />{state.priority === "must" ? copy.mustDo : copy.ifTime}</span>
                                      </div>
                                      <span className="min-w-0 flex-1 whitespace-pre-wrap break-words leading-5 text-[#514956] [overflow-wrap:anywhere]">{state.notes || "—"}</span>
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
              ) : showValidation ? (
                <PublishingValidationAlert className="w-full">
                  {visitTaskRequiredMessage(lang, visit)}
                </PublishingValidationAlert>
              ) : (
                <p className="rounded-xl border border-dashed border-[#ded9e0] px-4 py-4 text-sm text-[#9a939f]">{copy.noTasksYet}</p>
              )}
              {showValidation && rowsWithoutPets.length ? (
                <PublishingValidationAlert className="mt-3 w-full">
                  {needMessages.needPublishingClient.visitTasks.unassignedTasks.replace(
                    "{tasks}",
                    rowsWithoutPets
                      .map((row) => taskName(row))
                      .filter(Boolean)
                      .join(", "),
                  )}
                </PublishingValidationAlert>
              ) : null}
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
          title={`${copy.configureTask} · ${needMessages.needPublishingClient.visitTasks.dailyVisit.replace("{n}", String(editingVisit))}`}
          closeLabel={copy.cancel}
          cancelLabel={copy.cancel}
          saveLabel={copy.save}
          onClose={closeEditor}
          onCancel={closeEditor}
          onSave={saveEditor}
          panelClassName="max-h-[85dvh] max-w-[1180px] rounded-[20px] border-[#d8c9e3] bg-white flex flex-col"
          bodyClassName="bg-white md:px-6"
        >
          <div ref={taskTableRef} className="max-h-[min(50dvh,360px)] overflow-y-auto overflow-x-hidden rounded-[14px] border border-[var(--primary-border)] bg-white md:overflow-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictVisitRowToVerticalTable]}
              onDragEnd={handleDragEnd}
            >
            <table className="block w-full border-collapse text-left text-xs md:table md:min-w-[1080px] md:table-fixed">
              <thead className="sticky top-0 z-10 hidden bg-[var(--primary-fixed)] text-[var(--on-primary-fixed-variant)] md:table-header-group">
                <tr>
                  <th className="w-[25%] px-3 py-2.5 text-center">{copy.whoNeeds}</th>
                  <th className="w-[6%] px-2 py-2.5 text-center">{copy.index}</th>
                  <th className="w-[21%] px-3 py-2.5 text-center">{copy.taskName}</th>
                  <th className="w-[16%] px-3 py-2.5 text-center">{copy.priority}</th>
                  <th className="w-[20%] px-3 py-2.5 text-center">{copy.notes}</th>
                  <th className="w-[12%] px-3 py-2.5 text-center">{copy.actions}</th>
                </tr>
              </thead>
              <tbody className="block space-y-3 bg-[#f7f3fa] p-2 md:table-row-group md:space-y-0 md:bg-transparent md:p-0">
                <SortableContext items={modalRows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
                {modalRows.map((row, index) => {
                  const popoverSide = index >= Math.max(1, modalRows.length - 2) ? "top" : "bottom";
                  return (
                  <SortableVisitRow key={row.id} id={row.id} dragLabel={copy.reorder} deleteLabel={copy.delete} deleteDisabled={modalRows.length === 1} onDelete={() => setModalRows((current) => current.filter((candidate) => candidate.id !== row.id))}>
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
                    <td className="hidden px-2 py-3 text-center font-bold text-[var(--primary)] md:table-cell md:align-middle">{index + 1}</td>
                    <td className="block py-2 align-top md:table-cell md:px-3 md:py-3 md:align-middle">
                      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a5d34] md:hidden">{copy.taskName}</span>
                      <VisitTaskNameCombobox ariaLabel={`${copy.taskName} ${index + 1}`} value={row.templateId} customValue={row.customLabel} customValueKey={customTaskId} options={comboboxOptions} placeholder={copy.taskNamePlaceholder} autoFocus={focusRowId === row.id} error={rowErrors[row.id]?.name} errorId={`visit-task-error-${row.id}`} onChange={(next) => updateRow(row.id, { templateId: next.value, customLabel: next.customValue, custom: next.value === customTaskId })} />
                    </td>
                    <td className="block py-2 align-top md:table-cell md:px-3 md:py-3 md:align-middle"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a5d34] md:hidden">{copy.priority}</span><TaskPriorityButtons value={row.priority} mustLabel={copy.mustDo} ifTimeLabel={copy.ifTime} onChange={(priority) => updateRow(row.id, { priority })} /></td>
                    <td className="block py-2 align-top md:table-cell md:px-3 md:py-3 md:align-middle"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a5d34] md:hidden">{copy.notes}</span><NotesCellInput value={row.notes} heading={copy.notes} clearLabel={clearNotesLabel} placeholder={copy.taskNotesPlaceholder} side={popoverSide} onChange={(notes) => updateRow(row.id, { notes })} /></td>
                  </SortableVisitRow>
                );})}
                </SortableContext>
              </tbody>
            </table>
            </DndContext>
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
