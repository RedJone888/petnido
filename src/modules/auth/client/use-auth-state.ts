"use client";

import { useSession } from "next-auth/react";

/**
 * Client-only session state for UI that must react to sign-in changes.
 * Authorization still belongs to server components and protected procedures.
 */
export function useAuthState() {
  const { data: session, status } = useSession();
  return {
    session,
    user: session?.user ?? null,
    state:
      status === "loading"
        ? ("loading" as const)
        : session
          ? ("authenticated" as const)
          : ("anonymous" as const),
    isLoading: status === "loading",
    isAuthenticated: Boolean(session),
  };
}
