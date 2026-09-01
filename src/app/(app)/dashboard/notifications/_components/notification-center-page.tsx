"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { DevelopmentBadge } from "../../_components/development-badge";
import { EmailNotificationControl } from "../../settings/_components/notification-settings";
import { ConversationCenter } from "./conversation-center";

export default function NotificationCenter() {
  const { t } = useLanguage();

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <header className="flex shrink-0 flex-col items-start gap-3 border-b border-slate-200/70 px-2 pb-3 pt-3 md:h-[var(--dashboard-title-height)] md:flex-row md:items-center md:justify-between md:py-0">
        <h1 className="pr-32 text-2xl font-bold text-slate-900 md:pr-0">{t.core.workflow.messagesTitle}</h1>
        <div className="max-w-full self-stretch sm:self-start md:self-auto">
          <EmailNotificationControl />
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden pb-8 pr-1 pt-4">
        <DevelopmentBadge />
        <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <ConversationCenter />
        </div>
      </div>
    </main>
  );
}
