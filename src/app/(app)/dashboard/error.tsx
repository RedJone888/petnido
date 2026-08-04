"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error", error.digest ?? error.name);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">
          ページを読み込めませんでした
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          会话が期限切れ、通信に失敗、またはこの内容を利用できない可能性があります。
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="min-h-11 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white"
          >
            もう一度試す
          </button>
          <Link
            href="/auth/sign-in?returnTo=%2Fdashboard"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700"
          >
            再ログイン
          </Link>
        </div>
      </div>
    </div>
  );
}
