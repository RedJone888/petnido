"use client";

import { useState } from "react";
import {
  PiBowlFood,
  PiCheck,
  PiHouseSimple,
  PiPencilSimple,
  PiPlus,
  PiSparkle,
  PiSuitcase,
  PiTrash,
  PiWarningCircle,
} from "react-icons/pi";
import { useLanguage } from "@/components/providers/language-provider";
import { ModalShell } from "@/components/ui/modal-shell";
import { localizeOtherPetType } from "@/domain/pet/profile-options";
import {
  boardingSupplyKey,
  boardingSupplyOptions,
  type BoardingSupplyPlan,
  type CustomBoardingSupply,
  type PetDraft,
  type SupplyCategory,
  type SupplyProvision,
} from "@/domain/publishing/legacy-need-draft-v3";
import cn from "@/lib/cn";
import {
  buildPetCareGroups,
  Field,
  petDisplayType,
  petTypes,
  PetDraftAvatar,
  supplyItemIcon,
  textareaClass,
} from "../guided-need-flow-shared";
import {
  VisitSelect,
  VisitTaskNameCombobox,
} from "../components/controls/visit-task-combobox";

const customCategoryId = "__custom-supply-category__";
const customItemId = "__custom-supply-item__";

type SelectedProvision = Exclude<SupplyProvision, "" | "not-needed">;
type ModalRow = {
  id: string;
  categoryId: SupplyCategory | typeof customCategoryId | "";
  customCategory: string;
  itemId: string;
  customItem: string;
  provision: SelectedProvision;
};
type DisplayRow = {
  key: string;
  petIds: string[];
  sourceKeys: string[];
  category: SupplyCategory;
  categoryLabel: string;
  label: string;
  sourceLabel: string;
  custom: boolean;
  provision: SelectedProvision;
};
type ModalDraft = {
  petGroupKey: string;
  petIds: string[];
  rows: ModalRow[];
  sourceKeys: string[];
};

const standardItemId = (category: SupplyCategory, label: string) =>
  `standard:${category}:${encodeURIComponent(label)}`;
const standardItemLabel = (value: string) => {
  const separator = value.indexOf(":", "standard:".length);
  return separator < 0 ? "" : decodeURIComponent(value.slice(separator + 1));
};
const createRow = (): ModalRow => ({
  id: crypto.randomUUID(),
  categoryId: "",
  customCategory: "",
  itemId: "",
  customItem: "",
  provision: "owner",
});

