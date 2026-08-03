"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { NEED_ENTRY_STORAGE_KEY } from "@/app/(flow)/needs/create/preview/types";
import Navbar from "./Navbar";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isNeedCreationFlow = pathname === "/needs/create" || pathname.startsWith("/needs/create/");

  useEffect(() => {
    if (isNeedCreationFlow) return;
    window.sessionStorage.setItem(NEED_ENTRY_STORAGE_KEY, `${window.location.pathname}${window.location.search}`);
  }, [isNeedCreationFlow, pathname]);

  return (
    <>
      {!isNeedCreationFlow && <Navbar />}
      <main className={isNeedCreationFlow ? "flex min-h-screen flex-1 flex-col" : "flex flex-1 flex-col pt-16"}>
        {children}
      </main>
    </>
  );
}
