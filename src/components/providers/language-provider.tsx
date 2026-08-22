"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import type { Lang } from "@/domain/lang/types";
import { messages } from "@/i18n/messages";
import { trpc } from "@/utils/trpc";

const LanguageContext = createContext<{
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: typeof messages.en;
} | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const { status } = useSession();
  const { mutate: savePreferredLocale } =
    trpc.profile.setPreferredLocale.useMutation();

  useEffect(() => {
    let saved: Lang | null = null;
    try {
      saved = localStorage.getItem("lang") as Lang | null;
    } catch {
      // Some embedded browsers restrict storage; the cookie below is the fallback.
    }
    if (saved !== "en" && saved !== "zh" && saved !== "ja") {
      saved = (document.cookie.match(/(?:^|; )petnido_lang=(en|zh|ja)(?:;|$)/)?.[1] as Lang | undefined) ?? null;
    }
    if (saved === "en" || saved === "zh" || saved === "ja") {
      setLangState(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem("lang", next);
    } catch {
      // Keep the in-memory choice and persist it with the cookie fallback.
    }
    document.cookie = `petnido_lang=${next}; path=/; max-age=31536000; samesite=lax`;
    if (status === "authenticated") {
      savePreferredLocale({ preferredLocale: next });
    }
  }, [savePreferredLocale, status]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: messages[lang],
    }),
    [lang, setLang],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}

export function usePageLanguage(initialLanguage?: Lang) {
  const context = useLanguage();
  const routeLanguageApplied = useRef(false);

  useEffect(() => {
    if (!initialLanguage || routeLanguageApplied.current) return;
    routeLanguageApplied.current = true;
    if (context.lang !== initialLanguage) context.setLang(initialLanguage);
  }, [context, initialLanguage]);

  return initialLanguage && !routeLanguageApplied.current
    ? initialLanguage
    : context.lang;
}
