"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { NEED_ENTRY_STORAGE_KEY } from "@/app/(flow)/needs/create/preview/types";
import Navbar from "./Navbar";
import { useLanguage } from "@/components/providers/language-provider";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const isNeedCreationFlow = pathname === "/needs/create" || pathname.startsWith("/needs/create/");

  useEffect(() => {
    if (isNeedCreationFlow) return;
    window.sessionStorage.setItem(NEED_ENTRY_STORAGE_KEY, `${window.location.pathname}${window.location.search}`);
  }, [isNeedCreationFlow, pathname]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only z-[1000] rounded-md bg-white px-3 py-2 text-sm font-bold text-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t.nav.skipToContent}
      </a>
      {!isNeedCreationFlow && <Navbar />}
      <div
        id="main-content"
        className={isNeedCreationFlow ? "flex min-h-screen flex-1 flex-col" : "flex flex-1 flex-col pt-16"}
      >
        {children}
      </div>
    </>
  );
}
