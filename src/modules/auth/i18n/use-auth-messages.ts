"use client";

import { useLanguage } from "@/components/providers/language-provider";

import { getAuthMessages } from "./messages";

export function useAuthMessages() {
  const { lang } = useLanguage();

  return getAuthMessages(lang);
}
