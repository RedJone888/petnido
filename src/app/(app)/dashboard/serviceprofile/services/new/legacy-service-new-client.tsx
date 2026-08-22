"use client";

import { useMemo } from "react";

import LoadingPage from "@/components/shared/loading-page";
import { createEmptyService } from "@/domain/service/defaults";
import { useService } from "@/hooks/useService";
import { useServiceProfile } from "@/hooks/useServiceProfile";
import type { ServiceCreateInput } from "@/lib/zod/services";
import { ServiceForm } from "../_components/form";
import { useLanguage } from "@/components/providers/language-provider";

export function LegacyServiceNewClient() {
  const { t } = useLanguage();
  const { getLocationAndCurrency } = useServiceProfile();
  const serviceProfile = getLocationAndCurrency.data;
  const initialValues = useMemo(
    () =>
      createEmptyService({
        baseAreaRaw: serviceProfile?.baseAreaRaw || null,
        baseLat: serviceProfile?.baseLat || null,
        baseLon: serviceProfile?.baseLon || null,
        baseCurrency: serviceProfile?.baseCurrency || null,
      }),
    [serviceProfile],
  );
  const { createService } = useService();

  const handleSubmit = async (data: ServiceCreateInput) => {
    await createService.mutateAsync(data);
  };

  if (getLocationAndCurrency.isLoading) {
    return <LoadingPage title={t.core.common.loading} />;
  }
  return (
    <ServiceForm
      onSubmit={handleSubmit}
      initialData={initialValues}
      isLoading={createService.isLoading}
    />
  );
}
