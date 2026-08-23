import { PiWarningCircle } from "react-icons/pi";

import cn from "@/lib/cn";

export function PublishingValidationAlert({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex max-w-full items-start gap-2 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm font-semibold text-danger-text",
        className,
      )}
    >
      <PiWarningCircle className="mt-0.5 shrink-0" size={18} />
      <div>{children}</div>
    </div>
  );
}
