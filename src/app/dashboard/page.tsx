"use client";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import UserSummaryCard from "@/components/dashboard/UserSummaryCard";
import StatCardsRow from "@/components/dashboard/StatCardsRow";
export default function DashboardHomePage() {
  const router = useRouter();
  return (
    <div className="overflow-y-auto">
      <UserSummaryCard />
      <section className="mb-10">
        <h2 className="text-base font-semibold text-neutral-900 mb-3">
          クイック操作
        </h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" className="px-7 py-3 text-sm rounded-full">
            お世話の依頼を作成する
          </Button>
          <Button
            variant="outlineDark"
            className="px-7 py-3 text-sm rounded-full"
            onClick={() => router.push("/dashboard/profile")}
          >
            サービスプロフィールを編集する
          </Button>
        </div>
      </section>
      <StatCardsRow />
    </div>
  );
}
