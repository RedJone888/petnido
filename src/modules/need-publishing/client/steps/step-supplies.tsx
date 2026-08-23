"use client";

import { useState } from "react";
import {
  PiBowlFood,
  PiCaretDown,
  PiCaretUp,
  PiCheck,
  PiHouseSimple,
  PiPencilSimple,
  PiPlus,
  PiSuitcase,
  PiTrash,
} from "react-icons/pi";
import { useLanguage } from "@/components/providers/language-provider";
import { useNeedPublishingMessages } from "@/modules/need-publishing/client";
import { ModalShell } from "@/components/ui/modal-shell";
import {
  boardingSupplyOptions,
  type BoardingSupplyPlan,
  type CustomBoardingSupply,
  type PetDraft,
  type SupplyCategory,
} from "@/domain/publishing/legacy-need-draft-v3";
import { supplyFingerprint } from "@/modules/need-publishing/domain/task-fingerprint";
import cn from "@/lib/cn";
import {
  buildPetCareGroups,
  Field,
  petDisplayType,
  PetDraftAvatar,
  supplyItemIcon,
  textareaClass,
} from "../guided-need-flow-shared";
import { PublishingValidationAlert } from "../components/publishing-validation-alert";
import {
  VisitSelect,
  VisitTaskNameCombobox,
} from "../components/controls/visit-task-combobox";
import {
  buildSupplyRows,
  groupSupplyRowsByPetAssignment,
  replaceSupplyPetGroup,
  type SelectedSupplyProvision,
  type SupplyDisplayRow,
} from "../supplies-grouping";

const customCategoryId = "__custom-supply-category__";
const customItemId = "__custom-supply-item__";

type SelectedProvision = SelectedSupplyProvision;
type SupplyRow = {
  id: string;
  petIds: string[];
  categoryId: SupplyCategory | typeof customCategoryId | "";
  customCategory: string;
  itemId: string;
  customItem: string;
  sourceLabel: string;
  provision: SelectedProvision;
  sourceKeysByPet: Record<string, string>;
};
type RowError = { pets?: string; category?: string; item?: string };

const standardItemId = (category: SupplyCategory, label: string) =>
  `standard:${category}:${encodeURIComponent(label)}`;
const standardItemLabel = (value: string) => {
  const separator = value.indexOf(":", "standard:".length);
  return separator < 0 ? "" : decodeURIComponent(value.slice(separator + 1));
};

