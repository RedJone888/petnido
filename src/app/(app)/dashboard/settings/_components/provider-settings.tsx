"use client";

import { Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";
import {
  fieldClass,
  primaryButtonClass,
  SettingsCard,
  textareaClass,
} from "./settings-card";

const currencies = ["JPY", "USD", "EUR", "CNY", "TWD", "KRW", "GBP"] as const;
type CurrencyValue = (typeof currencies)[number];

export function ProviderSettings() {
  const utils = trpc.useUtils();
  const settings = trpc.serviceProfile.getSettings.useQuery();
  const locations = trpc.savedLocation.listMine.useQuery();
  const [introduction, setIntroduction] = useState("");
  const [monthsExperience, setMonthsExperience] = useState("");
  const [defaultLocationId, setDefaultLocationId] = useState("");
  const [baseCurrency, setBaseCurrency] = useState<CurrencyValue | "">("");

  useEffect(() => {
    const serviceProfile = settings.data?.serviceProfile;
    if (!serviceProfile) return;
    setIntroduction(serviceProfile.introduction ?? "");
    setMonthsExperience(
      serviceProfile.monthsExperience == null
        ? ""
        : String(serviceProfile.monthsExperience),
    );
    setDefaultLocationId(serviceProfile.defaultLocationId ?? "");
    setBaseCurrency((serviceProfile.baseCurrency as CurrencyValue | null) ?? "");
  }, [settings.data]);

  async function refresh() {
    await Promise.all([
      utils.serviceProfile.getSettings.invalidate(),
      utils.serviceProfile.getMine.invalidate(),
      utils.serviceProfile.getLocationAndCurrency.invalidate(),
    ]);
  }

  const enable = trpc.serviceProfile.enableOffering.useMutation({ onSuccess: refresh });
  const update = trpc.serviceProfile.updateSettings.useMutation({ onSuccess: refresh });
  const setAccepting = trpc.serviceProfile.setAccepting.useMutation({ onSuccess: refresh });
  const serviceProfile = settings.data?.serviceProfile;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    try {
      await update.mutateAsync({
        introduction: introduction.trim() || null,
        monthsExperience:
          monthsExperience === "" ? null : Number(monthsExperience),
        defaultLocationId: defaultLocationId || null,
        baseCurrency: baseCurrency || null,
      });
      toast.success("サービスプロフィールを保存しました");
    } catch {
      toast.error("サービスプロフィールを保存できませんでした");
    }
  }

  return (
    <SettingsCard
      id="provider"
      icon={Settings2}
      title="サービスプロフィール"
      description="経験、既定のサービス場所、通貨と受付全体スイッチを管理します。依頼作成とサービス提供は同時に利用できます。"
    >
      {settings.isLoading ? (
        <p className="text-sm text-slate-500">読み込み中...</p>
      ) : !serviceProfile ? (
        <div className="rounded-2xl border border-primary/20 bg-purple-50/50 p-5">
          <h3 className="font-bold text-slate-900">サービス提供を始めますか？</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            受付モードを開始すると、サービスプロフィールを作成できます。サービス自体は別途作成・公開します。
          </p>
          <button
            type="button"
            disabled={enable.isLoading}
            onClick={async () => {
              if (!window.confirm("受付モードを開始しますか？")) return;
              try {
                await enable.mutateAsync();
                toast.success("受付モードを開始しました");
              } catch {
                toast.error("受付モードを開始できませんでした");
              }
            }}
            className={`${primaryButtonClass} mt-4`}
          >
            {enable.isLoading ? "開始中..." : "受付モードを開始"}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-slate-900">すべてのサービスの受付</h3>
              <p className="mt-1 text-sm text-slate-500">
                停止しても既存の予約やメッセージには影響しません。
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={serviceProfile.isAccepting}
              disabled={setAccepting.isLoading}
              onClick={async () => {
                const next = !serviceProfile.isAccepting;
                if (!next && !window.confirm("すべての新規受付を停止しますか？")) return;
                try {
                  await setAccepting.mutateAsync({ active: next });
                  toast.success(next ? "受付を再開しました" : "受付を停止しました");
                } catch {
                  toast.error("受付状態を変更できませんでした");
                }
              }}
              className={`relative h-8 w-14 rounded-full transition ${serviceProfile.isAccepting ? "bg-primary" : "bg-slate-300"}`}
            >
              <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${serviceProfile.isAccepting ? "left-7" : "left-1"}`} />
            </button>
          </div>

          <form onSubmit={save} className="space-y-5">
            <label className="block text-sm font-semibold text-slate-700">
              経験・自己紹介
              <textarea rows={6} maxLength={2000} value={introduction} onChange={(event) => setIntroduction(event.target.value)} className={textareaClass} />
            </label>
            <div className="grid gap-5 sm:grid-cols-3">
              <label className="text-sm font-semibold text-slate-700">
                経験月数
                <input type="number" min={0} max={1200} value={monthsExperience} onChange={(event) => setMonthsExperience(event.target.value)} className={fieldClass} />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                既定のサービス場所
                <select value={defaultLocationId} onChange={(event) => setDefaultLocationId(event.target.value)} className={fieldClass}>
                  <option value="">未設定</option>
                  {locations.data?.map((location) => (
                    <option key={location.id} value={location.id}>{location.label || location.regionLabel || "名称未設定"}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">
                常用通貨
                <select value={baseCurrency} onChange={(event) => setBaseCurrency(event.target.value as CurrencyValue | "")} className={fieldClass}>
                  <option value="">未設定</option>
                  {currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
                </select>
              </label>
            </div>
            <p className="text-xs leading-5 text-slate-500">
              ここでの場所と通貨は今後のサービス作成時の既定値です。公開済みサービスの一括変更は、公開フローの統合段階で追加します。
            </p>
            <button type="submit" disabled={update.isLoading} className={primaryButtonClass}>
              {update.isLoading ? "保存中..." : "サービスプロフィールを保存"}
            </button>
          </form>
        </div>
      )}
    </SettingsCard>
  );
}
