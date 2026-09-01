"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { NEED_ENTRY_STORAGE_KEY } from "@/modules/need-publishing/client";
import Navbar from "./Navbar";
import { useLanguage } from "@/components/providers/language-provider";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const isNeedPublishingFlow =
    pathname === "/needs/create" ||
    pathname.startsWith("/needs/create/") ||
    pathname.startsWith("/needs/edit/") ||
    /^\/(en|zh|ja)\/needs\/(create|edit)(?:\/|$)/.test(pathname);

  useEffect(() => {
    if (isNeedPublishingFlow) return;
    window.sessionStorage.setItem(NEED_ENTRY_STORAGE_KEY, `${window.location.pathname}${window.location.search}`);
  }, [isNeedPublishingFlow, pathname]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only z-[1000] rounded-md bg-white px-3 py-2 text-sm font-bold text-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t.nav.skipToContent}
      </a>
      <Navbar />
      <div
        id="main-content"
        className={
          isNeedPublishingFlow
            ? "h-dvh min-h-0 flex-none overflow-hidden"
            : "flex flex-1 flex-col pt-16"
        }
      >
        {children}
      </div>
    </>
  );
}
