"use client";

import { useLanguage } from "@/components/providers/language-provider";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();

  return (
    <main className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex h-full w-full flex-col overflow-hidden">
        <header className="flex h-auto shrink-0 flex-col justify-center border-b border-slate-200 pb-3 pt-3 md:h-[var(--dashboard-title-height)] md:pb-1 md:pt-0">
          <h1 className="pr-32 text-2xl font-bold text-slate-900 md:pr-0">{t.settings.title}</h1>
          <p className="mt-1 text-sm leading-5 text-slate-500">{t.settings.nav.security}</p>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto pb-10 pr-1 pt-5">{children}</div>
      </div>
    </main>
  );
}
