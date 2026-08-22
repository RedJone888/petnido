"use client";
// import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
// import { useRouter } from "next/navigation";
import { ClipboardList, PawPrint, Plus } from "lucide-react";
import UserAvatar from "@/components/shared/user-avatar";
import NeedCard from "./NeedCard";
import { MyNeedApi } from "@/domain/need/api.types";
import cn from "@/lib/cn";
import { NEED_DISPLAY_CONFIG, NeedDisplayStatus } from "@/domain/need/constant";
import { getNeedDisplayKey } from "@/domain/need/getNeedDisplayKey";
import EmptyState from "../../_components/EmptyState";
import { Button } from "@/components/ui/button";
type Props = {
  // needs: MyNeedApi[];
  needs: any[];
  user: any;
};

export default function NeedProfile({ needs, user }: Props) {
  // const { data: session } = useSession();
  // const router = useRouter();
  // const user = session?.user;
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
    <div className="w-full space-y-4">
      <div className="flex w-full flex-wrap items-end justify-between gap-4 px-1 pb-2">
        <div className="flex items-center gap-4">
          <UserAvatar
            size={64}
            image={user?.image}
            name={user?.name}
            email={user?.email}
          />

          <div className="flex flex-col gap-2">
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
                    "group flex items-baseline gap-1 rounded-full px-3",
                    filterStatus === stat.id && "bg-slate-100",
                  )}
                  onClick={() => setFilterStatus(stat.id)}
                >
                  <span
                    className={cn(
                      "text-[11px] font-bold leading-none text-slate-400",
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
        </div>

        <Button
          href="/needs/create"
          className="shrink-0 rounded-full px-4 py-1.5 shadow-sm shadow-purple-100"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
          新しい依頼を作成する
        </Button>
      </div>

      <div className="w-full rounded-xl bg-[#f6f7fb] p-4 shadow-inner">
        {filteredNeeds?.length === 0 ? (
          <div className="w-full py-8 px-4">
            {needs.length === 0 ? (
              <EmptyState
                icon={<ClipboardList className="h-10 w-10" />}
                title="まだ依頼はありません"
                description="外出や出張のとき、大切な家族であるペットを安心して任せられるシッターさんを探してみませんか？"
              />
            ) : (
              <div className="py-10 text-center text-gray-500">
                条件に合う依頼が見つかりませんでした。
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredNeeds.map((need) => {
              return <NeedCard key={need.id} need={need} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
