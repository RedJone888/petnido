"use client";

import { Pencil, PawPrint, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";
import {
  fieldClass,
  primaryButtonClass,
  secondaryButtonClass,
  SettingsCard,
  textareaClass,
} from "./settings-card";

const petTypes = [
  ["DOG", "犬"],
  ["CAT", "猫"],
  ["RABBIT", "うさぎ"],
  ["BIRD", "鳥"],
  ["CHINCHILLA", "チンチラ"],
  ["GUINEA_PIG", "モルモット"],
  ["HAMSTER", "ハムスター"],
  ["OTHER", "その他"],
] as const;

type PetTypeValue = (typeof petTypes)[number][0];

const emptyForm = {
  id: null as string | null,
  name: "",
  type: "DOG" as PetTypeValue,
  breed: "",
  age: "",
  notes: "",
};

export function PetSettings() {
  const utils = trpc.useUtils();
  const pets = trpc.pet.listMine.useQuery();
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const refresh = () => utils.pet.listMine.invalidate();
  const create = trpc.pet.create.useMutation({ onSuccess: refresh });
  const update = trpc.pet.update.useMutation({ onSuccess: refresh });
  const archive = trpc.pet.archive.useMutation({ onSuccess: refresh });
  const busy = create.isLoading || update.isLoading;

  function resetForm() {
    setForm(emptyForm);
    setShowForm(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const values = {
      name: form.name,
      type: form.type,
      breed: form.breed.trim() || null,
      age: form.age === "" ? null : Number(form.age),
      notes: form.notes.trim() || null,
    };
    try {
      if (form.id) await update.mutateAsync({ id: form.id, ...values });
      else await create.mutateAsync(values);
      toast.success(form.id ? "ペットプロフィールを更新しました" : "ペットプロフィールを追加しました");
      resetForm();
    } catch {
      toast.error("ペットプロフィールを保存できませんでした");
    }
  }

  return (
    <SettingsCard
      id="pets"
      icon={PawPrint}
      title="ペットプロフィール"
      description="依頼作成時にここから選べます。健康・ケアメモは本人と取引関係者だけが扱う保護情報です。"
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setForm(emptyForm);
              setShowForm(true);
            }}
            className={secondaryButtonClass}
          >
            <Plus className="mr-2 h-4 w-4" />
            ペットを追加
          </button>
        </div>

        {showForm && (
          <form onSubmit={submit} className="rounded-2xl border border-primary/20 bg-purple-50/40 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">
                {form.id ? "ペットを編集" : "新しいペット"}
              </h3>
              <button type="button" onClick={resetForm} aria-label="入力を閉じる" className="rounded-lg p-2 text-slate-500 hover:bg-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                名前
                <input required maxLength={80} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={fieldClass} />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                種類
                <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as PetTypeValue })} className={fieldClass}>
                  {petTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">
                品種（任意）
                <input maxLength={120} value={form.breed} onChange={(event) => setForm({ ...form, breed: event.target.value })} className={fieldClass} />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                年齢（年）
                <input type="number" min={0} max={100} value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} className={fieldClass} />
              </label>
            </div>
            <label className="mt-4 block text-sm font-semibold text-slate-700">
              健康・性格・ケアメモ（任意）
              <textarea rows={4} maxLength={3000} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className={textareaClass} />
            </label>
            <button type="submit" disabled={busy || !form.name.trim()} className={`${primaryButtonClass} mt-4`}>
              {busy ? "保存中..." : "保存"}
            </button>
          </form>
        )}

        {pets.isLoading ? (
          <p className="text-sm text-slate-500">読み込み中...</p>
        ) : pets.data?.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {pets.data.map((pet) => (
              <article key={pet.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900">{pet.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {petTypes.find(([value]) => value === pet.type)?.[1] ?? pet.type}
                      {pet.breed ? ` · ${pet.breed}` : ""}
                      {pet.age != null ? ` · ${pet.age}歳` : ""}
                    </p>
                    {pet.notes && <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm leading-6 text-slate-600">{pet.notes}</p>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      aria-label={`${pet.name}を編集`}
                      onClick={() => {
                        setForm({ id: pet.id, name: pet.name ?? "", type: pet.type, breed: pet.breed ?? "", age: pet.age == null ? "" : String(pet.age), notes: pet.notes ?? "" });
                        setShowForm(true);
                      }}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`${pet.name}を削除`}
                      disabled={archive.isLoading}
                      onClick={async () => {
                        if (!window.confirm(`${pet.name}をプロフィールから削除しますか？`)) return;
                        try {
                          await archive.mutateAsync({ id: pet.id });
                          toast.success("ペットプロフィールを削除しました");
                        } catch {
                          toast.error("削除できませんでした");
                        }
                      }}
                      className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">まだペットが登録されていません。</p>
        )}
      </div>
    </SettingsCard>
  );
}
