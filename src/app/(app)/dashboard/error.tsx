"use client";

import { useEffect } from "react";

import { RecoverableError } from "@/components/shared/recoverable-error";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Dashboard error", error.digest ?? error.name); }, [error]);
  return <div className="flex min-h-[60vh] items-center justify-center p-6"><div className="w-full max-w-lg"><RecoverableError error={error} onRetry={reset} onRefresh={reset} backHref="/dashboard" /></div></div>;
}
