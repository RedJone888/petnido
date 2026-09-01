"use client";

import LoadingPage from "@/components/shared/loading-page";
import { useLanguage } from "@/components/providers/language-provider";
import { trpc } from "@/utils/trpc";

import ServiceProfile from "./_components/ServiceProfile";
import { ServiceV2List } from "./_components/ServiceV2List";
import { ServiceBulkManagement } from "./_components/service-bulk-management";
import { ServiceProfileSettings } from "./_components/service-profile-settings";
import { ServiceDraftPanel } from "./_components/service-draft-panel";
import { DevelopmentBadge } from "../_components/development-badge";

export function ServiceProfileDashboardClient({
  showDrafts,
}: {
  showDrafts: boolean;
}) {
  const { t } = useLanguage();
  const copy = t.core.serviceDashboard;
  const settings = trpc.serviceProfile.getSettings.useQuery();
  const hasServiceProfile = Boolean(settings.data?.serviceProfile);
  const getServiceProfile = trpc.serviceProfile.getMine.useQuery(undefined, {
    enabled: hasServiceProfile,
    retry: false,
  });
  const userProfile = getServiceProfile.data;
  if (showDrafts) return <ServiceDraftPanel />;
  return (
    <main className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex h-full w-full flex-col overflow-hidden">
        <header className="flex h-auto shrink-0 items-center border-b border-slate-200/70 px-2 py-3 md:h-[var(--dashboard-title-height)] md:py-0">
          <h1 className="pr-32 text-2xl font-black tracking-tight text-slate-900 md:pr-0">{t.core.dashboard.groupServices}</h1>
        </header>

        {/* Scrollable Content Body */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pb-8 pr-1 pt-4">
          <DevelopmentBadge />
          <ServiceProfileSettings />
          {hasServiceProfile ? (
            <ServiceBulkManagement />
          ) : null}
        {hasServiceProfile ? (
          <ServiceV2List mutable />
        ) : null}
        {hasServiceProfile && getServiceProfile.isLoading ? (
          <LoadingPage title={t.core.common.loading} />
        ) : null}
        {hasServiceProfile && getServiceProfile.isError ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {copy.profileLoadError}
          </p>
        ) : null}
        {userProfile?.serviceProfile ? (
          <ServiceProfile
            key={userProfile.serviceProfile.id}
            serviceProfile={userProfile.serviceProfile}
            profile={userProfile.profile}
          />
        ) : null}
        </div>
      </div>
    </main>
  );
}
