import {
  DistanceRange,
  ServiceCategory,
  PetType,
  FrequencyType,
  TransportMethod,
  NeedStatus,
} from "@prisma/client";
import { NeedPetForm } from "@/lib/zod/needs";
import { Home, LucideIcon, Sparkles, Warehouse } from "lucide-react";

export const NEED_TYPE_JA: Record<
  ServiceCategory,
  {
    label: string;
    labelShort: string;
    icon: LucideIcon;
    emo: string;
    description: string;
    pricingStrategy: string;
    priceInputTitle: string;
    priceDisplayUnit: string;
    addressTitle: string;
    addressPlaceholder: string;
    addressHint: string;
    showAddressCircle: boolean;
    photoHint: string;
    tagClassName: string;
  }
> = {
  VISIT: {
    label: "シッター訪問",
    labelShort: "シッター訪問",
    icon: Home,
    emo: "🏠",
    description: "シッターがお客様のご自宅に伺います",
    pricingStrategy: "回数単位での精算",
    priceInputTitle: "1回あたりの報酬",
    priceDisplayUnit: "回",
    addressTitle: "お世話の実施場所 (ご自宅)",
    addressPlaceholder: "建物名・部屋番号まで入力してください",
    addressHint:
      "建物名まで入力すると、シッターが正確な移動時間を計算でき、マッチング率が上がります。",
    showAddressCircle: false,
    photoHint:
      "アドバイス：フードの保管場所、蛇口の開け方、見守りカメラの画角などの写真を登録しておくとスムーズです。",
    tagClassName: "border-rose-200 bg-rose-50 text-rose-600",
  },
  FOSTER: {
    label: "ペット預かり",
    labelShort: "ペット預かり",
    icon: Warehouse,
    emo: "🏨",
    description: "ペットをシッターの自宅に預けます",
    pricingStrategy: "日数単位での精算",
    priceInputTitle: "1日あたりの報酬",
    priceDisplayUnit: "日",
    addressTitle: "中心となるエリア・駅",
    addressPlaceholder: "例：天王寺駅、または阿倍野区付近",
    addressHint: "具体的な住所は不要です。送迎可能な範囲を指定してください。",
    showAddressCircle: true,
    photoHint:
      "アドバイス：普段使っているベッド、アレルギー薬、愛用しているフードのパッケージなどの写真を登録するのがおすすめです。",
    tagClassName: "border-cyan-200 bg-cyan-50 text-cyan-700",
  },
  OTHER: {
    label: "その他（カスタム）",
    labelShort: "その他",
    icon: Sparkles,
    emo: "🧩",
    description: "お散歩代行や送迎など",
    pricingStrategy: "一括料金（固定報酬）",
    priceInputTitle: "一括料金",
    priceDisplayUnit: "件",
    addressTitle: "実施場所 / 待ち合わせ場所",
    addressPlaceholder: "例：代々木公園、特定の店舗など",
    addressHint: "依頼内容に合わせて、場所を指定してください。",
    showAddressCircle: false,
    photoHint:
      "アドバイス：依頼内容が具体的に伝わる画像をアップロードしてください。",
    tagClassName: "border-amber-200 bg-amber-50 text-amber-700",
  },
};
export const NEED_TYPES = Object.keys(NEED_TYPE_JA) as ServiceCategory[];
export type NeedDisplayStatus = NeedStatus | "EXPIRED" | "ALL";
export const NEED_DISPLAY_CONFIG: Record<
  NeedDisplayStatus,
  {
    label: string;
    emo: string;
    textColor: string;
    className: string;
    dot: string;
  }
> = {
  ALL: {
    label: "総計",
    emo: "",
    textColor: "text-slate-700",
    className: "bg-slate-600 border-slate-500",
    dot: "hidden",
  },
  OPEN: {
    label: "募集中",
    emo: "",
    textColor: "text-green-600",
    className: "bg-green-600 border-green-500",
    dot: "animate-ping",
  },
  EXPIRED: {
    label: "期限切れ",
    emo: "",
    textColor: "text-orange-600",
    className: "bg-orange-600 border-orange-500",
    dot: "animate-pulse",
  },
  MATCHED: {
    label: "成約済み",
    emo: "🤝",
    textColor: "text-secondary",
    className: "bg-primary border-secondary",
    dot: "hidden",
  },
  CLOSED: {
    label: "募集終了",
    emo: "🔒",
    textColor: "text-slate-500",
    className: "bg-slate-500 border-slate-400",
    dot: "hidden",
  },
  CANCELLED: {
    label: "キャンセル",
    emo: "⏹",
    textColor: "text-red-500",
    className: "bg-red-600 border-red-500",
    dot: "hidden",
  },
};

