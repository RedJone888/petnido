"use client";

import Link from "next/link";
import { Bell, MessagesSquare } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { useLanguage } from "@/components/providers/language-provider";
import { notificationPresentation } from "@/domain/notification/notification";
import { trpc } from "@/utils/trpc";
import { ConversationCenter } from "./_components/conversation-center";

export default function NotificationsPage() {
  const searchParams = useSearchParams();
  const { lang, t } = useLanguage();
  const copy = t.core.workflow;
  const conversationView =
    searchParams.get("view") === "conversations" ||
    Boolean(searchParams.get("conversation"));
  const utils = trpc.useUtils();
  const notifications = trpc.notification.listMine.useQuery(
    { limit: 50, unreadOnly: false },
    { enabled: !conversationView },
  );
  const markRead = trpc.notification.markRead.useMutation({
    onSuccess: async () =>
      Promise.all([
        utils.notification.listMine.invalidate(),
        utils.notification.unreadCount.invalidate(),
      ]),
  });
  const markAll = trpc.notification.markAllRead.useMutation({
    onSuccess: async () =>
      Promise.all([
        utils.notification.listMine.invalidate(),
        utils.notification.unreadCount.invalidate(),
      ]),
  });
  const unread = notifications.data?.filter((item) => !item.read).length ?? 0;

  return (
    <main className="flex h-full min-h-0 flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="shrink-0 border-b border-slate-200 px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl gap-2" aria-label={copy.notificationsTitle}>
          <Link
            href="/dashboard/notifications"
            aria-current={!conversationView ? "page" : undefined}
            className={`inline-flex min-h-11 items-center gap-2 rounded-t-xl border-b-2 px-4 text-sm font-bold ${!conversationView ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            <Bell className="h-4 w-4" />
            {copy.activityTab}
          </Link>
          <Link
            href="/dashboard/notifications?view=conversations"
            aria-current={conversationView ? "page" : undefined}
            className={`inline-flex min-h-11 items-center gap-2 rounded-t-xl border-b-2 px-4 text-sm font-bold ${conversationView ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            <MessagesSquare className="h-4 w-4" />
            {copy.conversationsTab}
          </Link>
        </div>
      </div>

      {conversationView ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <ConversationCenter />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-primary">
                  {copy.notificationsEyebrow}
                </p>
                <h1 className="mt-2 text-3xl font-black">
                  {copy.notificationsTitle}
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  {copy.notificationsDescription}
                </p>
              </div>
              <button
                type="button"
                disabled={!unread || markAll.isLoading}
                onClick={() => markAll.mutate()}
                className="min-h-11 rounded-xl border border-primary px-4 text-sm font-black text-primary disabled:opacity-40"
              >
                {copy.markAllRead}
              </button>
            </div>
            {notifications.isLoading ? (
              <p className="mt-8 rounded-2xl bg-slate-50 p-6 text-sm text-slate-600">
                {copy.loadingNotifications}
              </p>
            ) : null}
            {!notifications.isLoading && !notifications.data?.length ? (
              <section className="mt-8 rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                <p className="font-black">{copy.noNotifications}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {copy.notificationsEmptyDetail}
                </p>
              </section>
            ) : null}
            <div className="mt-8 space-y-3">
              {notifications.data?.map((notification) => {
                const text = notificationPresentation(notification, lang);
                return (
                  <Link
                    key={notification.id}
                    href={notification.href}
                    onClick={() => {
                      if (!notification.read) markRead.mutate({ id: notification.id });
                    }}
                    className={`block rounded-2xl border p-5 transition hover:border-primary ${notification.read ? "border-slate-200 bg-white" : "border-purple-200 bg-purple-50/60"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-black text-slate-900">{text.title}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{text.body}</p>
                      </div>
                      {!notification.read ? (
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-label={copy.unread} />
                      ) : null}
                    </div>
                    <p className="mt-3 text-xs text-slate-400">
                      {new Date(notification.createdAt).toLocaleString(lang)}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
