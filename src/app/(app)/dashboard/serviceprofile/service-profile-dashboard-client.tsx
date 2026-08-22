"use client";

import LoadingPage from "@/components/shared/loading-page";
import { useLanguage } from "@/components/providers/language-provider";
import { trpc } from "@/utils/trpc";

import ServiceProfile from "./_components/ServiceProfile";
import { ServiceV2List } from "./_components/ServiceV2List";
import { ServiceBulkManagement } from "./_components/service-bulk-management";
import { ServiceProfileSettings } from "./_components/service-profile-settings";

export function ServiceProfileDashboardClient({
  publishingV2Enabled,
  publishingV2Mutable,
}: {
  publishingV2Enabled: boolean;
  publishingV2Mutable: boolean;
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
  return (
    <main className="w-full h-full flex flex-col overflow-hidden">
      <div className="mx-auto max-w-7xl w-full h-full flex flex-col overflow-hidden">
        {/* Fixed Top Section: ServiceProfileSettings */}
        <div className="shrink-0 pb-3">
          <ServiceProfileSettings />
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 pb-8 space-y-6">
          {hasServiceProfile && publishingV2Enabled && publishingV2Mutable ? (
            <ServiceBulkManagement />
          ) : null}
        {hasServiceProfile && publishingV2Enabled ? (
          <ServiceV2List mutable={publishingV2Mutable} />
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