export const FREQUENCY_TYPE_JA: Record<FrequencyType, string> = {
  ONCE_A_DAY: "1日1回",
  TWICE_A_DAY: "1日2回",
  EVERY_2_DAYS: "2日に1回",
  EVERY_3_DAYS: "3日に1回",
  CUSTOM: "その他",
};
export const FREQUENCY_TYPES = Object.keys(
  FREQUENCY_TYPE_JA,
) as FrequencyType[];
export const TRANSPORT_METHOD_JA: Record<
  TransportMethod,
  {
    label: string;
    tag: string;
  }
> = {
  SELF: {
    label: "自分で送迎",
    tag: "自分で送迎",
  },
  SITTER: { label: "シッターにお願い", tag: "シッターで送迎" },
  TAXI: { label: "ペットタクシー", tag: "ペットタクシー" },
  DISCUSS: { label: "相談して決める", tag: "送迎相談" },
};
export const TRANSPORT_METHODS = Object.keys(
  TRANSPORT_METHOD_JA,
) as TransportMethod[];

export const DISTANCE_RANGE_JA: Record<
  DistanceRange,
  {
    label: string;
    desc: string;
  }
> = {
  WITHIN_3KM: {
    label: "3km以内",
    desc: "徒歩・自転車圏内",
  },
  WITHIN_5KM: { label: "5km以内", desc: "車で約10分" },
  WITHIN_10KM: { label: "10km以内", desc: "車で約20分" },
  NO_LIMIT: {
    label: "エリア制限なし",
    desc: "送迎可能・環境重視",
  },
};
export const DISTANCE_RANGES = Object.keys(
  DISTANCE_RANGE_JA,
) as DistanceRange[];
export const TAG_GROUPS = [
  {
    id: "health_safety",
    label: "安全・健康",
    // showIf: (cat) => cat === "FOSTER",
    showIf: () => true,
    tags: [
      {
        id: "AGGRESSIVE",
        label: "噛み癖・攻撃性",
        color: "bg-rose-100 text-rose-600 border-rose-200",
      },
      {
        id: "NO_CONTACT",
        label: "他頭飼いNG",
        color: "bg-orange-100 text-orange-600 border-orange-200",
      },
      {
        id: "VACCINATED",
        label: "ワクチン接種済",
        color: "bg-lime-100 text-lime-600 border-lime-200",
      },
      {
        id: "SPAYED",
        label: "避妊・去勢済",
        color: "bg-green-100 text-green-600 border-green-200",
      },
      {
        id: "DEWORMED",
        label: "駆虫済",
        color: "bg-emerald-100 text-emerald-600 border-emerald-200",
      },
    ],
  },
  {
    id: "character",
    label: "性格・特徴",
    showIf: () => true,
    tags: [
      {
        id: "SHY",
        label: "怖がり・人見知り",
        color: "bg-cyan-100 text-cyan-600 border-cyan-200",
      },
      {
        id: "CLINGY",
        label: "甘えん坊",
        color: "bg-sky-100 text-sky-600 border-sky-200",
      },
      {
        id: "ENERGETIC",
        label: "元気いっぱい",
        color: "bg-blue-100 text-blue-600 border-blue-200",
      },
      {
        id: "NO_CAT",
        label: "猫NG",
        color: "bg-indigo-100 text-indigo-600 border-indigo-200",
      },
      {
        id: "NO_DOG",
        label: "犬NG",
        color: "bg-violet-100 text-violet-600 border-violet-200",
      },
    ],
  },
];
export const DEFAULT_NEED_PET = (): NeedPetForm => ({
  petCategory: null,
  petType: "",
  count: "1",
  description: "",
  photos: [],
  petIds: [],
  tags: [],
});
export const NEED_STEPS = [
  { id: "type", label: "プランの選択" },
  { id: "schedule", label: "依頼の詳細設定" },
  { id: "pets", label: "ペットの情報" },
  { id: "budget", label: "報酬の計算" },
];
