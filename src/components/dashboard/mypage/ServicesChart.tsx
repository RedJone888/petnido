import dynamic from "next/dynamic";

// 必须使用 dynamic 禁用 SSR
const CommonPieChart = dynamic(
  () => import("@/components/charts/CommonPieChart"),
  { ssr: false },
);
export default function ServicesChart() {
  const typeData = [
    { name: "シッター訪問", value: 5 },
    { name: "ペット預かり", value: 3 },
    { name: "その他", value: 2 },
  ];
  return (
    <div className="bg-white px-6 py-4 rounded-2xl border border-neutral-200">
      <div className="flex justify-between items-end mb-3">
        <h3 className="text font-bold text-neutral-800">サービス状況</h3>
        <span className="text-xs text-neutral-500">合計 10 件</span>
      </div>
      <div className="p-3 bg-green-50 rounded-xl border border-green-100">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-green-700 font-bold">シッター受付中</p>
            <p className="text-[10px] text-green-600 mt-1">
              現在あなたのプロフィールは公開されています
            </p>
          </div>
          <div className="w-10 h-6 bg-green-500 rounded-full relative shadow-inner">
            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow" />
          </div>
        </div>
      </div>
      <CommonPieChart
        height="186px"
        title="サービスカテゴリー"
        data={typeData}
        colors={["#F6658C", "#008E94", "#FFBF00"]}
        titlePos={{ top: "20%", left: "58%" }}
        legendPos={{ top: "45%", left: "60%", orient: "vertical" }}
        chartCenter={["30%", "50%"]}
        chartRadius={["65%", "85%"]}
      />
    </div>
  );
}
