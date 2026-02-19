import Link from "next/link";
import ImageWithBlurBackground from "@/components/ui/ImageWithBlurBackground";
import { FrequencyType, PetType, ServiceCategory } from "@prisma/client";
import { PET_META } from "@/domain/pet/constant";
import { format } from "date-fns";
import { AllNeedApi } from "@/domain/need/api.types";
import UserAvatar from "@/components/navbar/UserAvatar";
import cn from "@/lib/cn";
import {
  DISTANCE_RANGE_JA,
  FREQUENCY_TYPE_JA,
  NEED_TYPE_JA,
  TRANSPORT_METHOD_JA,
} from "@/domain/need/constant";
import { Clock, MapPin, Truck } from "lucide-react";
import { CURRENCY_META } from "@/domain/location/constants";
import { useMemo } from "react";
import { calculateDistance } from "@/lib/location/calculateDistance";
import CurrencyFlag from "@/components/location/CurrencyFlag";
import { Button } from "@/components/ui/Button";

export default function NeedCard({
  need,
  userLocation,
}: {
  need: AllNeedApi;
  userLocation: {
    lat: number;
    lng: number;
  } | null;
}) {
  const {
    id,
    owner,
    title,
    category,
    requirement,
    startDate,
    endDate,
    frequencyType,
    customDays,
    customTimes,
    addressRaw,
    addressLat,
    addressLon,
    currency,
    fosterRange,
    transportMethod,
    status,
    needPets,
    photos,
    priceAmount,
    totalPrice,
  } = need;
  const defaultPetType = needPets[0].petCategory;
  const fallbackImage = PET_META[defaultPetType].placeImg;

  const {
    tagClassName: needTypeClass,
    emo: needTypeEmo,
    labelShort: needTypeLabel,
    priceDisplayUnit,
  } = NEED_TYPE_JA[category];
  const { symbol: currencySymbol } = CURRENCY_META[currency];
  const distance = useMemo(() => {
    if (!userLocation || !addressLat || !addressLon) return null;
    const d = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      addressLat,
      addressLon,
    );
    return d < 1 ? "1km圏内" : `${Math.round(d)}km`;
  }, [userLocation, addressLat, addressLon]);

  return (
    <div className="group relative bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden">
      {/* 1. 顶部封面与发布者 */}
      <div className="relative h-44 overflow-hidden">
        <ImageWithBlurBackground
          src={photos?.[0]?.url ?? ""}
          fallback={fallbackImage}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          alt={title}
        />
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
          <div
            className={cn(
              "px-2.5 py-1.5 rounded-full text-[10px] font-black backdrop-blur-md shadow-sm border border-white/20",
              "flex items-center gap-1.5 transition-all",
              needTypeClass,
            )}
          >
            <span className="leading-none">{needTypeEmo}</span>
            <span className="leading-none">{needTypeLabel}</span>
          </div>
          {/* 报酬标签 */}
          <div className="bg-primary/80 text-white px-3 py-1 rounded-full text-xs font-black shadow-lg">
            {currencySymbol}
            {totalPrice.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 2. 内容区 */}
      <div className="p-4 flex-1 flex flex-col space-y-3">
        {/* 头像 + 标题与位置 */}
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center shrink-0">
            <UserAvatar
              size={30}
              image={owner?.image}
              name={owner?.name}
              // className="ring-2 ring-slate-50"
            />
            <span className="text-[8px] text-slate-400">{owner.name}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 text-base leading-tight mb-1 line-clamp-1 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <p className="flex items-center gap-1 text-[11px] truncate mr-2">
                <span>📍</span>
                <span className="truncate">{addressRaw}</span>
              </p>
              {/* 动态计算的距离 */}
              <span className="shrink-0 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-black uppercase tracking-wider">
                {distance ?? "近郊"}
              </span>
            </div>
          </div>
        </div>
        {/* 第二行：日期（分行放置） */}
        <div className="flex items-center gap-3 bg-slate-50/80 px-4 py-2.5 rounded-2xl border border-slate-100/50 text-[11px] font-bold text-slate-600">
          <span className="text-slate-400">📅</span>
          <div className="flex-1 flex items-center gap-2">
            <span>{format(startDate, "yyyy年MM月dd日")}</span>
            <span className="text-slate-300">→</span>
            <span>{format(endDate, "MM月dd日")}</span>
          </div>
        </div>
        {/* 第五行：描述 */}
        <p className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed italic pl-2 border-l-2 border-slate-100">
          "{requirement}"
        </p>

        {/* 第三行：频次、距离偏好、接送方式 (标签流) */}
        <div className="flex flex-wrap gap-2 text-[10px]">
          {category === ServiceCategory.VISIT && frequencyType && (
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-xl bg-orange-50 border border-orange-100 text-orange-700">
              <Clock className="w-3 h-3" />
              {frequencyType === FrequencyType.CUSTOM
                ? `${customDays}日に${customTimes}回`
                : FREQUENCY_TYPE_JA[frequencyType]}
            </div>
          )}

          {category === ServiceCategory.FOSTER && (
            <>
              {transportMethod && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-xl bg-green-50 border border-green-100 text-green-700">
                  <Truck className="w-3 h-3" />
                  {TRANSPORT_METHOD_JA[transportMethod].tag}
                </div>
              )}
              {fosterRange && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-700">
                  <MapPin className="w-3 h-3" />
                  {DISTANCE_RANGE_JA[fosterRange]?.label}
                </div>
              )}
            </>
          )}

          {needPets.slice(0, 2).map((pet, idx) => {
            const { petCategory, petType, count } = pet;
            return (
              <div
                key={idx}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary/5 text-primary border border-secondary/12"
              >
                <img
                  src={PET_META[petCategory].headImg}
                  alt={PET_META[petCategory].label.ja.name}
                  className="h-3 w-3"
                />
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

        <div className="flex items-center justify-between text-[10px] bg-slate-50/80  px-4 py-2.5 rounded-2xl border  border-slate-100/50 font-bold text-slate-600">
          {/* 增加国旗和币种，明确日元身份 */}
          <CurrencyFlag currency={currency} />
          <div className="flex items-center gap-1 text-slate-400">
            {currencySymbol}
            <span className="font-bold text-slate-700">
              {priceAmount}
            </span> / {priceDisplayUnit}
          </div>
        </div>

        {/* 3. 底部操作区 */}
        <div className="mt-auto pt-4 flex gap-2 border-t border-slate-50">
          <Link
            href={`/public/browse/needs/${id}`}
            className="flex-1 flex items-center justify-center py-2.5 rounded-xl bg-slate-50 text-slate-500 text-xs font-bold hover:bg-slate-100 transition-all border border-slate-100"
          >
            詳細を見る
          </Link>
          {/* <button
            // onClick={() => handleContact(user.id)}
            className="flex-[1.5] flex items-center justify-center py-2.5 rounded-xl bg-primary/8 border border-primary/20 text-primary text-xs font-bold hover:bg-primary hover:text-white shadow-sm shadow-primary/20 transition-all active:scale-95"
          >
            応募・相談する
          </button> */}
          <Button
            // onClick={() => handleContact(user.id)}
            className="flex-[1.5] shadow-lg shadow-purple-100 active:scale-95"
          >
            応募・相談する
          </Button>
        </div>
      </div>
    </div>
  );
}
