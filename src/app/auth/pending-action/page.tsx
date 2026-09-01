import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import {
  pendingActionSecret,
  type PendingActionKind,
  verifyPendingActionToken,
} from "@/modules/auth/pending-action";
import { messages } from "@/i18n/messages";
import type { Lang } from "@/domain/lang/types";
import { getServerUserContext } from "@/server/validation/server-user-context";

import { PendingFavoriteAction } from "./pending-favorite-action";
import { PendingConsultationAction } from "./pending-consultation-action";
import { PendingApplicationAction } from "./pending-application-action";
import { PendingBookingAction } from "./pending-booking-action";

function MessageCard({ title, body, home }: { title: string; body: string; home: string }) {
  return (
    <main className="min-h-[calc(100dvh-64px)] bg-[#f7f5fb] px-4 py-16">
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
        <Link href="/" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white">
          {home}
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
  const cookieLang = cookies().get("petnido_lang")?.value;
  const lang: Lang = cookieLang === "zh" || cookieLang === "ja" ? cookieLang : "en";
  const copy = messages[lang].core.pendingAction;
  const token = searchParams.token;
  const payload = token
    ? verifyPendingActionToken(token, { secret: pendingActionSecret() })
    : null;
  if (!payload) {
    return <MessageCard title={copy.invalidTitle} body={copy.invalidBody} home={copy.home} />;
  }

  const ownPath = `/auth/pending-action?token=${encodeURIComponent(token!)}`;
  const { userId, prisma } = await getServerUserContext();
  if (!userId) {
    redirect(`/auth/sign-in?returnTo=${encodeURIComponent(ownPath)}`);
  }
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { onboardingStep: true },
  });
  if (!profile || profile.onboardingStep !== "COMPLETE") {
    redirect(`/auth/continue?returnTo=${encodeURIComponent(ownPath)}`);
  }

  const favoriteKind = payload.action === "FAVORITE_NEED"
    ? "NEED" as const
    : payload.action === "FAVORITE_SERVICE"
      ? "SERVICE" as const
      : null;
  const consultationKind = payload.action === "CONSULT_NEED"
    ? "NEED" as const
    : payload.action === "CONSULT_SERVICE"
      ? "SERVICE" as const
      : null;

  return (
    <main className="min-h-[calc(100dvh-64px)] bg-[#f7f5fb] px-4 py-16">
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
        <p className="text-sm font-bold text-primary">{copy.marker}</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{({ FAVORITE_NEED: copy.favoriteNeedTitle, FAVORITE_SERVICE: copy.favoriteServiceTitle, CONSULT_NEED: copy.consultNeedTitle, CONSULT_SERVICE: copy.consultServiceTitle, APPLY_NEED: copy.applyNeedTitle, BOOK_SERVICE: copy.bookServiceTitle } satisfies Record<PendingActionKind, string>)[payload.action]}</h1>
        {favoriteKind ? (
          <PendingFavoriteAction kind={favoriteKind} publicId={payload.targetId} returnTo={payload.returnTo} />
        ) : consultationKind ? (
          <PendingConsultationAction kind={consultationKind} publicId={payload.targetId} returnTo={payload.returnTo} clientMessageId={`pending:${payload.nonce}`} />
        ) : payload.action === "APPLY_NEED" ? (
          <PendingApplicationAction publicId={payload.targetId} returnTo={payload.returnTo} idempotencyKey={`application:${payload.nonce}`} />
        ) : payload.action === "BOOK_SERVICE" ? (
          <PendingBookingAction publicId={payload.targetId} returnTo={payload.returnTo} idempotencyKey={`booking:${payload.nonce}`} />
        ) : (
          <>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {copy.restored}
            </p>
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              {copy.notAvailable}
            </div>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link href={payload.returnTo} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700">
                {copy.back}
              </Link>
              <button type="button" disabled className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-300 px-5 py-2.5 text-sm font-bold text-white">
                {copy.notOpen}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
