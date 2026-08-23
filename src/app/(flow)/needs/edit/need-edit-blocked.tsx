"use client";

import Link from "next/link";

import { useLanguage } from "@/components/providers/language-provider";
import { useNeedPublishingMessages } from "@/modules/need-publishing/client";

export function NeedEditBlocked() {
  const { t } = useLanguage();
  const needMessages = useNeedPublishingMessages();
  const copy = t.core.management.actions;
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-[#fcfbf8] px-4 py-12">
      <section className="w-full max-w-xl rounded-3xl border border-purple-100 bg-white p-8 text-center shadow-xl shadow-purple-100/40">
        <h1 className="text-2xl font-black text-slate-900">{copy.matchedEditBlocked}</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">{copy.cancelMatchDetail}</p>
        <Link
          href="/dashboard/needs"
          className="mt-7 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white"
        >
          {needMessages.needPublishing.back}
        </Link>
      </section>
    </main>
  );
}
