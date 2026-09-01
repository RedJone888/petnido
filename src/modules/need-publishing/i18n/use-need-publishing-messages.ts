"use client";

import { useLanguage } from "@/components/providers/language-provider";

import { getNeedPublishingMessages } from "./messages";

export function useNeedPublishingMessages() {
  const { lang } = useLanguage();

  return getNeedPublishingMessages(lang);
}
