"use client";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import { AuthModalProvider } from "@/modules/auth/client/auth-modal-provider";
import { LanguageProvider } from "./language-provider";
import type { Session } from "next-auth";

export function Providers({ children, validationProfileSession = false }: { children: React.ReactNode; validationProfileSession?: boolean }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
        }),
      ],
    }),
  );
  const validationSession: Session | undefined = validationProfileSession
    ? {
        user: { id: "validation-profile-user", email: "profile-e2e@petnido.invalid", name: "Profile E2E" },
        expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      }
    : undefined;
  return (
    <SessionProvider session={validationSession}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <AuthModalProvider>{children}</AuthModalProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </SessionProvider>
  );
}
