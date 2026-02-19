import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useServiceProfile } from "@/hooks/useServiceProfile";
import {
  PawPrint,
  Star,
  PencilLine,
  Briefcase,
  CircleDollarSign,
  MapPin,
  Plus,
  RefreshCw,
  Loader2,
} from "lucide-react";
import cn from "@/lib/cn";
import type { BaseInfo } from "@/lib/zod/serviceProfile";
import CurrencyFlag from "@/components/location/CurrencyFlag";
import UserAvatar from "@/components/navbar/UserAvatar";
import { useConfirm } from "@/hooks/useConfirm";
import { useConfirmStore } from "@/store/useConfirmStore";
import { Button } from "@/components/ui/Button";
type Props = {
  isSitter: boolean;
  profileInfo: { rating: number; reviewCount: number } & BaseInfo;
  onEditBaseInfo: () => void;
};
export default function ProfileHeader({
  isSitter,
  profileInfo,
  onEditBaseInfo,
}: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toggleSitter } = useServiceProfile();
  const confirm = useConfirm();
  const setIsDeleting = useConfirmStore((s) => s.setIsDeleting);
  const closeConfirm = useConfirmStore((s) => s.close);
  const user = session?.user;
  const {
    rating,
    reviewCount,
    introduction,
    monthsExperience,
    baseAreaRaw,
    baseLat,
    baseLon,
    baseCurrency,
  } = profileInfo;

  const hasLocation = baseAreaRaw && baseLat && baseLon;

  let years = 0;
  let months = 0;
  if (monthsExperience != null) {
    years = Math.floor(monthsExperience / 12);
    months = monthsExperience % 12;
  }
  const handleSetSitter = async () => {
    if (isSitter) {
      const ok = await confirm({
        title: "サービス受付の停止",
        variant: "danger",
        confirmText: "停止する",
        content: (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="font-semibold text-slate-800">
                サービスの受付を一時停止しますか？
              </p>
              <p className="text-sm text-slate-400">
                受付を停止すると、あなたのプロフィールおよびすべてのサービスが検索結果から非公開になります。
                <span className="block mt-2 py-1 px-2 text-[11px]">
                  ※ 確定済みの予約やチャットへの影響はありません。
                </span>
              </p>
            </div>
          </div>
        ),
      });

      if (ok) {
        try {
          setIsDeleting(true);
          await toggleSitter.mutateAsync({ active: false });
        } catch (e) {
        } finally {
          setIsDeleting(false);
          closeConfirm();
        }
      }
    } else {
      toggleSitter.mutate({ active: true });
    }
  };
  return (
    <div className="w-full px-4 bg-white flex flex-col gap-2 pb-2">
      <div className="w-full flex items-stretch gap-4">
        {/* 头像部分和核心评价（不可改部分） */}
        <div className="flex flex-col items-center shrink-0">
          <div className="relative mb-2">
            <UserAvatar
              size={72}
              image={user?.image}
              name={user?.name}
              email={user?.email}
            />
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary border-2 border-white flex items-center justify-center">
              <PawPrint className="h-3 w-3 text-white" />
            </div>
          </div>
          <div className="text-[12px] font-light text-slate-700">
            <div className="flex gap-1 items-center justify-center">
              <label className="text-[10px] text-slate-400">評価</label>
              <div className="flex items-center gap-1">
                <div className="flex">
                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-400" />
                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-400" />
                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-400" />
                  <Star className="h-3.5 w-3.5 text-yellow-500" />
                  <Star className="h-3.5 w-3.5 text-yellow-500" />
                </div>
                <span>{rating.toFixed(1)}</span>
              </div>
            </div>
            <div className="flex gap-1 items-center justify-center mt-2">
              <label className="text-[10px] text-slate-400">レビュー</label>
              <span>{reviewCount}件</span>
            </div>
          </div>
        </div>
        {/* 姓名与核心信息 */}
        <div className="flex-1">
          {/* 标题 */}
          <div>
            <h1 className="-ml-3 text-xl font-bold text-slate-800">
              <span className="text-primary">{user?.name ?? "ゲスト"}さん</span>
              <span className="text-slate-400 ml-1 text-lg font-normal">
                のサービスプロフィール
              </span>
            </h1>

            {/* 核心介绍 */}
            <p className="mt-2 mb-3 text-sm text-slate-500 max-w-xs line-clamp-2">
              {introduction || "まだ自己紹介がありません 🌱"}
            </p>
          </div>
          {/* 核心信息条 */}
          <div className="flex items-center justify-between bg-slate-50/50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium">
                  {hasLocation ? baseAreaRaw : "対応エリア未設定"}
                </span>
              </div>
              <div className="w-px h-4 bg-slate-200" />
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <CircleDollarSign className="h-3.5 w-3.5 text-slate-400" />
                {baseCurrency ? (
                  <CurrencyFlag currency={baseCurrency} />
                ) : (
                  "使用通貨未設定"
                )}
              </div>
              <div className="w-px h-4 bg-slate-200" />
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                {monthsExperience ? (
                  <span>
                    お世話经验: {years > 0 ? `${years}年` : ""}
                    {months}ヶ月
                  </span>
                ) : (
                  "お世話経験未設定"
                )}
              </div>
            </div>
            <button
              onClick={onEditBaseInfo}
              className="p-2 hover:bg-white rounded-lg transition-colors text-primary hover:text-purple-700"
            >
              <PencilLine className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* 状态切换栏 (职责：控制服务整体开关) */}
        <div className="w-40 flex items-center justify-center">
          <div
            onClick={handleSetSitter}
            className={cn(
              "w-full cursor-pointer group relative flex flex-col items-center justify-center px-4 py-3 rounded-2xl border-2 transition-all duration-200",
              isSitter
                ? "bg-primary/5 border-primary/20 hover:border-primary/50 shadow-sm"
                : "bg-red-50 border-red-200 hover:border-red-300",
            )}
          >
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "h-2 w-2 rounded-full animate-pulse",
                  isSitter ? "bg-green-500" : "bg-red-400",
                )}
              ></span>
              <span
                className={cn(
                  "text-sm font-bold",
                  isSitter ? "text-primary" : "text-red-500",
                )}
              >
                {isSitter ? "受付中" : "停止中"}
              </span>
            </div>
            <p className="text-[10px] text-center my-1 text-slate-400">
              {isSitter
                ? "現在、検索結果に表示され\n依頼を受け付けています"
                : "現在、すべてのサービスが\n検索結果から非公開です"}
            </p>
            <div
              className={cn(
                "flex items-center gap-1 text-[10px] transition-colors",
                isSitter ? "text-red-500" : "text-primary",
              )}
            >
              {toggleSitter.isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}

              <span>
                {toggleSitter.isLoading
                  ? "通信中..."
                  : isSitter
                    ? "クリックで停止"
                    : "クリックで再開"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end">
        <h2 className="text-md text-slate-500 tracking-tight">
          提供しているサービス
        </h2>
        {/* 悬浮或显眼的新增按钮 */}
        {/* <button
          className="shrink-0 inline-flex rounded-full text-sm border px-4 py-1.5 font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-100 items-center gap-2"
          onClick={() => router.push("/dashboard/serviceprofile/services/new")}
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
          新しいサービスを追加する
        </button> */}
        <Button
          onClick={() => router.push("/dashboard/serviceprofile/services/new")}
          className="shrink-0 inline-flex rounded-full text-sm border px-4 py-1.5 text-white font-bold bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-100 items-center gap-2"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
          新しいサービスを追加する
        </Button>
      </div>
    </div>
  );
}
