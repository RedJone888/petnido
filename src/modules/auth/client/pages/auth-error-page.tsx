"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { useAuthMessages } from "../../i18n/use-auth-messages";

export function AuthErrorPageClient({ errorCode }: { errorCode: string }) {
  const text = useAuthMessages().errorPage;
  const message =
    errorCode === "Configuration"
      ? text.configuration
      : errorCode === "AccessDenied" || errorCode === "OAuthAccountNotLinked"
        ? text.denied
        : text.default;

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] w-full bg-[#f6f3fa] px-5 py-6 sm:py-8">
      <section className="mx-auto my-auto w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-xl">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertCircle aria-hidden="true" className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-black text-slate-900">{text.title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        <div className="mt-7 grid gap-3">
          <Link
            href="/auth/sign-in"
            className="rounded-xl bg-primary px-5 py-3 font-bold text-white shadow-sm transition hover:opacity-90"
          >
            {text.retry}
          </Link>
          <Link href="/" className="px-5 py-2 text-sm font-semibold text-slate-600 underline">
            {text.home}
          </Link>
        </div>
      </section>
    </main>
  );
}
