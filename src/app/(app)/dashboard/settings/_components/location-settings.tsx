"use client";

import { Check, MapPin, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";
import {
  fieldClass,
  primaryButtonClass,
  secondaryButtonClass,
  SettingsCard,
} from "./settings-card";

type Precision = "CITY" | "DISTRICT" | "NEIGHBORHOOD" | "MAP_POINT";

const emptyLocation = {
  id: null as string | null,
  label: "",
  regionLabel: "",
  lat: "35.681236",
  lon: "139.767125",
  displayPrecision: "MAP_POINT" as Precision,
  makeDefault: false,
};

export function LocationSettings() {
  const utils = trpc.useUtils();
  const locations = trpc.savedLocation.listMine.useQuery();
  const [form, setForm] = useState(emptyLocation);
  const [showForm, setShowForm] = useState(false);
  const refresh = async () => {
    await utils.savedLocation.listMine.invalidate();
    await utils.serviceProfile.getSettings.invalidate();
  };
  const create = trpc.savedLocation.create.useMutation({ onSuccess: refresh });
  const update = trpc.savedLocation.update.useMutation({ onSuccess: refresh });
  const setDefault = trpc.savedLocation.setDefault.useMutation({ onSuccess: refresh });
  const archive = trpc.savedLocation.archive.useMutation({ onSuccess: refresh });
  const busy = create.isLoading || update.isLoading;

  function resetForm() {
    setForm(emptyLocation);
    setShowForm(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const values = {
      label: form.label.trim() || null,
      regionLabel: form.regionLabel.trim() || undefined,
      lat: Number(form.lat),
      lon: Number(form.lon),
      displayPrecision: form.displayPrecision,
    };
    try {
      if (form.id) await update.mutateAsync({ id: form.id, ...values });
      else await create.mutateAsync({ ...values, makeDefault: form.makeDefault });
      toast.success(form.id ? "場所を更新しました" : "場所を追加しました");
      resetForm();
    } catch {
      toast.error("場所を保存できません。座標と地域名を確認してください");
    }
  }

  return (
    <SettingsCard
      id="locations"
      icon={MapPin}
      title="保存した場所"
      description="正確な住所や住居の詳細は保存しません。地図座標と任意の大まかな地域名だけを使用します。"
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          地域名には市区町村やエリア名だけを入力し、番地や住居の詳細は入力しないでください。
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setForm(emptyLocation);
              setShowForm(true);
            }}
            className={secondaryButtonClass}
          >
            <Plus className="mr-2 h-4 w-4" />
            場所を追加
          </button>
        </div>

        {showForm && (
          <form onSubmit={submit} className="rounded-2xl border border-primary/20 bg-purple-50/40 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">{form.id ? "場所を編集" : "新しい場所"}</h3>
              <button type="button" onClick={resetForm} aria-label="入力を閉じる" className="rounded-lg p-2 text-slate-500 hover:bg-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                登録名（任意）
                <input maxLength={50} value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} placeholder="例：自宅周辺" className={fieldClass} />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                地域名（任意・大まかな表示）
                <input maxLength={120} value={form.regionLabel} onChange={(event) => setForm({ ...form, regionLabel: event.target.value })} placeholder="例：世田谷区、東京都" className={fieldClass} />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                緯度
                <input required type="number" min={-90} max={90} step="0.000001" value={form.lat} onChange={(event) => setForm({ ...form, lat: event.target.value })} className={fieldClass} />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                経度
                <input required type="number" min={-180} max={180} step="0.000001" value={form.lon} onChange={(event) => setForm({ ...form, lon: event.target.value })} className={fieldClass} />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                表示精度
                <select value={form.displayPrecision} onChange={(event) => setForm({ ...form, displayPrecision: event.target.value as Precision })} className={fieldClass}>
                  <option value="MAP_POINT">本人用の地図点</option>
                  <option value="NEIGHBORHOOD">周辺地域</option>
                  <option value="DISTRICT">市区町村</option>
                  <option value="CITY">都市</option>
                </select>
              </label>
              {!form.id && (
                <label className="flex items-center gap-3 self-end rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={form.makeDefault} onChange={(event) => setForm({ ...form, makeDefault: event.target.checked })} className="h-4 w-4 accent-primary" />
                  既定の場所にする
                </label>
              )}
            </div>
            <button type="submit" disabled={busy || !form.lat || !form.lon} className={`${primaryButtonClass} mt-4`}>
              {busy ? "保存中..." : "保存"}
            </button>
          </form>
        )}

        {locations.isLoading ? (
          <p className="text-sm text-slate-500">読み込み中...</p>
        ) : locations.data?.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {locations.data.map((location) => (
              <article key={location.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900">{location.label || "名称未設定"}</h3>
                      {location.isDefault && <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary"><Star className="h-3 w-3 fill-current" />既定</span>}
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{location.regionLabel || "地域名なし"}</p>
                    <p className="mt-1 font-mono text-xs text-slate-400">{String(location.lat)}, {String(location.lon)}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {!location.isDefault && (
                      <button type="button" aria-label={`${location.label || "場所"}を既定にする`} disabled={setDefault.isLoading} onClick={async () => {
                        try {
                          await setDefault.mutateAsync({ id: location.id });
                          toast.success("既定の場所を変更しました");
                        } catch { toast.error("既定の場所を変更できませんでした"); }
                      }} className="rounded-lg p-2 text-slate-500 hover:bg-green-50 hover:text-green-700"><Check className="h-4 w-4" /></button>
                    )}
                    <button type="button" aria-label={`${location.label || "場所"}を編集`} onClick={() => {
                      setForm({ id: location.id, label: location.label ?? "", regionLabel: location.regionLabel ?? "", lat: String(location.lat), lon: String(location.lon), displayPrecision: location.displayPrecision as Precision, makeDefault: location.isDefault });
                      setShowForm(true);
                    }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-primary"><Pencil className="h-4 w-4" /></button>
                    <button type="button" aria-label={`${location.label || "場所"}を削除`} disabled={archive.isLoading} onClick={async () => {
                      if (!window.confirm("この場所を登録情報から削除しますか？")) return;
                      try {
                        await archive.mutateAsync({ id: location.id });
                        toast.success("場所を削除しました");
                      } catch { toast.error("場所を削除できませんでした"); }
                    }} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">まだ場所が登録されていません。</p>
        )}
      </div>
    </SettingsCard>
  );
}
