"use client";

import { usePathname } from "next/navigation";

export function LocalizedPublicLayoutFrame({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);
  const needsIndex = segments.indexOf("needs");
  const isNeedDetail = needsIndex !== -1 && segments.length > needsIndex + 1;

  return (
    <>
      {children}
      {!isNeedDetail && footer}
    </>
  );
}
