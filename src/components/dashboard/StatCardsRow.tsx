"use client";
import { trpc } from "@/utils/trpc";
interface StatCardProps {
  title: string;
  value: string | number;
  helper?: string;
}
const StatCard = ({ title, value, helper }: StatCardProps) => (
  <div className="flex-1 border border-neutral-200 rounded-2xl px-6 py-5 bg-white shadow-sm">
    <p className="text-sm text-neutral-600 mb-3">{title}</p>
    <p className="text-3xl font-semibold text-neutral-900 mb-1">{value}</p>
    {helper && <p className="text-xs text-neutral-500">{helper}</p>}
  </div>
);

export default function StatCardsRow() {
  const { data, isLoading } = trpc.needs.useQuery();
  const totalNeeds = data?.totalNeeds ?? 0;
  const completed = data?.completedNeeds ?? 0;
  const reviews = data?.reviewCount ?? 0;
  return (
    <section className="mb-10">
      <div className="flex gap-4">
        <StatCard
          title="公開中の依頼"
          value={isLoading ? 0 : totalNeeds}
          helper="現在募集中の依頼の数です。"
        />
        <StatCard
          title="完了した予約"
          value={isLoading ? 0 : completed}
          helper="これまでに成立したお世話の数です。"
        />
        <StatCard
          title="受け取ったレビュー"
          value={isLoading ? 0 : reviews}
          helper="飼い主さんからの評価の合計です。"
        />
      </div>
    </section>
  );
}
