import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import {
  createPendingActionToken,
  pendingActionStartSchema,
  pendingActionUrl,
} from "@/modules/auth/pending-action";
import { messages } from "@/i18n/messages";
import type { Lang } from "@/domain/lang/types";

export default async function PendingActionStartPage(
  props: {
    searchParams: Promise<{ action?: string; targetId?: string; returnTo?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const cookieLang = (await cookies()).get("petnido_lang")?.value;
  const lang: Lang = cookieLang === "zh" || cookieLang === "ja" ? cookieLang : "en";
  const copy = messages[lang].core.pendingAction;
  const parsed = pendingActionStartSchema.safeParse(searchParams);
  if (!parsed.success) {
    return (
      <main className="min-h-[calc(100dvh-64px)] bg-[#f7f5fb] px-4 py-16">
        <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
          <h1 className="text-2xl font-bold text-slate-900">{copy.invalidTitle}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {copy.invalidBody}
          </p>
          <Link href="/" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white">
            {copy.home}
          </Link>
        </div>
      </main>
    );
  }

  const token = createPendingActionToken(parsed.data);
  redirect(pendingActionUrl(token));
}
