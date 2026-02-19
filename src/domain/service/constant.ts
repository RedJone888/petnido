import {
  ServiceCategory,
  AvailabilityRangeType,
  AvailabilityWeekPattern,
  PriceUnit,
} from "@prisma/client";
import {
  Home,
  Warehouse,
  Sparkles,
  CalendarDays,
  CalendarRange,
  Calendar,
  Briefcase,
  Coffee,
  LucideIcon,
  UserRoundCheck,
  Building2,
  PlusCircle,
  Hotel,
  MapPinHouse,
  DoorOpen,
  Wrench,
  Cog,
  HandHeart,
} from "lucide-react";
import { PriceRuleForm } from "@/lib/zod/services";

export const SERVICE_TYPE_JA: Record<
  ServiceCategory,
  {
    label: string;
    description: string;
    placeholder?: string;
    icon: LucideIcon;
    emo: string;
    contentHelperText: string;
    contentPlaceHolder: string;
  }
> = {
  VISIT: {
    label: "訪問ペットケア",
    description: "ご自宅に訪問し、普段の環境のままお世話します。",
    icon: MapPinHouse,
    emo: "🏠",
    contentHelperText:
      "対応可能なペットの種類、散歩や掃除などの具体的な内容、これまでの経験について記入してください",
    contentPlaceHolder:
      "例：お散歩代行や室内の掃除も可能です。大型犬の対応経験が豊富で、シニア犬のケアも承ります。",
  },
  FOSTER: {
    label: "自宅預かり",
    description: "シッターの自宅で、家庭的な環境でお預かりします。",
    icon: DoorOpen,
    emo: "🏨",
    contentHelperText:
      "飼育環境（ケージの有無や個室など）、先住ペットの有無、見守り体制について記入してください",
    contentPlaceHolder:
      "例： ケージフリーの独立した個室を用意しています。先住ペットはおりませんので、怖がりの子も安心です。ネットワークカメラで24時間様子を確認いただけます。",
  },
  OTHER: {
    label: "その他のサービス",
    description: "送迎・通院サポートなど、自由にサービス内容を設定できます。",
    placeholder: "例：爪切り、ブラッシング、通院の付き添い",
    icon: HandHeart,
    emo: "✨",
    contentHelperText:
      "提供できる具体的なケアの内容や、これまでの専門的な経験について記入してください",
    contentPlaceHolder:
      "例： 爪切りや耳掃除などの日常ケア、または動物病院への通院を代行します。プロのトリマーとしての経験を活かし、丁寧に対応いたします。",
  },
};

export const MAX_EXPERIENCE_PHOTOS = 12;
export const MAX_HOME_PHOTOS = 8;

export const AVAILABILITY_RANGE_TYPE_JA: Record<
  AvailabilityRangeType,
  { label: string; icon: LucideIcon }
> = {
  LONG_TERM: {
    label: "長期対応可",
    icon: CalendarDays,
  },
  DATE_RANGE: {
    label: "期間指定",
    icon: CalendarRange,
  },
};

export const AVAILABILITY_WEEK_PATTERN_JA: Record<
  AvailabilityWeekPattern,
  { label: string; icon: LucideIcon }
> = {
  EVERYDAY: {
    label: "毎日",
    icon: Calendar,
  },
  WEEKDAYS_ONLY: { label: "平日のみ", icon: Briefcase },
  WEEKENDS_ONLY: { label: "土日のみ", icon: Coffee },
};

export const PRICE_UNIT_JA: Record<PriceUnit, string> = {
  DAY: "日",
  HOUR: "時間",
  VISIT: "回",
};
export const DEFAULT_PRICE_RULE = (): PriceRuleForm => ({
  // tempId: crypto.randomUUID(),
  groupLabel: "",
  price: "0",
});
export const SERVICE_STEPS = [
  { id: "type", label: "サービス内容" },
  { id: "photo", label: "写真" },
  { id: "timeArea", label: "日時＆エリア" },
  { id: "rule", label: "料金設定" },
];
