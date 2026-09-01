"use client";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import { AuthModalProvider } from "@/modules/auth/client/auth-modal-provider";
import { LanguageProvider } from "./language-provider";
import type { Session } from "next-auth";

export function Providers({ children, initialSession }: { children: React.ReactNode; initialSession: Session | null }) {
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
  return (
    <SessionProvider session={initialSession}>
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
