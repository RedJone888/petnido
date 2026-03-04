import dynamic from "next/dynamic";
// 必须使用 dynamic 禁用 SSR
const CommonPieChart = dynamic(
  () => import("@/components/charts/CommonPieChart"),
  { ssr: false },
);

export default function NeedsChart() {
  const typeData = [
    { name: "シッター訪問", value: 5 },
    { name: "ペット預かり", value: 3 },
    { name: "その他", value: 2 },
  ];

  const statusData = [
    { name: "募集中", value: 3 },
    { name: "期限切れ", value: 2 },
    { name: "成約済み", value: 2 },
    { name: "募集終了", value: 2 },
    { name: "キャンセル", value: 3 },
  ];

  return (
    <div className="px-6 py-4 bg-white rounded-2xl border border-neutral-200">
      <div className="flex justify-between items-end mb-3">
        <h3 className="font-bold text-neutral-800">依頼状況</h3>
        <span className="text-xs text-neutral-500">合計 10 件</span>
      </div>
      {/* 使用 Tailwind Grid 布局 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <CommonPieChart
          height="250px"
          title="依頼カテゴリー"
          data={typeData}
          colors={["#F6658C", "#008E94", "#FFBF00"]}
          // titlePos={{ top: "5%", left: "center" }}
        />

        <CommonPieChart
          height="250px"
          title="依頼ステータス"
          data={statusData}
          colors={["#0BDA51", "#FF5C00", "#B069DB", "#6D8196", "#FA5053"]}
          // titlePos={{ top: "5%", left: "center" }}
        />
      </div>
    </div>
  );
}
