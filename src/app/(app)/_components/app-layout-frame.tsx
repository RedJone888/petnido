"use client";

import { usePathname } from "next/navigation";

export function AppLayoutFrame({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  return (
    <div
      className={`flex flex-col overflow-hidden ${
        isDashboard ? "h-[calc(100vh-4rem)]" : "h-[calc(100vh-81px)]"
      }`}
    >
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      {!isDashboard && footer}
    </div>
  );
}
