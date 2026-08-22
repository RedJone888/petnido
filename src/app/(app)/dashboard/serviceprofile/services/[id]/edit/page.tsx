"use client";
import { useService } from "@/hooks/useService";
import { serviceApiToForm } from "@/domain/service/mapper";
import type { ServiceCreateInput } from "@/lib/zod/services";
import { ServiceForm } from "../../_components/form";
import LoadingPage from "@/components/shared/loading-page";
import { useLanguage } from "@/components/providers/language-provider";
export default function ServiceEditPage({
  params,
}: {
  params: { id: string };
}) {
  const { t } = useLanguage();
  const { getServiceById, updateService } = useService(params.id);
  const handleSubmit = async (data: ServiceCreateInput) => {
    try {
      await updateService.mutateAsync({
        serviceId: params.id,
        ...data,
      });
      console.log("updateService", data);
    } catch (error) {
      console.error("提交失败：", error);
    }
  };

  if (getServiceById.isLoading) {
    return <LoadingPage title={t.core.common.loading} />;
  }
  const serviceData = getServiceById.data;
  if (!serviceData) {
    return (
      <div className="p-10 text-center text-gray-500">
        {t.core.serviceDashboard.serviceNotFound}
      </div>
    );
  }
  return (
    <ServiceForm
      initialData={serviceApiToForm(serviceData)}
      onSubmit={handleSubmit}
      isLoading={updateService.isLoading}
    />
  );
}
