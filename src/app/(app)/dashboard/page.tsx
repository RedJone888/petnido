import { auth } from "@/lib/auth";
import QuickNav from "./_components/QuickNav";
import NeedsChart from "./_components/NeedsChart";
import ServicesChart from "./_components/ServicesChart";
import UserAvatar from "@/components/shared/user-avatar";
// import { useSession } from "next-auth/react";

export default async function DashboardHomePage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <>请先登录</>;
  }
  // const { data: session } = useSession();
  const user = session.user;
  return (
    <div className="p-6 h-full flex flex-col items-start">
      <div className="w-full flex items-center px-4 pb-4 gap-4 mb-4">
        <UserAvatar
          size={64}
          image={user.image}
          name={user.name}
          email={user.email}
        />

        <div className="flex-1 flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-neutral-600">
            ようこそ、
            <span className="font-bold text-primary">
              {user.name ?? "ゲスト"}
            </span>
            さん
          </h1>
          <p className="text-xs text-neutral-400">
            ここは、ペットとあなたをつなぐマイページです。
            依頼の管理、サービスプロフィール、メッセージの確認などをまとめて行えます。
          </p>
        </div>
      </div>
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
