import { useRouter } from "next/navigation";
import { useService } from "@/hooks/useService";
import { SERVICE_TYPE_JA, PRICE_UNIT_JA } from "@/domain/service/constant";
import { CURRENCY_META } from "@/domain/location/constants";
import { PET_META } from "@/domain/pet/constant";
import { ServicePhotoKind, ServiceCategory } from "@prisma/client";
import type { ServiceApi } from "@/domain/service/api.types";
import { formatAvailabilityText } from "@/domain/service/formatAvailabilityText";
import cn from "@/lib/cn";
import Switch from "@/components/ui/Switch";
import LoadingPage from "@/components/ui/LoadingPage";
import {
  CalendarCheck,
  Camera,
  Edit3,
  ExternalLink,
  Lightbulb,
  Trash2,
} from "lucide-react";
import ImageWithBlurBackground from "@/components/ui/ImageWithBlurBackground";
import Link from "next/link";
import { useConfirm } from "@/hooks/useConfirm";
import { useConfirmStore } from "@/store/useConfirmStore";

export default function ServiceCard({ service }: { service: ServiceApi }) {
  const router = useRouter();
  const { toggleActive, deleteService } = useService();
  const confirm = useConfirm();
  const setIsDeleting = useConfirmStore((s) => s.setIsDeleting);
  const closeConfirm = useConfirmStore((s) => s.close);
  const {
    id,
    serviceType,
    availabilityRangeType,
    availableFrom,
    availableTo,
    availabilityWeekPattern,
    includeHolidays,
    priceRules,
    petTypes,
    photos,
    isActive,
    priceUnit,
    currency,
  } = service;
  const { label: serviceTypeLabel, emo: serviceTypeEmo } =
    SERVICE_TYPE_JA[serviceType];
  const customType =
    serviceType === ServiceCategory.OTHER ? service.customType : "";
  const { range, conditions } = formatAvailabilityText({
    rangeType: availabilityRangeType,
    from: availableFrom,
    to: availableTo,
    weekPattern: availabilityWeekPattern,
    includeHolidays,
  });
  const { symbol: currencySymbol } = CURRENCY_META[currency];
  const experiencePhotos = photos.filter(
    (p) => p.serviceKind === ServicePhotoKind.EXPERIENCE,
  );
  const homePhotos = photos.filter(
    (p) => p.serviceKind === ServicePhotoKind.HOME,
  );
  const fallbackImage = PET_META[petTypes[0]].placeImg;
  const isLoading = toggleActive.isLoading;
  const handleToggle = async (checked: boolean) => {
    toggleActive.mutate({
      serviceId: service.id,
      isActive: checked,
    });
  };
  const handleDelete = async () => {
    const ok = await confirm({
      title: "サービスの削除",
      variant: "danger",
      confirmText: "削除する",
      content: (
        <div className="space-y-4">
          {/* 主描述文字：居中对齐 */}
          <div className="space-y-1">
            <p className="font-semibold text-slate-800">
              このサービスを完全に削除してもよろしいですか？
            </p>
            <p className="text-sm text-slate-400">
              削除すると、これまでの実績や設定がすべて失われ、復元することはできません。
            </p>
          </div>

          {/* 提示信息：采用卡片式，视觉上属于补充信息 */}
          <div className="mt-4 flex items-start gap-3 text-left bg-purple-50/50 p-4 rounded-2xl border border-purple-100/50">
            <div className="shrink-0 mt-0.5 bg-primary/5 p-1 rounded-lg">
              <Lightbulb className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="text-[12px] leading-relaxed">
              <p className="font-bold text-purple-900 mb-0.5">
                「非公開」にしませんか？
              </p>
              <p className="text-primary/80">
                カード右上のスイッチをオフにするだけで、データを保持したまま募集を一時停止できます。
              </p>
            </div>
          </div>
        </div>
      ),
    });
    if (ok) {
      try {
        setIsDeleting(true);
        await deleteService.mutateAsync({ serviceId: id });
      } catch (e) {
      } finally {
        setIsDeleting(false);
        closeConfirm();
      }
    }
  };
  return (
    <div className="relative overflow-hidden bg-white border border-slate-200 hover:border-slate-300 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col">
      {isLoading && (
        <div className="text-sm absolute inset-0 flex items-center justify-center bg-white rounded-2xl opacity-70 z-20">
          <LoadingPage title="更新中..." size="w-6 h-6" />
        </div>
      )}
      {/* 1. 顶部封面与快捷操作 */}
      <div className="relative h-32">
        <ImageWithBlurBackground
          src={
            experiencePhotos?.[0]?.url ?? homePhotos?.[0]?.url ?? fallbackImage
          }
          alt="service cover"
          className="w-full h-full"
        />
        <div className="absolute top-0 left-0 right-0 z-20 p-3 flex items-start justify-between">
          {/* 状态悬浮标签 */}
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-lg shadow-sm backdrop-blur bg-white/90 font-bold text-[10px]",
              isActive
                ? "text-green-600 bg-green-50"
                : "text-amber-600 bg-amber-50",
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                isActive ? "bg-green-500" : "border border-amber-500",
              )}
            ></span>
            <span>{isActive ? "公開中" : "停止中"}</span>
          </div>

          {/* 右上角开关 */}
          <div className="scale-90 origin-top-right">
            <Switch checked={isActive} onCheckedChange={handleToggle} />
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        {/* 2. 标题与副标题 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl shrink-0">{serviceTypeEmo}</span>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-800 text-sm truncate">
              {serviceTypeLabel}
            </h3>
            {customType && (
              <p className="text-[10px] text-slate-400 truncate">
                {customType}
              </p>
            )}
          </div>
        </div>
        {/* 3. 可接纳宠物 (图标化精简) */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {petTypes.map((pet) => (
            <div
              key={pet}
              className="inline-flex items-center gap-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg px-1.5 py-0.5 text-[10px] font-medium"
            >
              <img
                src={PET_META[pet].headImg}
                alt={PET_META[pet].label.ja.name}
                className="h-3 w-3"
              />
              {PET_META[pet].label.ja.name}
            </div>
          ))}
        </div>

        {/* 4. 可用时间与价格规则 (核心信息区) */}
        <div className="flex-1 mb-3">
          <div className="space-y-2 bg-primary/2 p-2.5 rounded-xl border border-primary/5">
            {/* 价格规则展示 (展示前2条) */}
            <div className="space-y-1">
              {priceRules.slice(0, 2).map((rule, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center text-[10px]"
                >
                  <span className="text-slate-600">{rule.groupLabel}</span>
                  <span className="font-normal text-slate-400 text-[9px]">
                    <span className="text-primary">
                      {currencySymbol}{" "}
                      <span className="font-bold text-[11px]">
                        {rule.price.toLocaleString()}
                      </span>{" "}
                      {CURRENCY_META[currency].label.ja.short}{" "}
                    </span>
                    <span className="text-[9px] font-normal text-slate-400">
                      / {PRICE_UNIT_JA[priceUnit]}
                    </span>
                  </span>
                </div>
              ))}
              {priceRules.length > 2 && (
                <p className="text-[9px] text-slate-400 flex items-center justify-center gap-1">
                  --- 他
                  <span className="text-[10px] font-mono font-bold text-primary">
                    {priceRules.length - 2}
                  </span>
                  件の料金設定があります ---
                </p>
              )}
            </div>

            {/* 分割线 */}
            <div className="h-px bg-purple-100/50 w-full" />

            {/* 可用时间 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[11px] text-primary font-medium">
                <CalendarCheck className="h-3 w-3" />
                <span className="font-mono font-bold">{range}</span>
              </div>
              {conditions && (
                <span className="text-[10px] text-slate-500 max-w-20 truncate text-right">
                  {conditions}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 5. 底部：照片统计与操作 */}
        <div className="pt-3 border-t border-slate-100">
          {/* 第一行：信息统计 + 预览入口 */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-medium">
              <Camera className="h-3 w-3" />
              <span className="flex items-center gap-1">
                <span className="flex items-center gap-0.5">
                  経験 {experiencePhotos.length} 枚
                </span>
                {serviceType === ServiceCategory.FOSTER && (
                  <>
                    •
                    <span className="flex items-center gap-0.5">
                      環境 {homePhotos.length} 枚
                    </span>
                  </>
                )}
              </span>
            </div>
            {/* 将“详细”改为“公开页面预览”，用小图标引导 */}
            <Link
              href={`/services/${id}`} // 跳转到给饲主看的公开详情页
              className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-primary transition-colors"
            >
              プレビュー <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          {/* 第二行：主要操作区 */}
          <div className="flex gap-2">
            <button
              className="cursor-pointer flex-1 py-2 rounded-xl bg-primary/8 border border-primary/20 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all shadow-sm shadow-primary/20 flex items-center justify-center gap-2"
              onClick={() =>
                router.push(`/dashboard/serviceprofile/services/${id}/edit`)
              }
            >
              <Edit3 className="h-3 w-3" />
              編集する
            </button>
            <button
              className="cursor-pointer p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-100 transition-all"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
