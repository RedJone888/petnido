import Link from "next/link";
import { redirect } from "next/navigation";

import {
  pendingActionSecret,
  type PendingActionKind,
  verifyPendingActionToken,
} from "@/domain/auth/pending-action";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const labels: Record<PendingActionKind, string> = {
  FAVORITE_NEED: "依頼をお気に入りに追加",
  FAVORITE_SERVICE: "サービスをお気に入りに追加",
  CONSULT_NEED: "依頼について相談",
  CONSULT_SERVICE: "サービスについて相談",
  APPLY_NEED: "依頼に応募",
  BOOK_SERVICE: "サービスを予約",
};

function MessageCard({ title, body }: { title: string; body: string }) {
  return (
    <main className="min-h-[calc(100dvh-64px)] bg-[#f7f5fb] px-4 py-16">
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
        <Link href="/" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white">
          ホームへ戻る
        </Link>
      </div>
    </main>
  );
}

export default async function PendingActionPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;
  const payload = token
    ? verifyPendingActionToken(token, { secret: pendingActionSecret() })
    : null;
  if (!payload) {
    return <MessageCard title="操作リンクが無効です" body="リンクが期限切れ、または改変されています。元の詳細ページからもう一度操作してください。" />;
  }

  const ownPath = `/auth/pending-action?token=${encodeURIComponent(token!)}`;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/auth/sign-in?returnTo=${encodeURIComponent(ownPath)}`);
  }
  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { onboardingStep: true },
  });
  if (!profile || profile.onboardingStep !== "COMPLETE") {
    redirect(`/auth/continue?returnTo=${encodeURIComponent(ownPath)}`);
  }

  return (
    <main className="min-h-[calc(100dvh-64px)] bg-[#f7f5fb] px-4 py-16">
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
        <p className="text-sm font-bold text-primary">PENDING ACTION</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{labels[payload.action]}</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          ログインと初回プロフィール設定が完了しました。業務操作は実行前にこの画面で一度確認する設計です。
        </p>
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          この操作のサーバー処理は後続段階で提供します。現在はお気に入り・相談・応募・予約を作成しません。
        </div>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href={payload.returnTo} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700">
            詳細へ戻る
          </Link>
          <button type="button" disabled className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-300 px-5 py-2.5 text-sm font-bold text-white">
            まだ利用できません
          </button>
        </div>
      </div>
    </main>
  );
}
