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
import UserAvatar from "@/components/shared/user-avatar";
import { useConfirm } from "@/hooks/useConfirm";
import { useConfirmStore } from "@/store/useConfirmStore";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/language-provider";
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
  const { t } = useLanguage();
  const copy = t.settings.provider;
  const management = t.core.management;
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
        title: copy.stopQuestion,
        variant: "danger",
        confirmText: copy.stopped,
        content: (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="font-semibold text-slate-800">
                {copy.stopQuestion}
              </p>
              <p className="text-sm text-slate-400">
                {copy.acceptingDescription}
                <span className="block mt-2 py-1 px-2 text-[11px]">
                  {copy.acceptingDescription}
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
              <label className="text-[10px] text-slate-400">{t.core.workflow.rating}</label>
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
              <label className="text-[10px] text-slate-400">{t.core.common.reviewCount}</label>
              <span>{reviewCount}</span>
            </div>
          </div>
        </div>
        {/* 姓名与核心信息 */}
        <div className="flex-1">
          {/* 标题 */}
          <div>
            <h1 className="-ml-3 text-xl font-bold text-slate-800">
              <span className="text-primary">{user?.name ?? t.core.common.providerFallback}</span>
              <span className="text-slate-400 ml-1 text-lg font-normal">
                {copy.title}
              </span>
            </h1>

            {/* 核心介绍 */}
            <p className="mt-2 mb-3 text-sm text-slate-500 max-w-xs line-clamp-2">
              {introduction || t.core.workflow.noIntroduction}
            </p>
          </div>
          {/* 核心信息条 */}
          <div className="flex items-center justify-between bg-slate-50/50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium">
                  {hasLocation ? baseAreaRaw : copy.notSet}
                </span>
              </div>
              <div className="w-px h-4 bg-slate-200" />
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <CircleDollarSign className="h-3.5 w-3.5 text-slate-400" />
                {baseCurrency ? (
                  <CurrencyFlag currency={baseCurrency} />
                ) : (
                  copy.notSet
                )}
              </div>
              <div className="w-px h-4 bg-slate-200" />
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                {monthsExperience ? (
                  <span>
                    {copy.experience}: {years > 0 ? `${years}y ` : ""}
                    {months}m
                  </span>
                ) : (
                  copy.notSet
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
            role="button"
            tabIndex={0}
            aria-pressed={isSitter}
            aria-label={isSitter ? copy.stopQuestion : copy.resume}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                void handleSetSitter();
              }
            }}
            className={cn(
              "w-full cursor-pointer group relative flex flex-col items-center justify-center px-4 py-3 rounded-2xl border-2 transition-all duration-200",
              isSitter
                ? "bg-primary/5 border-primary/20 hover:border-primary/50 shadow-sm"
                : "bg-danger-bg border-danger-border hover:border-danger-border",
            )}
          >
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "h-2 w-2 rounded-full animate-pulse",
                  isSitter ? "bg-green-500" : "bg-danger-text",
                )}
              ></span>
              <span
                className={cn(
                  "text-sm font-bold",
                  isSitter ? "text-primary" : "text-danger-text",
                )}
              >
                {isSitter ? copy.resume : copy.stopped}
              </span>
            </div>
            <p className="text-[10px] text-center my-1 text-slate-400">
              {isSitter
                ? copy.acceptingDescription
                : copy.stopped}
            </p>
            <div
              className={cn(
                "flex items-center gap-1 text-[10px] transition-colors",
                isSitter ? "text-danger-text" : "text-primary",
              )}
            >
              {toggleSitter.isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}

              <span>
                {toggleSitter.isLoading
                  ? copy.loading
                  : isSitter
                    ? copy.stopQuestion
                    : copy.resume}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end">
        <h2 className="text-md text-slate-500 tracking-tight">
          {t.core.management.myServices}
        </h2>
        {/* 悬浮或显眼的新增按钮 */}
        {/* <button
          className="shrink-0 inline-flex rounded-full text-sm border px-4 py-1.5 font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-100 items-center gap-2"
          onClick={() => router.push("/dashboard/serviceprofile/services/new")}
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
          {management.addService}
        </button> */}
        <Button
          onClick={() => router.push("/dashboard/serviceprofile/services/new")}
          className="shrink-0 inline-flex rounded-full text-sm border px-4 py-1.5 text-white font-bold bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-100 items-center gap-2"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
          {management.addService}
        </Button>
      </div>
    </div>
  );
}
