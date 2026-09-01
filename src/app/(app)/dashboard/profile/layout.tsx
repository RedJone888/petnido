"use client";

import { usePathname } from "next/navigation";

import { useLanguage } from "@/components/providers/language-provider";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, lang } = useLanguage();
  const petsPage = pathname.startsWith("/dashboard/profile/pets");
  const title = petsPage ? t.settings.pets.title : t.settings.account.title;
  const profileDescription = {
    en: "Manage your profile and publishing defaults.",
    zh: "管理个人资料与发布默认值。",
    ja: "プロフィールと公開時の既定値を管理します。",
  }[lang];
  const description = petsPage ? t.settings.pets.description : profileDescription;

  return (
    <main className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex h-full w-full flex-col overflow-hidden">
        <header className="flex h-auto shrink-0 flex-col justify-center border-b border-slate-200 pb-3 pt-3 md:h-[var(--dashboard-title-height)] md:pb-1 md:pt-0">
          <h1 className="pr-32 text-2xl font-bold text-slate-900 md:pr-0">{title}</h1>
          <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto pb-10 pr-1 pt-5">{children}</div>
      </div>
    </main>
  );
}
