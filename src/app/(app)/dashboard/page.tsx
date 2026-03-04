"use client";
import UserSummaryCard from "@/components/dashboard/UserSummaryCard";
import QuickNav from "@/components/dashboard/mypage/QuickNav";
import NeedsChart from "@/components/dashboard/mypage/NeedsChart";
import ServicesChart from "@/components/dashboard/mypage/ServicesChart";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import cn from "@/lib/cn";
import UserAvatar from "@/components/navbar/UserAvatar";
import { useSession } from "next-auth/react";

export default function DashboardHomePage() {
  const { data: session } = useSession();
  const user = session?.user;
  return (
    <div className="p-6 h-full flex flex-col items-start">
      <div className="w-full flex items-center px-4 pb-4 gap-4 mb-4">
        <UserAvatar
          size={64}
          image={user?.image}
          name={user?.name}
          email={user?.email}
        />

        <div className="flex-1 flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-neutral-600">
            ようこそ、
            <span className="font-bold text-primary">
              {user?.name ?? "ゲスト"}
            </span>
            さん
          </h1>
          <p className="text-xs text-neutral-400">
            ここは、ペットとあなたをつなぐマイページです。
            依頼の管理、サービスプロフィール、メッセージの確認などをまとめて行えます。
          </p>
          {/* 第二行：状态分布统计 */}
          {/* <div className="flex items-center gap-1">
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
          </div> */}
        </div>

        {/* <button className="shrink-0 inline-flex rounded-full text-sm border px-4 py-1.5 text-white font-bold bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-100 items-center gap-2">
                <Plus className="h-4 w-4" strokeWidth={3} />
                新しい依頼を作成する
              </button> */}
        {/* <Button
          href="/dashboard/needs/new"
          //  href={`/dashboard/needs/${id}/edit`}
          //   onClick={() => router.push("/dashboard/needs/new")}
          className="shrink-0 rounded-full px-4 py-1.5 shadow-sm shadow-purple-100"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
          新しい依頼を作成する
        </Button> */}
      </div>
      {/* <UserSummaryCard /> */}
      <div className="flex-1 overflow-y-auto p-4 w-full bg-[#f6f7fb] shadow-inner rounded-xl">
        <QuickNav />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NeedsChart />
          <ServicesChart />
        </div>
      </div>
    </div>
  );
}
