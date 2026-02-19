import { SERVICE_STEPS } from "@/domain/service/constant";
import cn from "@/lib/cn";
import {
  ServiceCreateInput,
  serviceFormSchema,
  type ServiceForm,
} from "@/lib/zod/services";
import { ServiceCategory, ServicePhotoKind } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocationController } from "@/hooks/useLocationController";
import { useEffect, useRef, useState } from "react";
import ServiceBase from "./form/ServiceBase";
import ServicePhoto from "./form/ServicePhoto";
import ServiceTimeAndArea from "./form/ServiceTimeAndArea";
import ServicePriceRule from "./form/ServicePriceRule";
import { serviceFormToApi } from "@/domain/service/mapper";
import { inferPriceUnitByServiceType } from "@/domain/service/inferPriceUnit";
type Props = {
  initialData: ServiceForm & { id?: string };
  onSubmit: (data: ServiceCreateInput) => Promise<void>;
  isLoading?: boolean;
};
export default function ServiceForm({
  initialData,
  onSubmit,
  isLoading,
}: Props) {
  const router = useRouter();
  const isEditMode = !!initialData?.id;

  const onCancel = () => {
    // isEditMode && localStorage.removeItem("NEED_FORM_DRAFT");
    router.replace("/dashboard/serviceprofile");
  };
  const form = useForm<ServiceForm>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: initialData,
  });

  const [serviceType, photos, priceUnit, currency] = form.watch([
    "serviceType",
    "photos",
    "priceUnit",
    "currency",
  ]);
  useEffect(() => {
    if (!serviceType) return;
    form.setValue("priceUnit", inferPriceUnitByServiceType(serviceType));
    if (serviceType !== ServiceCategory.OTHER) {
      form.setValue("customType", null);
    }
    if (serviceType === ServiceCategory.VISIT) {
      const currentPhotos = form.getValues("photos");
      form.setValue(
        "photos",
        currentPhotos.filter((p) => p.serviceKind !== ServicePhotoKind.HOME),
      );
    }
  }, [serviceType, form.setValue]);

  const experiencePhotos = photos.filter(
    (p) => p.serviceKind === ServicePhotoKind.EXPERIENCE,
  );
  const homePhotos = photos.filter(
    (p) => p.serviceKind === ServicePhotoKind.HOME,
  );
  // 左侧导航和右侧表单区域
  const [activeStep, setActiveStep] = useState("type");
  // 滚动表单，切换左侧导航
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    // 1. 创建观察者逻辑
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 关键逻辑：只要元素进入了我们定义的“热区”（isIntersecting），并且我们判断它是从下方滚上来的，或者正在视口中，更新左侧导航
          if (entry.isIntersecting) {
            setActiveStep(entry.target.id);
          }
        });
      },
      {
        root: container, // 监听这个容器内的滚动
        threshold: 0, // 只要有一点点进入热区就触发，配合 rootMargin 使用极其灵敏
        rootMargin: "-45% 0px -45% 0px", // '0px 0px -80% 0px' 表示：只有当元素出现在视口顶部 20% 的区域时，才算作触发
      },
    );
    // 2. 告诉观察者要看哪些 section
    const sections = SERVICE_STEPS.map((s) => s.id);
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
  // 点击左侧导航，平滑滚动到对应位置
  const scrollToSection = (id: string) => {
    setActiveStep(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };
  // 位置和货币
  const currentValues = form.getValues();
  const locController = useLocationController({
    location: {
      label: currentValues?.areaRaw ?? "",
      lat: currentValues?.areaLat ?? 0,
      lon: currentValues?.areaLon ?? 0,
    },
    currency: currentValues?.currency ?? "JPY",
  });
  useEffect(() => {
    form.setValue("areaRaw", locController.location.label, {
      shouldValidate: true,
    });
    form.setValue("areaLat", locController.location.lat);
    form.setValue("areaLon", locController.location.lon);
  }, [locController.location, form.setValue]);
  useEffect(() => {
    if (!locController.currency) return;
    form.setValue("currency", locController.currency, { shouldValidate: true });
  }, [locController.currency, form.setValue]);

  const onErrors = (errors: any) => {
    console.log("❌ 校验失败详情:", errors);
  };
  const onActualSubmit = async (data: ServiceForm) => {
    const input = serviceFormToApi(data);
    await onSubmit(input);
    // localStorage.removeItem("NEED_FORM_DRAFT");
    // form.reset();
    router.replace("/dashboard/serviceprofile");
    // router.refresh();
  };

  return (
    <FormProvider {...form}>
      <div className="max-w-6xl mx-auto h-full font-sans flex flex-col bg-white overflow-hidden text-sm">
        {/* 1. 顶部固定标题栏 */}
        <header className="px-8 h-20 shadow-[0_4px_20px_rgba(0,0,0,0.05)] z-10 bg-white flex items-center shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {`${isEditMode ? "サービス内容を編集する" : "新しいサービスを登録する"}`}
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              {isEditMode
                ? "現在の状況に合わせて内容を更新し、あなたの魅力をより正確に飼い主様へ伝えましょう"
                : "あなたの得意なケアや経験を具体的に伝えて、ぴったりの飼い主様と出会いましょう"}
            </p>
          </div>
        </header>

        {/* 2. 中间主体区域 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧：步骤导航 */}
          <aside className="px-8 shadow-[4px_0px_20px_rgba(0,0,0,0.05)] bg-white flex flex-col justify-center shrink-0">
            <nav className="space-y-8">
              {SERVICE_STEPS.map((step, i) => (
                <div
                  key={step.id}
                  onClick={() => scrollToSection(step.id)}
                  className="flex items-center gap-4 group cursor-pointer"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                      activeStep === step.id
                        ? "border-purple-600 bg-purple-50 text-purple-600"
                        : "border-gray-200 text-gray-400",
                    )}
                  >
                    <span>{i + 1}</span>
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "text-sm font-bold",
                        activeStep === step.id
                          ? "text-purple-600"
                          : "text-gray-400",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                </div>
              ))}
            </nav>
          </aside>
          <main
            ref={scrollContainerRef}
            className="relative flex-1 overflow-y-auto pr-8 custom-scrollbar"
          >
            <div className="bg-gray-50 p-6 max-w-4xl mx-auto space-y-6">
              <section
                id="type"
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4"
              >
                <h2 className="text-xl font-bold tracking-wide">
                  1. サービス内容の設定
                </h2>
                <ServiceBase serviceType={serviceType} />
              </section>
              <section
                id="photo"
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4"
              >
                <h2 className="text-xl font-bold tracking-wide">
                  {`2. 実績${serviceType === ServiceCategory.FOSTER ? "と環境" : ""}の写真`}
                </h2>
                <ServicePhoto
                  serviceType={serviceType}
                  experiencePhotos={experiencePhotos}
                  homePhotos={homePhotos}
                />
              </section>
              <section
                id="timeArea"
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4"
              >
                <h2 className="text-xl font-bold tracking-wide">
                  3. 対応可能なスケジュールとエリア
                </h2>
                <ServiceTimeAndArea locController={locController} />
              </section>
              <section
                id="rule"
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4"
              >
                <h2 className="text-xl font-bold tracking-wide">
                  4. 料金プランの設定
                </h2>
                <ServicePriceRule
                  locController={locController}
                  currency={currency}
                  priceUnit={priceUnit}
                />
              </section>
            </div>
          </main>
        </div>

        {/* 3. 底部固定操作栏 */}
        <footer className="px-8 h-20 bg-white flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-10 shrink-0">
          <div className="flex items-center gap-6">
            <button
              className="text-gray-500 hover:text-gray-800 font-medium transition-colors"
              // disabled={isLoading}
              onClick={onCancel}
            >
              キャンセル
            </button>
            <div className="text-sm text-gray-400 italic">
              {/* {saveStatus === "SAVING" && (
              <span className="flex items-center gap-1">
                <RefreshCcw size={12} className="animate-spin" />
                保存中...
              </span>
            )}
            {saveStatus === "SAVED" && lastSavedTime && (
              <span>下書き保存済み {lastSavedTime}</span>
            )}
            {saveStatus === "ERROR" && (
              <span className="text-red-400">保存に失敗しました</span>
            )}
            {saveStatus === "IDLE" && lastSavedTime && (
              <span>下書き保存済み {lastSavedTime}</span>
            )} */}
            </div>
          </div>

          <div className="flex items-center gap-8">
            <button
              onClick={form.handleSubmit(onActualSubmit, onErrors)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-10 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-70"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading
                ? "処理中..."
                : isEditMode
                  ? "変更を保存する"
                  : "サービスを公開する"}
            </button>
          </div>
        </footer>
      </div>
    </FormProvider>
  );
}
