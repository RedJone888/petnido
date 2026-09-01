import Link from "next/link";

import type { PendingActionKind } from "@/modules/auth/pending-action";

export function pendingActionStartHref({
  action,
  targetId,
  returnTo,
}: {
  action: PendingActionKind;
  targetId: string;
  returnTo: string;
}) {
  const query = new URLSearchParams({ action, targetId, returnTo });
  return `/auth/pending-action/start?${query.toString()}`;
}

export function PendingActionLink({
  action,
  targetId,
  returnTo,
  children,
  className,
}: {
  action: PendingActionKind;
  targetId: string;
  returnTo: string;
  children: React.ReactNode;
  className: string;
}) {
  return (
    <Link
      href={pendingActionStartHref({ action, targetId, returnTo })}
      className={className}
    >
      {children}
    </Link>
  );
}
