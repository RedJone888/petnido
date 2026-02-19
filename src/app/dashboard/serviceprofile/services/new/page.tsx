"use client";

import { useMemo } from "react";
import { useService } from "@/hooks/useService";
import { useServiceProfile } from "@/hooks/useServiceProfile";
import ServiceForm from "@/app/dashboard/serviceprofile/services/ServiceForm";
import { createEmptyService } from "@/domain/service/defaults";
import type { ServiceCreateInput } from "@/lib/zod/services";
import LoadingPage from "@/components/ui/LoadingPage";

export default function NewServicePage() {
  const { getLocationAndCurrency } = useServiceProfile();
  const serviceProfile = getLocationAndCurrency.data;
  const INITIAL_VALUES = useMemo(() => {
    return createEmptyService({
      baseAreaRaw: serviceProfile?.baseAreaRaw || null,
      baseLat: serviceProfile?.baseLat || null,
      baseLon: serviceProfile?.baseLon || null,
      baseCurrency: serviceProfile?.baseCurrency || null,
    });
  }, [serviceProfile]);
  const { createService } = useService();
  const handleSubmit = async (data: ServiceCreateInput) => {
    try {
      await createService.mutateAsync(data);
      console.log("createService", data);
    } catch (error) {
      console.error("提交失败：", error);
    }
  };
  if (getLocationAndCurrency.isLoading) {
    return <LoadingPage title="読み込み中..." />;
  }
  return (
    <ServiceForm
      onSubmit={handleSubmit}
      initialData={INITIAL_VALUES}
      isLoading={createService.isLoading}
    />
  );
}
