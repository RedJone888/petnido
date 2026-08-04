import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">内容が見つかりません</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          削除済み、期限切れ、または閲覧権限のない内容です。安全のため詳細は表示しません。
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white"
        >
          マイページへ戻る
        </Link>
      </div>
    </div>
  );
}
