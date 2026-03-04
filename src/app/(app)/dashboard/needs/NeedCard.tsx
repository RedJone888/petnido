import { format } from "date-fns";
import Link from "next/link";
import cn from "@/lib/cn";
import {
  FrequencyType,
  NeedStatus,
  PetType,
  ServiceCategory,
} from "@prisma/client";
import {
  DISTANCE_RANGE_JA,
  FREQUENCY_TYPE_JA,
  NEED_DISPLAY_CONFIG,
  NEED_TYPE_JA,
  TRANSPORT_METHOD_JA,
} from "@/domain/need/constant";
import { CURRENCY_META } from "@/domain/location/constants";
import { PET_META } from "@/domain/pet/constant";
import type { MyNeedApi } from "@/domain/need/api.types";
import ImageWithBlurBackground from "@/components/ui/ImageWithBlurBackground";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@radix-ui/react-dropdown-menu";
import { useNeed } from "@/hooks/useNeed";
import {
  ExternalLink,
  Lightbulb,
  MoreHorizontal,
  Trash2,
  XCircle,
} from "lucide-react";
import LoadingPage from "@/components/ui/LoadingPage";
import { useConfirm } from "@/hooks/useConfirm";
import { useConfirmStore } from "@/store/useConfirmStore";
import { getNeedDisplayKey } from "@/domain/need/getNeedDisplayKey";
import { Button } from "@/components/ui/Button";
export default function NeedCard({ need }: { need: MyNeedApi }) {
  const { updateStatus, deleteNeed } = useNeed();
  const confirm = useConfirm();
  const setIsDeleting = useConfirmStore((s) => s.setIsDeleting);
  const closeConfirm = useConfirmStore((s) => s.close);
  const {
    id,
    category,
    photos,
    status,
    title,
    addressRaw,
    startDate,
    endDate,
    frequencyType,
    customDays,
    customTimes,
    fosterRange,
    transportMethod,
    needPets,
    currency,
    priceAmount,
    totalPrice,
  } = need;
  const {
    tagClassName: needTypeClass,
    labelShort: needTypeLabel,
    emo: needTypeEmo,
    priceDisplayUnit,
  } = NEED_TYPE_JA[category];
  const { symbol: currencySymbol } = CURRENCY_META[currency];
  const fallbackImage = PET_META[needPets[0].petCategory].placeImg;
  const displayKey = getNeedDisplayKey(status, endDate);
  const config = NEED_DISPLAY_CONFIG[displayKey];
  const handleDelete = async () => {
    const ok = await confirm({
      title: "依頼の削除",
      variant: "danger",
      confirmText: "削除する",
      content: (
        <div className="space-y-4">
          {/* 主描述文字：居中对齐 */}
          <div className="space-y-1">
            <p className="font-semibold text-slate-800">
              この依頼を完全に削除してもよろしいですか？
            </p>
            <p className="text-sm text-slate-400">
              関連する写真やペットの情報はすべて削除され、元に戻すことはできません。
            </p>
          </div>

          {/* 提示信息：采用卡片式，视觉上属于补充信息 */}
          <div className="mt-4 flex items-start gap-3 text-left bg-purple-50/50 p-4 rounded-2xl border border-purple-100/50">
            <div className="shrink-0 mt-0.5 bg-purple-100 p-1 rounded-lg">
              <Lightbulb className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <div className="text-[12px] leading-relaxed">
              <p className="font-bold text-purple-900 mb-0.5">
                ステータスの変更も可能です
              </p>
              <p className="text-purple-700/80">
                一時的に募集を止めたい場合は、ステータスを「募集終了」や「キャンセル」に変更することをお勧めします。
              </p>
            </div>
          </div>
        </div>
      ),
    });
    if (ok) {
      try {
        setIsDeleting(true);
        await deleteNeed.mutateAsync({ id });
      } catch (e) {
      } finally {
        setIsDeleting(false);
        closeConfirm();
      }
    }
  };
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col",
        displayKey !== NeedStatus.OPEN && "opacity-80",
        displayKey === "EXPIRED"
          ? "border-orange-200 hover:border-orange-300 shadow-orange-200"
          : "border-slate-200 hover:border-slate-300 shadow-slate-200",
      )}
    >
      {/* 加载遮罩 */}
      {updateStatus.isLoading && (
        <div className="text-sm absolute inset-0 flex items-center justify-center rounded-2xl z-50">
          <LoadingPage title="更新中..." size="w-6 h-6" />
        </div>
      )}
      {/* 顶部：封面图片 + 静态状态标签 */}
      <div className="relative h-40">
        <ImageWithBlurBackground
          src={photos?.[0]?.url ?? ""}
          fallback={fallbackImage}
          className="w-full h-full object-cover"
          alt="need cover"
        />
        <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-center z-20">
          {/* 类别标签 (左上) */}
          <div
            className={cn(
              "px-2.5 py-1 rounded-md text-[10px] font-black shadow-sm flex items-center gap-1.5 border transition-all backdrop-blur-[2px]",
              needTypeClass,
            )}
          >
            <span className="leading-none">{needTypeEmo}</span>
            <span className="leading-none">{needTypeLabel}</span>
          </div>

          {/* 当前状态静态展示 */}
          <div
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-black shadow-md flex items-center gap-1.5 border transition-all text-white",
              config.className,
            )}
          >
            {/* 动态呼吸灯：只有在募集中时显示 */}
            <span className={cn("w-1 h-1 rounded-full bg-white", config.dot)} />

            {config.emo && <span className="leading-none">{config.emo}</span>}

            <span className="leading-none">{config.label}</span>
          </div>
        </div>
      </div>

      {/* 中部：核心内容层级化 */}
      <div className="p-4 flex-1 flex flex-col">
        {/* 1. 标题与位置 */}
        <div className="mb-2">
          <h3 className="font-bold text-gray-800 text-base leading-tight mb-2 line-clamp-1">
            {title}
          </h3>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <p className="flex items-center gap-1 min-w-0 flex-1">
              <span className="shrink-0">📍</span>
              <span className="truncate">{addressRaw}</span>
            </p>
            <p className="shrink-0 text-gray-400 font-medium whitespace-nowrap ml-2">
              ({currencySymbol}
              {priceAmount} / {priceDisplayUnit})
            </p>
          </div>
        </div>

        {/* 2. 日期面板 - 强化时间感 */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs shrink-0">📅</span>
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 text-[11px] font-bold text-slate-700">
            <span>{format(startDate, "yyyy/MM/dd")}</span>
            <span className="text-slate-300">→</span>
            <span>{format(endDate, "MM/dd")}</span>
          </div>
        </div>

        {/* 3. 混合规格区 (宠物 + 模式属性) */}
        <div className="space-y-2 mb-2">
          <div className="flex flex-wrap gap-1.5 text-[9px] font-medium">
            {/* 模式属性 */}
            {category === ServiceCategory.VISIT && frequencyType && (
              <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-100">
                ⚡️{" "}
                {frequencyType === FrequencyType.CUSTOM
                  ? `${customDays}日に${customTimes}回`
                  : FREQUENCY_TYPE_JA[frequencyType]}
              </span>
            )}
            {category === ServiceCategory.FOSTER && (
              <>
                {fosterRange && (
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                    🚀 {DISTANCE_RANGE_JA[fosterRange].label}
                  </span>
                )}
                {transportMethod && (
                  <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100">
                    🚗 {TRANSPORT_METHOD_JA[transportMethod].tag}
                  </span>
                )}
              </>
            )}
            {/* 宠物统计 */}
            {needPets.slice(0, 2).map((pet, idx) => {
              const { petCategory, petType, count } = pet;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary/5 text-primary border border-secondary/12"
                >
                  {petCategory === PetType.OTHER
                    ? petType
                    : PET_META[petCategory].label.ja.name}
                  <span className="text-secondary/12">|</span>
                  {count}
                </div>
              );
            })}
            {needPets.length > 2 && (
              <span className="text-gray-400 self-center">
                +{needPets.length - 2}
              </span>
            )}
          </div>
        </div>

        {/* 底部：价格与复合操作区 */}
        <div className="mt-auto pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Total Price
              </span>
              <p className="font-black text-primary text-lg leading-none">
                {currencySymbol}
                {totalPrice.toLocaleString()}
              </p>
            </div>
            <Link
              href={`/dashboard/needs/${id}`}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-primary transition-colors"
            >
              プレビュー <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex gap-2">
            <Button
              href={`/dashboard/needs/${id}/edit`}
              className="flex-1 py-2 shadow-sm shadow-purple-100"
            >
              編集する
            </Button>
            {/* 状态切换下拉 */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="cursor-pointer p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition-all">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="center"
                sideOffset={8}
                className="w-32 rounded-xl shadow-xl font-bold text-[10px] bg-white border pt-2 pb-4 border-purple-200 z-50 animate-in slide-in-from-bottom-2"
              >
                <div className="px-2 p-1.5 text-center text-slate-400 uppercase tracking-wider">
                  ステータス変更
                </div>
                {status !== NeedStatus.OPEN && (
                  <DropdownMenuItem
                    onClick={() =>
                      updateStatus.mutate({ id, status: NeedStatus.OPEN })
                    }
                    className="cursor-pointer flex items-center gap-2 px-2 py-1 hover:bg-purple-50"
                  >
                    <span className="w-3 h-3 border-2 border-white rounded-full bg-green-500" />{" "}
                    募集中に戻す
                  </DropdownMenuItem>
                )}

                {status !== NeedStatus.MATCHED && (
                  <DropdownMenuItem
                    onClick={() =>
                      updateStatus.mutate({ id, status: NeedStatus.MATCHED })
                    }
                    className="cursor-pointer flex items-center gap-2 px-2 py-1 hover:bg-purple-50"
                  >
                    <span className="w-3 h-3 border-2 border-white rounded-full bg-purple-500" />{" "}
                    成約済みにする{/* マッチング済み */}
                  </DropdownMenuItem>
                )}

                {status !== NeedStatus.CLOSED && (
                  <DropdownMenuItem
                    onClick={() =>
                      updateStatus.mutate({ id, status: NeedStatus.CLOSED })
                    }
                    className="cursor-pointer flex items-center gap-2 px-2 py-1 hover:bg-purple-50"
                  >
                    <span className="w-3 h-3 border-2 border-white rounded-full bg-slate-400" />{" "}
                    募集を終了する
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {status !== NeedStatus.CANCELLED && (
                  <DropdownMenuItem
                    onClick={() =>
                      updateStatus.mutate({
                        id,
                        status: NeedStatus.CANCELLED,
                      })
                    }
                    className="cursor-pointer flex items-center text-red-500 gap-2 px-2 py-1 hover:bg-purple-50"
                  >
                    <XCircle className="w-3 h-3" /> キャンセル
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={handleDelete}
              className="cursor-pointer p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-500 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
