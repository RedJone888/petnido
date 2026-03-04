import Link from "next/link";
import NeedDetailPage from "@/components/browse/needs/NeedDetailPage";

export default function ActualDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  // const need = await getNeed(params.id)
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link
        href="/public/browse/needs"
        className="text-gray-500 hover:text-gray-900 text-xl flex items-center gap-1"
      >
        <svg
          /* 返回图标 */ xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        一覧に戻る (返回列表)
      </Link>
      {/* <NeedDetailPage /> */}
      {/* <NeedDetailPage initialNeed={need} /> */}
    </div>
  );
}
