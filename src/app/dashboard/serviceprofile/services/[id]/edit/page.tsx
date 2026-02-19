"use client";
import { useService } from "@/hooks/useService";
import { serviceApiToForm } from "@/domain/service/mapper";
import type { ServiceCreateInput } from "@/lib/zod/services";
import ServiceForm from "@/app/dashboard/serviceprofile/services/ServiceForm";
import LoadingPage from "@/components/ui/LoadingPage";
export default function EditServicePage({
  params,
}: {
  params: { id: string };
}) {
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
    return <LoadingPage title="読み込み中..." />;
  }
  const serviceData = getServiceById.data;
  if (!serviceData) {
    return (
      <div className="p-10 text-center text-gray-500">
        サービスが見つかりませんでした。
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
