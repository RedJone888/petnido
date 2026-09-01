"use client";

import { History, PawPrint, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useLanguage } from "@/components/providers/language-provider";
import { ModalShell } from "@/components/ui/modal-shell";
import {
  emptyPetProfileEditorValue,
  petProfileTypes,
  PetProfileAddButton,
  PetProfileCard,
  PetProfileEditorDialog,
  type PetProfileEditorErrors,
  type PetProfileEditorValue,
  type PetProfileType,
} from "@/components/pets/pet-profile-components";
import {
  localizeOtherPetType,
  localizePetBreed,
} from "@/domain/pet/profile-options";
import { useConfirm } from "@/hooks/useConfirm";
import { useConfirmStore } from "@/store/useConfirmStore";
import { trpc } from "@/utils/trpc";
import { SettingsCard, SettingsTabSkeleton } from "./settings-card";

const legacyCustomTypes: Record<string, string> = {
  CHINCHILLA: "Chinchilla",
  GUINEA_PIG: "Guinea pig",
  HAMSTER: "Hamster",
};

const emptyErrors: PetProfileEditorErrors = {};

function freshEmptyForm(): PetProfileEditorValue {
  return { ...emptyPetProfileEditorValue, photos: [] };
}

export function PetSettings() {
  const { t, lang } = useLanguage();
  const copy = t.settings.pets;
  const confirm = useConfirm();
  const setConfirmLoading = useConfirmStore((state) => state.setIsDeleting);
  const closeConfirm = useConfirmStore((state) => state.close);
  const utils = trpc.useUtils();
  const pets = trpc.pet.listMine.useQuery();
  const importCandidates = trpc.pet.listImportCandidates.useQuery();
  const [form, setForm] = useState<PetProfileEditorValue>(freshEmptyForm);
  const [errors, setErrors] = useState<PetProfileEditorErrors>(emptyErrors);
  const [showForm, setShowForm] = useState(false);
  const [showImportCandidates, setShowImportCandidates] = useState(false);
  const [importingSnapshotId, setImportingSnapshotId] = useState<string | null>(
    null,
  );
  const previousLanguage = useRef(lang);
  const refresh = () => utils.pet.listMine.invalidate();
  const create = trpc.pet.create.useMutation({ onSuccess: refresh });
  const update = trpc.pet.update.useMutation({ onSuccess: refresh });
  const archive = trpc.pet.archive.useMutation({ onSuccess: refresh });
  const importSnapshot = trpc.pet.importFromNeedSnapshot.useMutation({
    onSuccess: async () => {
      await Promise.all([refresh(), utils.pet.listImportCandidates.invalidate()]);
    },
  });
  const busy = create.isLoading || update.isLoading;
  const petCount = pets.data?.length ?? 0;
  const petCountLabel = copy.countSummary
    .replace("{count}", String(petCount))
    .replace(/^You currently have ([01]) pets$/, "You currently have $1 pet");
  const historyCopy = {
    en: {
      title: "Pets found in previous requests",
      description: "These pet details were used in an earlier care request but are not in your current profiles. Import only the pets you still want to reuse.",
      prompt: "You used {count} pets in previous requests. Import them to your pet profiles?",
      import: "Import",
      importing: "Importing…",
      close: "Close",
      success: "Pet imported to your profiles",
      error: "This pet could not be imported",
    },
    zh: {
      title: "在历史需求中发现的宠物",
      description: "这些宠物信息曾用于你发布的照护需求，但不在当前宠物档案中。你可以按需导入，以便之后继续使用。",
      prompt: "你曾在发布的需求中使用过 {count} 只宠物，要导入到宠物档案吗？",
      import: "导入档案",
      importing: "正在导入……",
      close: "关闭",
      success: "宠物信息已导入档案",
      error: "无法导入这条宠物信息",
    },
    ja: {
      title: "以前の依頼で見つかったペット",
      description: "以前の依頼で使われましたが、現在のプロフィールにはないペット情報です。今後も使うペットだけを取り込めます。",
      prompt: "以前の依頼で {count} 匹のペットを使用しました。プロフィールに取り込みますか？",
      import: "取り込む",
      importing: "取り込み中…",
      close: "閉じる",
      success: "ペットプロフィールに取り込みました",
      error: "ペット情報を取り込めませんでした",
    },
  }[lang];
  const moduleCopy = {
    en: {
      title: "Saved pet profiles",
      description: "Manage the pets you can reuse in future care requests and bookings.",
    },
    zh: {
      title: "已保存的宠物档案",
      description: "管理可在之后发布照护需求或预约时重复使用的宠物信息。",
    },
    ja: {
      title: "保存済みのペットプロフィール",
      description: "今後の依頼や予約で再利用できるペット情報を管理します。",
    },
  }[lang];
  const groupedPets = [...(pets.data ?? [])].reduce((groups, pet) => {
    const key = pet.type;
    const current = groups.get(key) ?? [];
    current.push(pet);
    groups.set(key, current);
    return groups;
  }, new Map<string, NonNullable<typeof pets.data>>());
  const typeLabel = (type: string, customType?: string | null) =>
    (t.core.pets as Record<string, string>)[type] ?? customType ?? type;

  useEffect(() => {
    if (previousLanguage.current === lang) return;
    setForm((current) => {
      const localizedCustomType =
        current.type === "OTHER"
          ? localizeOtherPetType(current.customType, lang)
          : current.customType;
      return {
        ...current,
        customType: localizedCustomType,
        breed: localizePetBreed(
          current.breed,
          lang,
          current.type,
          current.customType,
        ),
      };
    });
    previousLanguage.current = lang;
  }, [lang]);

  function resetForm() {
    setForm(freshEmptyForm());
    setErrors(emptyErrors);
    setShowForm(false);
  }

  async function submit() {
    const nextErrors: PetProfileEditorErrors = {
      name: form.name.trim() ? "" : copy.nameRequired,
      type: form.type ? "" : copy.typeRequired,
      customType:
        form.type === "OTHER" && !form.customType.trim()
          ? copy.customTypeRequired
          : "",
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.type || nextErrors.customType) return;

    const petType = form.type as PetProfileType;
    const values = {
      name: form.name.trim(),
      type: petType,
      customType: petType === "OTHER" ? form.customType.trim() || null : null,
      breed: form.breed.trim() || null,
      age: null,
      birthDate: form.birthDate
        ? new Date(`${form.birthDate}T00:00:00.000Z`)
        : null,
      weightGrams:
        form.weight === ""
          ? null
          : Math.round(
              Number(form.weight) * (form.weightUnit === "kg" ? 1000 : 1),
            ),
      sex: form.sex || null,
      neutered: form.neutered || null,
      notes: form.notes.trim() || null,
      photoIds: form.photos.map((photo) => photo.id),
    };
    try {
      if (form.id) await update.mutateAsync({ id: form.id, ...values });
      else await create.mutateAsync(values);
      toast.success(form.id ? copy.updateSuccess : copy.createSuccess);
      resetForm();
    } catch {
      toast.error(copy.saveError);
    }
  }

  function openEditor(pet: NonNullable<typeof pets.data>[number]) {
    const editType =
      petProfileTypes.includes(pet.type as PetProfileType) &&
      pet.type !== "OTHER"
        ? (pet.type as PetProfileType)
        : "OTHER";
    const editCustomType = pet.customType ?? legacyCustomTypes[pet.type] ?? "";
    setForm({
      id: pet.id,
      name: pet.name ?? "",
      type: editType,
      customType: localizeOtherPetType(editCustomType, lang),
      breed: localizePetBreed(
        pet.breed ?? "",
        lang,
        pet.type,
        editCustomType,
      ),
      birthDate: pet.birthDate
        ? new Date(pet.birthDate).toISOString().slice(0, 10)
        : "",
      weight:
        pet.weightGrams == null ? "" : String(pet.weightGrams / 1000),
      weightUnit: "kg",
      sex: (pet.sex ?? "") as PetProfileEditorValue["sex"],
      neutered: (pet.neutered ?? "") as PetProfileEditorValue["neutered"],
      photos: pet.photos.map((photo) => ({
        ...photo,
        isUploading: false,
      })),
      notes: pet.notes ?? "",
    });
    setErrors(emptyErrors);
    setShowForm(true);
  }

  return (
    <SettingsCard
      id="pets"
      icon={PawPrint}
      title={moduleCopy.title}
      description={moduleCopy.description}
    >
      {pets.isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5">
          <SettingsTabSkeleton variant="pets" />
        </div>
      ) : (
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-slate-600">
            {petCountLabel}
          </p>
          <PetProfileAddButton
            label={copy.add}
            onClick={() => {
              setForm(freshEmptyForm());
              setErrors(emptyErrors);
              setShowForm(true);
            }}
          />
        </div>

        {showForm ? (
          <PetProfileEditorDialog
            value={form}
            mode={form.id ? "edit" : "create"}
            errors={errors}
            busy={busy}
            onChange={(next) => {
              setForm(next);
              if (errors.name || errors.type || errors.customType) {
                setErrors(emptyErrors);
              }
            }}
            onCancel={resetForm}
            onSubmit={() => void submit()}
          />
        ) : null}

        {importCandidates.data?.length ? (
          <section className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800">
                <History className="h-4.5 w-4.5" />
              </span>
              <p className="text-sm leading-5 text-amber-950">
                {historyCopy.prompt.replace(
                  "{count}",
                  String(importCandidates.data.length),
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowImportCandidates(true)}
              className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-xs font-bold text-amber-900 transition hover:bg-amber-100"
            >
              {historyCopy.import}
            </button>
          </section>
        ) : null}

        {showImportCandidates && importCandidates.data?.length ? (
          <ModalShell
            title={historyCopy.title}
            titleId="import-pet-candidates-title"
            closeLabel={historyCopy.close}
            cancelLabel={historyCopy.close}
            showSave={false}
            onClose={() => setShowImportCandidates(false)}
            panelClassName="max-w-3xl"
            bodyClassName="space-y-4"
          >
            <p className="text-sm leading-6 text-slate-600">
              {historyCopy.description}
            </p>
            <div className="grid items-start gap-3 sm:grid-cols-2">
              {importCandidates.data.map((candidate) => {
                const isImporting =
                  importingSnapshotId === candidate.snapshotId;
                return (
                  <PetProfileCard
                    key={candidate.snapshotId}
                    pet={{
                      id: candidate.snapshotId,
                      name: candidate.name ?? "",
                      type: candidate.type,
                      customType: candidate.customType ?? "",
                      breed: candidate.breed,
                      birthDate: candidate.birthDate,
                      weightGrams: candidate.weightGrams,
                      sex: candidate.sex,
                      neutered: candidate.neutered,
                      notes: candidate.notes,
                    }}
                    cardAction={
                      <button
                        type="button"
                        disabled={importingSnapshotId !== null}
                        onClick={async () => {
                          setImportingSnapshotId(candidate.snapshotId);
                          try {
                            await importSnapshot.mutateAsync({
                              snapshotId: candidate.snapshotId,
                            });
                            if (importCandidates.data.length <= 1) {
                              setShowImportCandidates(false);
                            }
                            toast.success(historyCopy.success);
                          } catch {
                            toast.error(historyCopy.error);
                          } finally {
                            setImportingSnapshotId(null);
                          }
                        }}
                        className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-xl border border-primary/20 bg-white px-2.5 text-xs font-bold text-primary transition hover:bg-primary/[0.06] disabled:opacity-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {isImporting
                          ? historyCopy.importing
                          : historyCopy.import}
                      </button>
                    }
                  />
                );
              })}
            </div>
          </ModalShell>
        ) : null}

        {pets.data?.length ? (
          <div className="space-y-6">
            {[...groupedPets.entries()].map(([type, groupPets]) => (
              <section key={type} aria-labelledby={`pet-group-${type}`}>
                <div className="mb-3 flex items-center gap-2">
                  <PawPrint className="h-4 w-4 text-primary" />
                  <h2 id={`pet-group-${type}`} className="text-sm font-bold text-slate-800">
                    {typeLabel(type, groupPets[0]?.customType)}
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{groupPets.length}</span>
                </div>
                <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
            {groupPets.map((pet) => (
              <PetProfileCard
                key={pet.id}
                pet={{
                  id: pet.id,
                  name: pet.name ?? "",
                  type: pet.type,
                  customType:
                    pet.customType ?? legacyCustomTypes[pet.type] ?? "",
                  breed: pet.breed,
                  birthDate: pet.birthDate,
                  weightGrams: pet.weightGrams,
                  sex: pet.sex,
                  neutered: pet.neutered,
                  notes: pet.notes,
                  photoUrl: pet.photos[0]?.url,
                }}
                editLabel={copy.editAria.replace("{name}", pet.name ?? "")}
                deleteLabel={copy.deleteAria.replace("{name}", pet.name ?? "")}
                deleteDisabled={archive.isLoading}
                hideTypeFallback
                onEdit={() => openEditor(pet)}
                onDelete={async () => {
                  const deleteLabel = copy.deleteAria.replace(
                    "{name}",
                    pet.name ?? "",
                  );
                  const accepted = await confirm({
                    title: deleteLabel,
                    content: (
                      <p>
                        {copy.deleteQuestion.replace(
                          "{name}",
                          pet.name ?? "",
                        )}
                      </p>
                    ),
                    confirmText: deleteLabel,
                    variant: "danger",
                  });
                  if (!accepted) return;
                  setConfirmLoading(true);
                  try {
                    await archive.mutateAsync({ id: pet.id });
                    toast.success(copy.deleteSuccess);
                  } catch {
                    toast.error(copy.deleteError);
                  } finally {
                    setConfirmLoading(false);
                    closeConfirm();
                  }
                }}
              />
            ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
            {copy.none}
          </p>
        )}
      </div>
      )}
    </SettingsCard>
  );
}
