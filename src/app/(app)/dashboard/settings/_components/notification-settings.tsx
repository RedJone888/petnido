"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";
import { primaryButtonClass, SettingsCard } from "./settings-card";

export function NotificationSettings() {
  const preference = trpc.notificationPreference.getMine.useQuery();
  const [emailInstant, setEmailInstant] = useState(false);
  useEffect(() => {
    if (preference.data) setEmailInstant(preference.data.emailInstant);
  }, [preference.data]);
  const update = trpc.notificationPreference.updateMine.useMutation({
    onSuccess: async () => {
      await preference.refetch();
      toast.success("通知設定を保存しました");
    },
    onError: () => toast.error("通知設定を保存できませんでした"),
  });

  return (
    <SettingsCard
      id="notifications"
      icon={Bell}
      title="通知設定"
      description="メールを登録している場合、新しいメッセージをすぐメールで知らせる設定です。"
    >
      {preference.isLoading ? (
        <p className="text-sm text-slate-500">読み込み中...</p>
      ) : (
        <div className="space-y-5">
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <input
              type="checkbox"
              checked={emailInstant}
              onChange={(event) => setEmailInstant(event.target.checked)}
              className="mt-1 h-4 w-4 accent-primary"
            />
            <span>
              <span className="block font-bold text-slate-900">新しいメッセージをメールで知らせる</span>
              <span className="mt-1 block text-sm leading-6 text-slate-500">
                この段階では通知設定のみを保存します。実際の業務メール送信は通知段階で有効化します。
              </span>
            </span>
          </label>
          <button
            type="button"
            disabled={update.isLoading}
            onClick={() => update.mutate({ emailInstant })}
            className={primaryButtonClass}
          >
            {update.isLoading ? "保存中..." : "通知設定を保存"}
          </button>
        </div>
      )}
    </SettingsCard>
  );
}
