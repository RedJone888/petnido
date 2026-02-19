import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, PawPrint, Plus } from "lucide-react";
import UserAvatar from "@/components/navbar/UserAvatar";
import NeedCard from "./NeedCard";
import { MyNeedApi } from "@/domain/need/api.types";
import cn from "@/lib/cn";
import { NEED_DISPLAY_CONFIG, NeedDisplayStatus } from "@/domain/need/constant";
import { getNeedDisplayKey } from "@/domain/need/getNeedDisplayKey";
import EmptyState from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/Button";
type Props = {
  needs: MyNeedApi[];
};

export default function NeedProfile({ needs }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user;
  const [filterStatus, setFilterStatus] = useState<NeedDisplayStatus>("ALL");
  const stats = useMemo(() => {
    const counts = Object.keys(NEED_DISPLAY_CONFIG).reduce(
      (acc, key) => {
        acc[key as NeedDisplayStatus] = 0;
        return acc;
      },
      {} as Record<NeedDisplayStatus, number>,
    );
    needs.forEach((need) => {
      const key = getNeedDisplayKey(need.status, need.endDate);
      counts[key]++;
      counts["ALL"]++;
    });
    return (Object.keys(NEED_DISPLAY_CONFIG) as NeedDisplayStatus[]).map(
      (key) => ({
        id: key,
        value: counts[key],
        ...NEED_DISPLAY_CONFIG[key],
      }),
    );
  }, [needs]);
  const filteredNeeds = useMemo(() => {
    if (filterStatus === "ALL") return needs;
    return needs.filter(
      (need) => getNeedDisplayKey(need.status, need.endDate) === filterStatus,
    );
  }, [needs, filterStatus]);

  return (
    <div className="px-6 py-8 h-full flex flex-col items-start">
      <div className="w-full flex items-end px-4 pb-4 gap-4">
        <UserAvatar
          size={64}
          image={user?.image}
          name={user?.name}
          email={user?.email}
        />

        <div className="flex-1 flex flex-col gap-2">
          <h1 className="text-xl font-medium text-slate-400">
            <span className="font-bold text-primary">
              {user?.name ?? "ゲスト"}さん
            </span>
            の依頼
          </h1>

          {/* 第二行：状态分布统计 */}
          <div className="flex items-center gap-1">
            {stats.map((stat, idx) => (
              <button
                key={idx}
                className={cn(
                  "group flex items-baseline gap-1 px-3 rounded-full",
                  filterStatus === stat.id && "bg-slate-100",
                )}
                onClick={() => setFilterStatus(stat.id)}
              >
                <span
                  className={cn(
                    "text-[11px] font-bold text-slate-400 leading-none",
                    filterStatus === stat.id && "text-slate-500",
                  )}
                >
                  {stat.label}
                </span>
                <span
                  className={cn(
                    "text-lg font-black tabular-nums tracking-tight",
                    stat.textColor,
                  )}
                >
                  {stat.value}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold text-slate-400",
                    filterStatus === stat.id && "text-slate-500",
                  )}
                >
                  件
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* <button className="shrink-0 inline-flex rounded-full text-sm border px-4 py-1.5 text-white font-bold bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-100 items-center gap-2">
          <Plus className="h-4 w-4" strokeWidth={3} />
          新しい依頼を作成する
        </button> */}
        <Button
          href="/dashboard/needs/new"
          //  href={`/dashboard/needs/${id}/edit`}
          //   onClick={() => router.push("/dashboard/needs/new")}
          className="shrink-0 rounded-full px-4 py-1.5 shadow-sm shadow-purple-100"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
          新しい依頼を作成する
        </Button>
      </div>

      <div className="overflow-y-auto flex-1 p-4 w-full bg-[#f6f7fb] shadow-inner rounded-xl">
        {filteredNeeds?.length === 0 ? (
          //           // <div className="w-full h-full pt-8 px-10">
          //   <ConfusedDog className="mx-auto w-60 h-60 scale-130 pointer-events-none" />
          //   <div className="pt-6 px-4 border-t border-dashed border-slate-300 flex flex-col items-center text-center">
          //     <p className="text-sm text-slate-400">
          //       まだ提供しているサービスがありません 🐾
          //     </p>
          //     <p className="text-[10px] mt-1 text-slate-400">
          //       お世話内容を登録すると、依頼を受けられます。
          //       「新しいサービスを追加する」から始めてみましょう。
          //     </p>
          //   </div>
          // </div>
          <div className="w-full h-full pt-8 px-10">
            {needs.length === 0 ? (
              <EmptyState
                icon={<ClipboardList className="w-10 h-10" />}
                title="まだ依頼はありません"
                description="外出や出張のとき、大切な家族であるペットを安心して任せられるシッターさんを探してみませんか？"
              />
            ) : (
              // <div className="flex flex-col items-center justify-center py-16 text-center">
              //   <div className="mb-4 text-purple2">
              //     <ClipboardList className="w-10 h-10" />
              //   </div>
              //   <h2 className="text-lg font-semibold text-neutral-900 mb-2">
              //     まだ依頼はありません
              //   </h2>
              //   <p className="text-sm text-neutral-600 max-w-md mb-6">
              //     外出や出張のとき、大切な家族であるペットを安心して任せられるシッターさんを探してみませんか？
              //   </p>
              // </div>
              <div className="text-center py-10 text-gray-500">
                条件に合う依頼が見つかりませんでした。
              </div>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredNeeds.map((need) => {
              return <NeedCard key={need.id} need={need} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
