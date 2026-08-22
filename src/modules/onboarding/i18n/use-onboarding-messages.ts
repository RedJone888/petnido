"use client";

import { useLanguage } from "@/components/providers/language-provider";

import { onboardingMessages } from "./messages";

export function useOnboardingMessages() {
  const { lang } = useLanguage();
  return { lang, copy: onboardingMessages[lang] };
}
