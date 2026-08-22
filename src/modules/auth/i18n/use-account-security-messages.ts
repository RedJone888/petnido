"use client";

import { useLanguage } from "@/components/providers/language-provider";

import { accountSecurityMessages } from "./account-security-messages";

export function useAccountSecurityMessages() {
  const { lang } = useLanguage();
  return accountSecurityMessages[lang];
}