export function StepSupplies({
  pets,
  value,
  onChange,
  customItems,
  onCustomItemsChange,
  notes,
  onNotesChange,
}: {
  pets: PetDraft[];
  value: BoardingSupplyPlan;
  onChange: (value: BoardingSupplyPlan) => void;
  customItems: CustomBoardingSupply[];
  onCustomItemsChange: (value: CustomBoardingSupply[]) => void;
  notes: string;
  onNotesChange: (value: string) => void;
}) {
  const { lang } = useLanguage();
  const needMessages = useNeedPublishingMessages();
  const copy = needMessages.needPublishingSupplyForm;
  const taskCopy = needMessages.needPublishingTaskForm;
  const ui = needMessages.needPublishingClient.supplies.ui;
  const displayPetType = (pet: PetDraft) => petDisplayType(pet, lang);
  const localItem = (label: string, custom: boolean) =>
    custom ? label : needMessages.needPublishingClient.supplies.items[
      label as keyof typeof needMessages.needPublishingClient.supplies.items
    ] ?? label;
  const categoryLabel = (category: SupplyCategory, customLabel?: string) =>
    category === "food"
      ? copy.food
      : category === "stay"
        ? copy.stay
        : category === "travel"
          ? copy.travel
          : customLabel?.trim() || ui.other;
  const petGroups = buildPetCareGroups(pets, displayPetType);
  const petById = new Map(pets.map((pet) => [pet.id, pet]));
  const rowsForGroup = (petIds: readonly string[]) =>
    buildSupplyRows(pets, value, customItems, petIds);
  const toModalRow = (row: SupplyDisplayRow): SupplyRow => ({
    id: crypto.randomUUID(),
    petIds: [...row.petIds],
    categoryId: row.category === "other" ? customCategoryId : row.category,
    customCategory: row.categoryLabel ?? "",
    itemId: row.custom ? customItemId : standardItemId(row.category, row.label),
    customItem: row.custom ? row.label : "",
    sourceLabel: row.sourceLabel,
    provision: row.provision,
    sourceKeysByPet: { ...row.sourceKeysByPet },
  });
  const [editingGroupKey, setEditingGroupKey] = useState<string | null>(null);
  const [modalRows, setModalRows] = useState<SupplyRow[]>([]);
  const [rowErrors, setRowErrors] = useState<Record<string, RowError>>({});
  const [modalValidationAttempted, setModalValidationAttempted] = useState(false);
  const editingGroup = petGroups.find((group) => group.key === editingGroupKey);
  const createRow = (petIds: readonly string[]): SupplyRow => ({
    id: crypto.randomUUID(),
    petIds: [...petIds],
    categoryId: "",
    customCategory: "",
    itemId: "",
    customItem: "",
    sourceLabel: "",
    provision: "owner",
    sourceKeysByPet: {},
  });
  const resolvedCategory = (row: SupplyRow) =>
    row.categoryId === customCategoryId
      ? row.customCategory.trim()
      : row.categoryId
        ? row.categoryId
        : "";
  const resolvedItem = (row: SupplyRow) =>
    row.itemId === customItemId ? row.customItem.trim() : standardItemLabel(row.itemId);
  const rowFingerprint = (row: SupplyRow) =>
    supplyFingerprint({
      assignmentPetKeys: row.petIds,
      category: resolvedCategory(row),
      item: resolvedItem(row),
    });
  const validateRows = (rows: SupplyRow[]) => {
    const counts = new Map<string, number>();
    rows.forEach((row) => {
      const fingerprint = rowFingerprint(row);
      counts.set(fingerprint, (counts.get(fingerprint) ?? 0) + 1);
    });
    return Object.fromEntries(
      rows.flatMap((row) => {
        const error: RowError = {};
        if (!row.petIds.length) error.pets = ui.choosePets;
        if (!resolvedCategory(row)) error.category = ui.categoryRequired;
        if (!resolvedItem(row)) error.item = ui.itemRequired;
        else if ((counts.get(rowFingerprint(row)) ?? 0) > 1) error.item = ui.duplicate;
        return Object.keys(error).length ? [[row.id, error]] : [];
      }),
    );
  };
  const openEditor = (groupKey: string) => {
    const group = petGroups.find((candidate) => candidate.key === groupKey);
    if (!group) return;
    const rows = rowsForGroup(group.petIds);
    setEditingGroupKey(groupKey);
    setModalRows(rows.length ? rows.map(toModalRow) : [createRow(group.petIds)]);
    setRowErrors({});
    setModalValidationAttempted(false);
  };
  const closeEditor = () => {
    setEditingGroupKey(null);
    setModalRows([]);
    setRowErrors({});
    setModalValidationAttempted(false);
  };
  const updateRow = (rowId: string, patch: Partial<SupplyRow>) => {
    const nextRows = modalRows.map((row) =>
      row.id === rowId ? { ...row, ...patch } : row,
    );
    setModalRows(nextRows);
    if (modalValidationAttempted) setRowErrors(validateRows(nextRows));
    else setRowErrors((errors) => {
      const next = { ...errors };
      delete next[rowId];
      return next;
    });
  };
  const itemOptions = (row: SupplyRow) => {
    if (!row.categoryId || row.categoryId === customCategoryId) return [];
    const seen = new Set<string>();
    const groupPets = pets.filter((pet) =>
      (editingGroup?.petIds ?? []).includes(pet.id),
    );
    return groupPets.flatMap((pet) =>
      boardingSupplyOptions([pet], []).flatMap((option) => {
        if (option.category !== row.categoryId || seen.has(option.label)) return [];
        seen.add(option.label);
        return [
          {
            value: standardItemId(option.category, option.label),
            label: localItem(option.label, false),
            icon: supplyItemIcon(option.label),
          },
        ];
      }),
    );
  };
  const saveEditor = () => {
    if (!editingGroup) return;
    setModalValidationAttempted(true);
    const errors = validateRows(modalRows);
    setRowErrors(errors);
    if (Object.keys(errors).length) return;

    const normalizedRows: SupplyDisplayRow[] = modalRows.map((row) => ({
      key: rowFingerprint(row),
      petIds: [...row.petIds],
      category: row.categoryId === customCategoryId ? "other" : row.categoryId as SupplyCategory,
      categoryLabel: row.categoryId === customCategoryId ? row.customCategory.trim() : undefined,
      label: resolvedItem(row),
      sourceLabel: resolvedItem(row),
      custom: row.itemId === customItemId || row.categoryId === customCategoryId,
      provision: row.provision,
      sourceKeysByPet: { ...row.sourceKeysByPet },
    }));
    const result = replaceSupplyPetGroup({
      pets,
      currentPlan: value,
      currentCustomItems: customItems,
      groupPetIds: editingGroup.petIds,
      rows: normalizedRows,
      createId: () => crypto.randomUUID(),
    });
    onCustomItemsChange(result.customItems);
    onChange(result.plan);
    closeEditor();
  };

  if (!pets.length) return <PublishingValidationAlert>{taskCopy.noPetGroups}</PublishingValidationAlert>;

  return (
    <div className="space-y-5">
      <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">{ui.title}</h3>
      {petGroups.map((petGroup) => {
        const rows = rowsForGroup(petGroup.petIds);
        const assignmentGroups = groupSupplyRowsByPetAssignment(rows);
        const groupPets = petGroup.petIds.flatMap((petId) => {
          const pet = petById.get(petId);
          return pet ? [pet] : [];
        });
        return (
          <section key={petGroup.key} className="space-y-3 rounded-2xl border border-[var(--primary-border)] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-[#35243f]">{groupPets[0] ? displayPetType(groupPets[0]) : petGroup.label}</h4>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {groupPets.map((pet) => (
                    <span key={pet.id} className="inline-flex items-center gap-1.5 rounded-lg bg-[#f7f2fa] px-2 py-1 text-[11px] font-semibold text-[#625a68]">
                      <span className="h-5 w-5 overflow-hidden rounded-full"><PetDraftAvatar pet={pet} /></span>
                      {pet.name || displayPetType(pet)}
                    </span>
                  ))}
                </div>
              </div>
              <button type="button" onClick={() => openEditor(petGroup.key)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--primary)] px-3 text-xs font-bold text-white">
                {rows.length ? <PiPencilSimple size={15} /> : <PiPlus size={15} />}
                {rows.length ? ui.edit : ui.add}
              </button>
            </div>
            {rows.length ? (
              <>
                <div className="space-y-3 md:hidden">
                  {assignmentGroups.map((assignmentGroup, groupIndex) => {
                    const rowPets = assignmentGroup.petIds.flatMap((petId) => {
                      const pet = petById.get(petId);
                      return pet ? [pet] : [];
                    });
                    return (
                      <div key={`${petGroup.key}-mobile-${groupIndex}`} className="overflow-hidden rounded-xl border border-[#e6ddea] bg-white">
                        <div className="flex flex-wrap gap-1.5 bg-[var(--primary-fixed)] px-3 py-2.5">
                          {rowPets.map((pet) => (
                            <span key={pet.id} className="inline-flex items-center gap-1.5 rounded-lg border border-[#ded9e0] bg-white px-2 py-1.5 text-[11px] font-semibold">
                              <span className="h-6 w-6 overflow-hidden rounded-full"><PetDraftAvatar pet={pet} /></span>
                              {pet.name || displayPetType(pet)}
                            </span>
                          ))}
                        </div>
                        <div className="divide-y divide-[#eee9ef]">
                          {assignmentGroup.items.map((row) => {
                            const ItemIcon = supplyItemIcon(row.sourceLabel || row.label);
                            return (
                              <div key={row.key} className="space-y-2 px-3 py-3">
                                <div className="flex items-start justify-between gap-3">
                                  <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-[#35243f]">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f6f2f7] text-[#8a5d34]"><ItemIcon size={16} /></span>
                                    <span className="break-words">{localItem(row.label, row.custom)}</span>
                                  </span>
                                  <span className={cn("shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold", row.provision === "owner" ? "border-sky-200 bg-sky-50 text-sky-700" : "border-amber-300 bg-amber-50 text-amber-800")}>
                                    {row.provision === "owner" ? copy.owner : copy.sitter}
                                  </span>
                                </div>
                                <p className="pl-10 text-[11px] font-semibold text-[#817a85]">{categoryLabel(row.category, row.categoryLabel)}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="hidden overflow-x-auto rounded-xl border border-[#e6ddea] md:block">
                <table className="w-full min-w-[720px] table-auto border-collapse text-xs">
                  <thead className="bg-[var(--primary-fixed)] text-[var(--on-primary-fixed-variant)]">
                    <tr>
                      <th className="px-3 py-2.5 text-left">{ui.petGroup}</th>
                      <th className="px-3 py-2.5 text-left">{ui.category}</th>
                      <th className="px-3 py-2.5 text-left">{ui.item}</th>
                      <th className="px-3 py-2.5 text-center">{ui.provider}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eee9ef]">
                    {assignmentGroups.flatMap((assignmentGroup) =>
                      assignmentGroup.items.map((row, index) => {
                        const rowPets = assignmentGroup.petIds.flatMap((petId) => {
                          const pet = petById.get(petId);
                          return pet ? [pet] : [];
                        });
                        const ItemIcon = supplyItemIcon(row.sourceLabel || row.label);
                        return (
                          <tr key={`${row.key}-${index}`}>
                            {index === 0 ? (
                              <td rowSpan={assignmentGroup.items.length} className="px-3 py-3 align-middle">
                                <div className="flex flex-wrap gap-1.5">
                                  {rowPets.map((pet) => (
                                    <span key={pet.id} className="inline-flex items-center gap-1.5 rounded-lg border border-[#ded9e0] px-2 py-1.5 font-semibold">
                                      <span className="h-6 w-6 overflow-hidden rounded-full"><PetDraftAvatar pet={pet} /></span>
                                      {pet.name || displayPetType(pet)}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            ) : null}
                            <td className="px-3 py-3 font-semibold">{categoryLabel(row.category, row.categoryLabel)}</td>
                            <td className="px-3 py-3">
                              <span className="inline-flex items-center gap-2 font-semibold">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f6f2f7] text-[#8a5d34]"><ItemIcon size={16} /></span>
                                {localItem(row.label, row.custom)}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold", row.provision === "owner" ? "border-sky-200 bg-sky-50 text-sky-700" : "border-amber-300 bg-amber-50 text-amber-800")}>
                                {row.provision === "owner" ? copy.owner : copy.sitter}
                              </span>
                            </td>
                          </tr>
                        );
                      }),
                    )}
                  </tbody>
                </table>
                </div>
              </>
            ) : null}
          </section>
        );
      })}

      <Field label={ui.notes} optional><textarea value={notes} onChange={(event) => onNotesChange(event.target.value)} className={cn(textareaClass, "min-h-24 resize-y")} placeholder={ui.notesPlaceholder} maxLength={2000} /></Field>

      {editingGroup ? (
        <ModalShell title={`${ui.configure} · ${editingGroup.label}`} closeLabel={ui.cancel} cancelLabel={ui.cancel} saveLabel={ui.save} onClose={closeEditor} onCancel={closeEditor} onSave={saveEditor} panelClassName="max-h-[80dvh] max-w-[1180px] rounded-[20px] border-[#d8c9e3] bg-white" bodyClassName="bg-white md:px-6">
          <div className="overflow-y-auto overflow-x-hidden rounded-[14px] border border-[var(--primary-border)] bg-white md:max-h-[450px] md:overflow-auto">
            <table className="block w-full border-collapse text-xs md:table md:min-w-[1100px] md:table-fixed">
              <thead className="sticky top-0 z-10 hidden bg-[var(--primary-fixed)] text-[var(--on-primary-fixed-variant)] md:table-header-group"><tr><th className="w-[27%] px-3 py-2.5">{ui.petGroup}</th><th className="w-[21%] px-3 py-2.5">{ui.category}</th><th className="w-[25%] px-3 py-2.5">{ui.item}</th><th className="w-[16%] px-3 py-2.5">{ui.provider}</th><th className="w-[11%] px-3 py-2.5">{ui.actions}</th></tr></thead>
              <tbody className="block space-y-3 bg-[#f9f6fa] p-3 md:table-row-group md:divide-y md:divide-[#eee9ef] md:bg-white md:p-0">
                {modalRows.map((row, index) => (
                  <tr key={row.id} className="block rounded-xl border border-[#e6ddea] bg-white p-3 md:table-row md:border-0 md:p-0">
                    <td className="block py-2 align-top md:table-cell md:px-3 md:py-3"><div className="mb-3 flex items-center gap-2 border-b border-[#eee9ef] pb-2 md:hidden"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-[11px] font-bold text-white">{index + 1}</span><span className="text-xs font-bold text-[#514956]">{ui.item} {index + 1}</span></div><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a5d34] md:hidden">{ui.petGroup}</span><div className="flex flex-wrap gap-1.5">{editingGroup.petIds.flatMap((petId) => { const pet = petById.get(petId); return pet ? [pet] : []; }).map((pet) => { const selected = row.petIds.includes(pet.id); return <button key={pet.id} type="button" aria-pressed={selected} onClick={() => updateRow(row.id, { petIds: selected ? row.petIds.filter((id) => id !== pet.id) : [...row.petIds, pet.id] })} className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold", selected ? "border-[var(--primary)] bg-[var(--primary-fixed)] text-[var(--primary)]" : "border-[#ded9e0] text-[#817a85]")}><span className="h-5 w-5 overflow-hidden rounded-full"><PetDraftAvatar pet={pet} /></span><span className="max-w-20 truncate">{pet.name || displayPetType(pet)}</span>{selected ? <PiCheck size={12} /> : null}</button>; })}</div>{rowErrors[row.id]?.pets ? <p className="mt-1.5 text-[11px] font-semibold text-danger-text">{rowErrors[row.id]?.pets}</p> : null}</td>
                    <td className="block py-2 align-top md:table-cell md:px-3 md:py-3"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a5d34] md:hidden">{ui.category}</span><VisitTaskNameCombobox ariaLabel={`${ui.category} ${index + 1}`} value={row.categoryId} customValue={row.customCategory} customValueKey={customCategoryId} options={[{ value: "food", label: copy.food, icon: PiBowlFood }, { value: "stay", label: copy.stay, icon: PiHouseSimple }, { value: "travel", label: copy.travel, icon: PiSuitcase }]} placeholder={ui.categoryPlaceholder} error={rowErrors[row.id]?.category} errorId={`supply-category-error-${row.id}`} onChange={(next) => updateRow(row.id, { categoryId: next.value as SupplyRow["categoryId"], customCategory: next.customValue, itemId: next.value === row.categoryId ? row.itemId : "", customItem: next.value === row.categoryId ? row.customItem : "" })} /></td>
                    <td className="block py-2 align-top md:table-cell md:px-3 md:py-3"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a5d34] md:hidden">{ui.item}</span><VisitTaskNameCombobox ariaLabel={`${ui.item} ${index + 1}`} value={row.itemId} customValue={row.customItem} customValueKey={customItemId} options={itemOptions(row)} suggestionsEnabled={itemOptions(row).length > 0} placeholder={ui.itemPlaceholder} error={rowErrors[row.id]?.item} errorId={`supply-item-error-${row.id}`} onChange={(next) => updateRow(row.id, { itemId: next.value, customItem: next.customValue })} /></td>
                    <td className="block py-2 align-top md:table-cell md:px-3 md:py-3"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a5d34] md:hidden">{ui.provider}</span><VisitSelect ariaLabel={`${ui.provider} ${index + 1}`} value={row.provision} options={[{ value: "owner", label: copy.owner }, { value: "sitter", label: copy.sitter }]} onChange={(next) => updateRow(row.id, { provision: next as SelectedProvision })} /></td>
                    <td className="block py-2 align-top md:table-cell md:px-2 md:py-3"><div className="flex justify-end gap-1 md:justify-center"><button type="button" disabled={index === 0} onClick={() => setModalRows((current) => { const rows = [...current]; [rows[index - 1], rows[index]] = [rows[index], rows[index - 1]]; return rows; })} className="flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-30"><PiCaretUp size={16} /></button><button type="button" disabled={index === modalRows.length - 1} onClick={() => setModalRows((current) => { const rows = [...current]; [rows[index], rows[index + 1]] = [rows[index + 1], rows[index]]; return rows; })} className="flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-30"><PiCaretDown size={16} /></button><button type="button" onClick={() => setModalRows((current) => current.filter((candidate) => candidate.id !== row.id))} className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-bg text-danger-text"><PiTrash size={15} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!modalRows.length ? <p className="mt-3 text-xs font-semibold text-[#817a85]">{ui.empty}</p> : null}
          <button type="button" onClick={() => setModalRows((current) => [...current, createRow(editingGroup.petIds)])} className="mt-3 inline-flex h-9 items-center gap-2 rounded-full border border-dashed border-[var(--primary-border)] bg-[var(--primary-subtle)] px-3 text-xs font-bold text-[var(--primary)]"><PiPlus size={15} />{ui.add}</button>
        </ModalShell>
      ) : null}
    </div>
  );
}
