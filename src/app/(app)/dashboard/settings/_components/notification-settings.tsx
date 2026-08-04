"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";
import { useLanguage } from "@/components/providers/language-provider";
import { primaryButtonClass, SettingsCard } from "./settings-card";

export function NotificationSettings() {
  const { t } = useLanguage();
  const copy = t.settings.notifications;
  const preference = trpc.notificationPreference.getMine.useQuery();
  const [emailInstant, setEmailInstant] = useState(false);
  useEffect(() => {
    if (preference.data) setEmailInstant(preference.data.emailInstant);
  }, [preference.data]);
  const update = trpc.notificationPreference.updateMine.useMutation({
    onSuccess: async () => {
      await preference.refetch();
      toast.success(copy.success);
    },
    onError: () => toast.error(copy.error),
  });

  return (
    <SettingsCard
      id="notifications"
      icon={Bell}
      title={copy.title}
      description={copy.description}
    >
      {preference.isLoading ? (
        <p className="text-sm text-slate-500">{copy.loading}</p>
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
              <span className="block font-bold text-slate-900">{copy.emailTitle}</span>
              <span className="mt-1 block text-sm leading-6 text-slate-500">
                {copy.emailDescription}
              </span>
            </span>
          </label>
          <button
            type="button"
            disabled={update.isLoading}
            onClick={() => update.mutate({ emailInstant })}
            className={primaryButtonClass}
          >
            {update.isLoading ? copy.saving : copy.save}
          </button>
        </div>
      )}
    </SettingsCard>
  );
}