const supplyLabelTranslations: Record<string, { zh: string; ja: string }> = {
  "Dry food": { zh: "干粮", ja: "ドライフード" },
  "Wet food (cans or pouches)": { zh: "湿粮（罐头或餐包）", ja: "ウェットフード（缶・パウチ）" },
  "Treats or supplements": { zh: "零食或营养品", ja: "おやつ・サプリメント" },
  Medication: { zh: "药物", ja: "薬" },
  "Food bowl or dish": { zh: "食盆", ja: "フードボウル" },
  "Water bowl or dispenser": { zh: "水碗或饮水器", ja: "水皿・給水器" },
  "Bed or familiar blanket": { zh: "窝或熟悉的毯子", ja: "ベッド・慣れた毛布" },
  "Toys or enrichment": { zh: "玩具或益智用品", ja: "おもちゃ・エンリッチメント用品" },
  "Travel carrier or container": { zh: "外出箱或运输容器", ja: "キャリー・移動容器" },
  "Poop bags": { zh: "拾便袋", ja: "排泄物用袋" },
  "Toilet pads": { zh: "尿垫", ja: "トイレシート" },
  "Leash and harness": { zh: "牵引绳和胸背", ja: "リード・ハーネス" },
  "Litter tray": { zh: "厕所盆", ja: "トイレ容器" },
  "Toilet litter or pads": { zh: "厕所垫料或尿垫", ja: "トイレ砂・シート" },
  "Scratching post or pad": { zh: "猫抓柱或抓板", ja: "爪とぎポール・マット" },
  Hay: { zh: "牧草", ja: "牧草" },
  Pellets: { zh: "颗粒粮", ja: "ペレット" },
  "Fresh vegetables": { zh: "新鲜蔬菜", ja: "新鮮な野菜" },
  "Water bottle or bowl": { zh: "饮水瓶或水碗", ja: "給水ボトル・水皿" },
  "Cage or exercise pen": { zh: "笼舍或围栏", ja: "ケージ・サークル" },
  "Bedding or substrate": { zh: "垫料或底材", ja: "床材・底材" },
  "Chew toys or enrichment": { zh: "磨牙或益智用品", ja: "かじり木・エンリッチメント用品" },
  "Secure travel carrier": { zh: "安全外出箱", ja: "安全なキャリー" },
  "Carrier liner or towel": { zh: "运输箱垫布或毛巾", ja: "キャリー用マット・タオル" },
  "Regular food": { zh: "日常主粮", ja: "いつものフード" },
  "Home cage or enclosure": { zh: "日常笼舍", ja: "普段のケージ" },
  "Toilet or cleaning supplies": { zh: "如厕或清洁用品", ja: "トイレ・掃除用品" },
  "Cage liner or paper": { zh: "笼底纸或垫纸", ja: "ケージライナー・敷紙" },
  Perches: { zh: "栖木", ja: "止まり木" },
  "Carrier cover": { zh: "运输箱罩布", ja: "キャリーカバー" },
  "Species-appropriate food": { zh: "适合该物种的食物", ja: "種類に合ったフード" },
  "Calcium or supplements": { zh: "钙粉或营养补充剂", ja: "カルシウム・サプリメント" },
  "Enclosure or habitat": { zh: "饲养箱或栖息环境", ja: "飼育ケース・生息環境" },
  "Heat or UV lamp": { zh: "加热灯或 UV 灯", ja: "保温・UVライト" },
  "Thermometer or hygrometer": { zh: "温度计或湿度计", ja: "温度計・湿度計" },
  "Water dish or bathing container": { zh: "水盆或泡水容器", ja: "水皿・水浴び容器" },
  "Ventilated travel container": { zh: "通风运输容器", ja: "通気性のある移動容器" },
  "Heat pack or insulation": { zh: "保温包或隔热材料", ja: "保温材・断熱材" },
  "Exercise wheel": { zh: "跑轮", ja: "回し車" },
  "Hideout or nesting box": { zh: "躲避屋或巢箱", ja: "隠れ家・巣箱" },
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
  const { lang, t } = useLanguage();
  const copy = t.core.needPublishingSupplyForm;
  const ui = {
    en: {
      title: "Supplies", empty: "No supplies yet. Add a supply.", petGroup: "Pet group",
      no: "No.", category: "Supply category", item: "Supply item", provider: "Who provides it",
      actions: "Actions", configure: "Configure supplies", who: "For which pets?",
      intro: "Choose the pets these supplies apply to, then add what they need for their stay.",
      selectAll: "Select all", deselectAll: "Deselect all", add: "Add a supply",
      edit: "Edit supplies for", delete: "Delete supplies for", save: "Save", cancel: "Cancel",
      categoryPlaceholder: "Choose or enter a category", itemPlaceholder: "Choose or enter a supply item",
      categoryRequired: "Choose or enter a category.", itemRequired: "Choose or enter a supply item.",
      choosePets: "Choose at least one pet.", duplicate: "Supply items must be unique within this pet group.",
      other: "Other", total: (count: number) => `${count} ${count === 1 ? "supply" : "supplies"} total`,
      count: (count: number) => `${count} ${count === 1 ? "supply" : "supplies"}`,
      additionalNotes: "Additional supply notes",
      notesPlaceholder: "e.g. Food is packed by day; please return any unused supplies at pickup",
    },
    zh: {
      title: "寄养物资", empty: "目前为空，请添加物资", petGroup: "宠物组", no: "序号",
      category: "用品类别", item: "用品名", provider: "谁提供", actions: "操作",
      configure: "配置物资", who: "适用于谁？", intro: "选择这些物资适用的宠物，然后添加寄养期间需要准备的用品。",
      selectAll: "全选", deselectAll: "取消全选", add: "添加物资", edit: "编辑物资",
      delete: "删除物资", save: "保存", cancel: "取消", categoryPlaceholder: "选择或输入用品类别",
      itemPlaceholder: "选择或输入用品名", categoryRequired: "请选择或输入用品类别。",
      itemRequired: "请选择或输入用品名。", choosePets: "请至少选择一只宠物。",
      duplicate: "同一宠物组内的用品不能重复。", other: "其他",
      total: (count: number) => `共 ${count} 件物资`, count: (count: number) => `${count} 件物资`,
      additionalNotes: "物资补充说明",
      notesPlaceholder: "例如：兔粮已按天分装；未使用的物品请在接回时一并归还",
    },
    ja: {
      title: "持ち物", empty: "持ち物はまだありません。追加してください。", petGroup: "ペットグループ",
      no: "番号", category: "用品カテゴリ", item: "用品名", provider: "用意する人", actions: "操作",
      configure: "持ち物を設定", who: "対象のペット", intro: "対象のペットを選び、滞在中に必要な用品を追加します。",
      selectAll: "すべて選択", deselectAll: "すべて解除", add: "用品を追加", edit: "用品を編集",
      delete: "用品を削除", save: "保存", cancel: "キャンセル", categoryPlaceholder: "カテゴリを選択または入力",
      itemPlaceholder: "用品名を選択または入力", categoryRequired: "カテゴリを選択または入力してください。",
      itemRequired: "用品名を選択または入力してください。", choosePets: "ペットを1匹以上選択してください。",
      duplicate: "同じペットグループ内で用品名を重複できません。", other: "その他",
      total: (count: number) => `全 ${count} 品`, count: (count: number) => `${count} 品`,
      additionalNotes: "持ち物についての補足",
      notesPlaceholder: "例：フードは1日分ずつ小分け済みです。未使用の用品はお迎え時に返却してください",
    },
  }[lang];
  const [modal, setModal] = useState<ModalDraft | null>(null);
  const [modalError, setModalError] = useState("");
  const [rowErrors, setRowErrors] = useState<
    Record<string, { category?: string; item?: string }>
  >({});

  const displayPetType = (pet: PetDraft) => {
    const type = pet.type.trim().toUpperCase();
    if (type !== "OTHER")
      return t.settings.pets.typeLabels[
        type as keyof typeof t.settings.pets.typeLabels
      ] ?? petDisplayType(pet);
    return pet.otherType.trim()
      ? localizeOtherPetType(pet.otherType, lang)
      : t.settings.pets.typeLabels.OTHER;
  };
  const petGroups = buildPetCareGroups(pets, displayPetType);
  const options = boardingSupplyOptions(pets, customItems);
  const categoryOptions = [
    { value: "food", label: copy.food, icon: PiBowlFood },
    { value: "stay", label: copy.stay, icon: PiHouseSimple },
    { value: "travel", label: copy.travel, icon: PiSuitcase },
  ];
  const categoryText = (category: SupplyCategory, custom?: string) =>
    category === "food" ? copy.food
      : category === "stay" ? copy.stay
        : category === "travel" ? copy.travel
          : custom?.trim() || ui.other;
  const supplyText = (label: string, custom: boolean) =>
    custom || lang === "en"
      ? label
      : supplyLabelTranslations[label]?.[lang] ?? label;

  const displayRows = (petIds: string[]) => {
    const rows = new Map<string, DisplayRow>();
    options.forEach((option) => {
      const provision = value[option.key];
      if (!petIds.includes(option.petId) || (provision !== "owner" && provision !== "sitter")) return;
      const signature = [option.category, option.categoryLabel?.trim().toLocaleLowerCase(lang) ?? "",
        option.label.trim().toLocaleLowerCase(lang), provision].join("::");
      const existing = rows.get(signature);
      if (existing) {
        if (!existing.petIds.includes(option.petId)) existing.petIds.push(option.petId);
        existing.sourceKeys.push(option.key);
      } else {
        rows.set(signature, {
          key: signature, petIds: [option.petId], sourceKeys: [option.key], category: option.category,
          categoryLabel: categoryText(option.category, option.categoryLabel),
          label: supplyText(option.label, option.custom), sourceLabel: option.label,
          custom: option.custom, provision,
        });
      }
    });
    return Array.from(rows.values());
  };
  const groupedRows = (petIds: string[]) =>
    displayRows(petIds).reduce<Array<{ key: string; petIds: string[]; rows: DisplayRow[] }>>(
      (groups, row) => {
        const orderedIds = petIds.filter((id) => row.petIds.includes(id));
        const key = [...orderedIds].sort().join("|");
        const existing = groups.find((group) => group.key === key);
        if (existing) existing.rows.push(row);
        else groups.push({ key, petIds: orderedIds, rows: [row] });
        return groups;
      }, [],
    );

  const modalGroup = petGroups.find((group) => group.key === modal?.petGroupKey);
  const modalPets = (modalGroup?.petIds ?? []).flatMap((id) => {
    const pet = pets.find((candidate) => candidate.id === id); return pet ? [pet] : [];
  });
  const modalPetType = modalPets[0] ? displayPetType(modalPets[0]) : "";
  const allPetsSelected = modalPets.length > 0 && modalPets.every((pet) => modal?.petIds.includes(pet.id));
  const updateModal = (patch: Partial<ModalDraft>) =>
    setModal((current) => current ? { ...current, ...patch } : current);
  const updateRow = (id: string, patch: Partial<ModalRow>) =>
    setModal((current) => current ? {
      ...current, rows: current.rows.map((row) => row.id === id ? { ...row, ...patch } : row),
    } : current);
  const clearError = (id: string, field: "category" | "item") =>
    setRowErrors((current) => current[id]?.[field]
      ? { ...current, [id]: { ...current[id], [field]: undefined } }
      : current);
  const openAdd = (petGroupKey: string) => {
    const group = petGroups.find((candidate) => candidate.key === petGroupKey);
    setModal({ petGroupKey, petIds: [...(group?.petIds ?? [])], rows: [createRow()], sourceKeys: [] });
    setModalError(""); setRowErrors({});
  };
  const openEdit = (petGroupKey: string, petIds: string[], rows: DisplayRow[]) => {
    setModal({
      petGroupKey, petIds: [...petIds], sourceKeys: rows.flatMap((row) => row.sourceKeys),
      rows: rows.map((row) => ({
        id: crypto.randomUUID(),
        categoryId: row.category === "other" ? customCategoryId : row.category,
        customCategory: row.category === "other" ? row.categoryLabel : "",
        itemId: row.custom ? customItemId : standardItemId(row.category, row.sourceLabel),
        customItem: row.custom ? row.sourceLabel : "",
        provision: row.provision,
      })),
    });
    setModalError(""); setRowErrors({});
  };
  const removeRows = (rows: DisplayRow[]) => {
    const keys = new Set(rows.flatMap((row) => row.sourceKeys));
    onChange(Object.fromEntries(Object.entries(value).filter(([key]) => !keys.has(key))));
    onCustomItemsChange(customItems.filter((item) => !keys.has(`custom:${item.id}`)));
  };
  const itemOptions = (row: ModalRow) => {
    if (!row.categoryId || row.categoryId === customCategoryId) return [];
    const seen = new Set<string>();
    return boardingSupplyOptions(modalPets, []).flatMap((option) => {
      if (option.category !== row.categoryId || seen.has(option.label)) return [];
      seen.add(option.label);
      return [{ value: standardItemId(option.category, option.label), label: supplyText(option.label, false), icon: supplyItemIcon(option.label) }];
    });
  };
  const resolvedCategory = (row: ModalRow) => row.categoryId === customCategoryId
    ? row.customCategory.trim() : row.categoryId ? categoryText(row.categoryId) : "";
  const resolvedItem = (row: ModalRow) => row.itemId === customItemId
    ? row.customItem.trim() : standardItemLabel(row.itemId);

  const saveModal = () => {
    if (!modal) return;
    setModalError(modal.petIds.length ? "" : ui.choosePets);
    const identities = modal.rows.map((row) =>
      `${resolvedCategory(row).replace(/\s+/g, " ").toLocaleLowerCase(lang)}::${resolvedItem(row).replace(/\s+/g, " ").toLocaleLowerCase(lang)}`,
    );
    const counts = identities.reduce<Map<string, number>>((result, key) => {
      if (key !== "::") result.set(key, (result.get(key) ?? 0) + 1);
      return result;
    }, new Map());
    const errors = Object.fromEntries(modal.rows.flatMap((row, index) => {
      const error: { category?: string; item?: string } = {};
      if (!resolvedCategory(row)) error.category = ui.categoryRequired;
      if (!resolvedItem(row)) error.item = ui.itemRequired;
      else if ((counts.get(identities[index]) ?? 0) > 1) error.item = ui.duplicate;
      return Object.keys(error).length ? [[row.id, error]] : [];
    }));
    setRowErrors(errors);
    if (!modal.petIds.length || Object.keys(errors).length) return;

    const oldKeys = new Set(modal.sourceKeys);
    const nextPlan: BoardingSupplyPlan = Object.fromEntries(
      Object.entries(value).filter(([key]) => !oldKeys.has(key)),
    );
    const nextCustom = customItems.filter((item) => !oldKeys.has(`custom:${item.id}`));
    modal.rows.forEach((row) => {
      const category: SupplyCategory = row.categoryId === customCategoryId
        ? "other" : row.categoryId as SupplyCategory;
      const label = resolvedItem(row);
      modal.petIds.forEach((petId) => {
        if (row.itemId !== customItemId && category !== "other") {
          nextPlan[boardingSupplyKey(petId, category, label)] = row.provision;
        } else {
          const id = crypto.randomUUID();
          nextCustom.push({ id, petId, category,
            categoryLabel: category === "other" ? row.customCategory.trim() : undefined, label });
          nextPlan[`custom:${id}`] = row.provision;
        }
      });
    });
    onCustomItemsChange(nextCustom); onChange(nextPlan); setModal(null); setRowErrors({}); setModalError("");
  };

  if (!pets.length) return (
    <div role="alert" className="inline-flex items-center gap-2 rounded-xl border border-danger-border bg-danger-bg px-3.5 py-2.5 text-sm font-bold text-danger-text">
      <PiWarningCircle size={18} />{t.core.needPublishingTaskForm.noPetGroups}
    </div>
  );

  return (
    <div className="space-y-5">
      <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">{ui.title}</h3>
      {petGroups.map((group) => {
        const groupPets = group.petIds.flatMap((id) => {
          const pet = pets.find((candidate) => candidate.id === id); return pet ? [pet] : [];
        });
        const groups = groupedRows(group.petIds);
        const total = groups.reduce((count, itemGroup) => count + itemGroup.rows.length, 0);
        const GroupIcon = petTypes.find((type) => type.id === groupPets[0]?.type)?.icon ?? PiSparkle;
        const names = groupPets.map((pet) => pet.name || displayPetType(pet)).join(" & ");
        return (
          <div key={group.key} className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--primary)]">
              <span>{groupPets[0] ? displayPetType(groupPets[0]) : group.label}</span>
              <span className="inline-flex min-w-0 items-center gap-1 text-xs font-medium text-[#817a85]">
                <GroupIcon size={14} className="shrink-0 text-[var(--primary-muted)]" />
                <span className="truncate">{names}</span>
              </span>
            </h3>
            <div className="relative w-fit max-w-full">
              <p className="absolute bottom-full right-0 mb-1.5 text-[11px] font-medium text-[#817a85]">{ui.total(total)}</p>
              <div className="w-fit max-w-full overflow-x-auto rounded-[15px] border border-[var(--primary-border)] bg-white">
                <table className="w-fit table-auto border-collapse text-left text-xs">
                  <thead className="border-b border-[var(--outline-variant)] bg-[var(--primary-fixed)] text-[11px] font-semibold text-[var(--on-primary-fixed-variant)]">
                    <tr>
                      <th className="max-w-[280px] px-3 py-2.5 text-center">{ui.petGroup}</th>
                      <th className="w-14 px-3 py-2.5 text-center">{ui.no}</th>
                      <th className="max-w-[220px] px-3 py-2.5 text-center">{ui.category}</th>
                      <th className="max-w-[300px] px-3 py-2.5 text-center">{ui.item}</th>
                      <th className="max-w-[180px] px-3 py-2.5 text-center">{ui.provider}</th>
                      <th className="w-20 px-3 py-2.5 text-center">{ui.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eee9ef]">
                    {total ? groups.flatMap((itemGroup) => itemGroup.rows.map((row, index) => {
                      const targetPets = itemGroup.petIds.flatMap((id) => {
                        const pet = groupPets.find((candidate) => candidate.id === id); return pet ? [pet] : [];
                      });
                      const targetNames = targetPets.map((pet) => pet.name || displayPetType(pet)).join(" & ");
                      const ItemIcon = supplyItemIcon(row.sourceLabel);
                      return (
                        <tr key={row.key} className="text-[#514956]">
                          {index === 0 ? <td rowSpan={itemGroup.rows.length} className="max-w-[280px] px-3 py-3 align-middle">
                            <div className="flex flex-wrap gap-2">{targetPets.map((pet) => (
                              <div key={pet.id} className="flex items-center gap-2 rounded-[12px] border border-[#dcd3e3] p-2">
                                <span className="h-8 w-8 overflow-hidden rounded-full"><PetDraftAvatar pet={pet} /></span>
                                <span className="max-w-[120px]"><span className="block truncate text-xs font-bold text-[#35243f]">{pet.name || displayPetType(pet)}</span>
                                  <span className="mt-0.5 block truncate text-[10px] text-[#817a85]">{displayPetType(pet)}</span></span>
                              </div>
                            ))}</div>
                          </td> : null}
                          <td className="px-3 py-3 text-center align-middle"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary-fixed)] text-[10px] font-bold text-[var(--primary)]">{index + 1}</span></td>
                          <td className="max-w-[220px] px-3 py-3 text-center align-middle font-semibold">{row.categoryLabel}</td>
                          <td className="max-w-[300px] px-3 py-3 align-middle"><div className="flex items-center gap-2 font-semibold">
                            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#f6f2f7] text-[#8a5d34]"><ItemIcon size={16} /></span>
                            <span className="break-words">{row.label}</span></div></td>
                          <td className="max-w-[180px] px-3 py-3 text-center align-middle"><span className={cn(
                            "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold",
                            row.provision === "owner" ? "border-sky-200 bg-sky-50 text-sky-700" : "border-amber-300 bg-amber-50 text-amber-800",
                          )}>{row.provision === "owner" ? copy.owner : copy.sitter}</span></td>
                          {index === 0 ? <td rowSpan={itemGroup.rows.length} className="w-20 px-2 py-3 align-middle"><div className="flex justify-center gap-1">
                            <button type="button" aria-label={`${ui.edit} ${targetNames}`} onClick={() => openEdit(group.key, itemGroup.petIds, itemGroup.rows)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--primary)] hover:bg-[var(--primary-fixed)]"><PiPencilSimple size={15} /></button>
                            <button type="button" aria-label={`${ui.delete} ${targetNames}`} onClick={() => removeRows(itemGroup.rows)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-bg text-danger-text hover:bg-danger-ring"><PiTrash size={15} /></button>
                          </div></td> : null}
                        </tr>
                      );
                    })) : <tr><td colSpan={6} className="px-4 py-6 text-center text-xs font-medium text-[#9a939f]">{ui.empty}</td></tr>}
                    <tr><td colSpan={6} className="px-3 py-2.5"><button type="button" onClick={() => openAdd(group.key)} className="inline-flex items-center gap-2 rounded-[11px] border border-[var(--primary-border)] bg-white py-1.5 pl-1.5 pr-3 text-xs font-bold text-[var(--primary)] hover:bg-[var(--primary-subtle)]">
                      <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[var(--primary)] text-white"><PiPlus size={14} /></span>{ui.add}
                    </button></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}

      <Field label={ui.additionalNotes} optional>
        <textarea
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          className={cn(textareaClass, "min-h-24 resize-y")}
          placeholder={ui.notesPlaceholder}
          maxLength={2000}
        />
      </Field>

      {modal ? <ModalShell
        title={`${ui.configure} · ${modalPetType}`} closeLabel={ui.cancel} cancelLabel={ui.cancel}
        saveLabel={ui.save} onClose={() => setModal(null)} onCancel={() => setModal(null)} onSave={saveModal}
        panelClassName="max-w-[1080px] rounded-[20px] border-[#d8c9e3] bg-white" bodyClassName="bg-white md:px-6"
      >
        <p className="text-sm text-[#817a85]">{ui.intro}</p>
        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">{ui.who}</p>
            <button type="button" onClick={() => { updateModal({ petIds: allPetsSelected ? [] : modalPets.map((pet) => pet.id) }); setModalError(""); }}
              className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold", allPetsSelected ? "border-[var(--primary-border-strong)] bg-[var(--primary-fixed)] text-[var(--primary)]" : "border-[#bba9c8] bg-white text-[var(--primary)]")}>
              <PiCheck size={14} />{allPetsSelected ? ui.deselectAll : ui.selectAll}</button></div>
          <div className="flex flex-wrap gap-2">{modalPets.map((pet) => {
            const selected = modal.petIds.includes(pet.id);
            return <button key={pet.id} type="button" aria-pressed={selected} onClick={() => {
              updateModal({ petIds: selected ? modal.petIds.filter((id) => id !== pet.id) : [...modal.petIds, pet.id] }); setModalError("");
            }} className={cn("flex items-center gap-3 rounded-[14px] border p-2.5 text-left", selected ? "border-[var(--primary)] bg-[#f4ecfa] ring-2 ring-[#e7d9f0]" : "border-[#ded9e0] bg-white")}>
              <span className="h-10 w-10 overflow-hidden rounded-full"><PetDraftAvatar pet={pet} /></span>
              <span><span className="block text-sm font-bold text-[#35243f]">{pet.name || displayPetType(pet)}</span><span className="block text-[10px] text-[#817a85]">{displayPetType(pet)}</span></span>
              <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border", selected ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[#cfc7d2] text-transparent")}><PiCheck size={12} /></span>
            </button>;
          })}</div>
          {modalError ? <p role="alert" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-danger-text"><PiWarningCircle size={13} />{modalError}</p> : null}
        </section>
        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">{ui.title}</p><span className="text-[11px] text-[#9a939f]">{ui.count(modal.rows.length)}</span></div>
          <div className="max-h-[330px] overflow-auto rounded-[14px] border border-[var(--primary-border)] bg-white">
            <table className="w-full min-w-[900px] table-fixed border-collapse text-left text-xs">
              <thead className="sticky top-0 z-10 border-b border-[var(--outline-variant)] bg-[var(--primary-fixed)] text-[11px] font-semibold text-[var(--on-primary-fixed-variant)]"><tr>
                <th className="w-[7%] px-3 py-2.5 text-center">{ui.no}</th><th className="w-[27%] px-3 py-2.5 text-center">{ui.category}</th>
                <th className="w-[33%] px-3 py-2.5 text-center">{ui.item}</th><th className="w-[24%] px-3 py-2.5 text-center">{ui.provider}</th><th className="w-[9%] px-3 py-2.5 text-center">{ui.actions}</th>
              </tr></thead>
              <tbody className="divide-y divide-[#eee9ef]">{modal.rows.map((row, index) => <tr key={row.id} className="align-middle text-[#514956]">
                <td className="px-3 py-3 text-center font-bold text-[var(--primary)]">{index + 1}</td>
                <td className="px-3 py-3"><VisitTaskNameCombobox ariaLabel={`${ui.category} ${index + 1}`} value={row.categoryId} customValue={row.customCategory} customValueKey={customCategoryId}
                  options={categoryOptions} placeholder={ui.categoryPlaceholder} error={rowErrors[row.id]?.category} errorId={`supply-category-error-${row.id}`}
                  onChange={(next) => { const changed = next.value !== row.categoryId; updateRow(row.id, { categoryId: next.value as ModalRow["categoryId"], customCategory: next.customValue, ...(changed ? { itemId: "", customItem: "" } : {}) }); clearError(row.id, "category"); if (changed) clearError(row.id, "item"); }} /></td>
                <td className="px-3 py-3"><VisitTaskNameCombobox ariaLabel={`${ui.item} ${index + 1}`} value={row.itemId} customValue={row.customItem} customValueKey={customItemId}
                  options={itemOptions(row)} suggestionsEnabled={itemOptions(row).length > 0} placeholder={ui.itemPlaceholder} error={rowErrors[row.id]?.item} errorId={`supply-item-error-${row.id}`}
                  onChange={(next) => { updateRow(row.id, { itemId: next.value, customItem: next.customValue }); clearError(row.id, "item"); }} /></td>
                <td className="px-3 py-3"><VisitSelect ariaLabel={`${ui.provider} ${index + 1}`} value={row.provision}
                  options={[{ value: "owner", label: copy.owner }, { value: "sitter", label: copy.sitter }]}
                  onChange={(next) => updateRow(row.id, { provision: next as SelectedProvision })} className="h-10 rounded-lg text-xs font-semibold" /></td>
                <td className="px-3 py-3"><div className="flex justify-center"><button type="button" aria-label={`${ui.delete} ${index + 1}`} disabled={modal.rows.length <= 1}
                  onClick={() => updateModal({ rows: modal.rows.filter((candidate) => candidate.id !== row.id) })}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-bg text-danger-text hover:bg-danger-ring disabled:opacity-30"><PiTrash size={15} /></button></div></td>
              </tr>)}</tbody>
            </table>
          </div>
          <button type="button" onClick={() => updateModal({ rows: [...modal.rows, createRow()] })} className="mt-3 inline-flex h-9 items-center gap-2 rounded-[10px] border border-[var(--primary-border)] bg-[var(--primary-fixed)] py-1 pl-1.5 pr-3.5 text-xs font-bold text-[var(--on-primary-fixed-variant)]">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--primary)] text-white"><PiPlus size={15} /></span>{ui.add}
          </button>
        </section>
      </ModalShell> : null}
    </div>
  );
}

// Compatibility export
export const BoardingSuppliesScreen = StepSupplies;
export const GuidedNeedSuppliesStep = StepSupplies;
