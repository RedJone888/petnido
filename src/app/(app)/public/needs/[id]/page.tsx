import Link from "next/link";
import NeedDetailPage from "../_components/NeedDetailPage";
// import { useNeed } from "@/hooks/useNeed";
import { getNeedById } from "@/lib/need";

export default async function NeedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // const { getNeedById } = useNeed(id);
  // const needData = getNeedById.data;
  const needData = await getNeedById(id);

  // if (!needData) {
  //   return <div className="p-8">请求未找到</div>;
  // }
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link
        href="/public/needs"
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
      <NeedDetailPage initialNeed={needData} />
    </div>
  );
}
