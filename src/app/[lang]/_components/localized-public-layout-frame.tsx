"use client";

import { usePathname } from "next/navigation";

export function shouldHideFooter(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  const needsIndex = segments.indexOf("needs");
  const isNeedDetail = needsIndex !== -1 && segments.length > needsIndex + 1;
  const isCareTypes = segments.includes("care-types");

  return isNeedDetail || isCareTypes;
}

export function LocalizedPublicLayoutFrame({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();
  const hide = shouldHideFooter(pathname);

  return (
    <>
      {children}
      {!hide && footer}
    </>
  );
}
