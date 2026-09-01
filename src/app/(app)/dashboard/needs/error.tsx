"use client";

import { RecoverableError } from "@/components/shared/recoverable-error";

export default function NeedsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="mx-auto max-w-lg py-10"><RecoverableError error={error} onRetry={reset} onRefresh={reset} backHref="/dashboard" /></div>;
}
