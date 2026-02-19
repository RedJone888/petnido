"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  useEffect(() => {
    document.body.dataset.layout = pathname === "/" ? "home" : "app";
  }, [pathname]);
  return <>{children}</>;
}
