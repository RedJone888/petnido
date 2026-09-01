"use client";

import { Inbox } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import UserAvatar from "@/components/shared/user-avatar";
import { useLanguage } from "@/components/providers/language-provider";
import { trpc } from "@/utils/trpc";

interface InboxMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function InboxMenu({ open: controlledOpen, onOpenChange }: InboxMenuProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = useCallback((nextOpen: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }, [controlledOpen, onOpenChange]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { lang, t } = useLanguage();
  const copy = t.core.workflow;
  const conversations = trpc.conversation.listMine.useQuery(
    { includeArchived: false },
    { refetchInterval: 15_000 },
  );
  const recent = conversations.data?.slice(0, 5) ?? [];
  const unreadCount = conversations.data?.filter((conversation) => conversation.unread).length ?? 0;

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!buttonRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, setOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={copy.messagesTitle}
        aria-expanded={open}
        aria-controls="recent-messages-panel"
        onClick={() => setOpen(!open)}
        className={`relative grid h-11 w-11 place-items-center rounded-xl text-slate-600 transition hover:bg-[#f2edf4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${open ? "bg-[#eee7f3] text-primary ring-1 ring-[#d7c7e0]" : ""}`}
      >
        <Inbox className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-bg0 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label={t.nav.closeMenu}
            onClick={() => setOpen(false)}
            className="fixed inset-x-0 bottom-0 top-16 z-[1000] bg-slate-950/20 backdrop-blur-[1px] md:hidden"
          />
          <div
            id="recent-messages-panel"
            ref={panelRef}
            role="dialog"
            aria-label={copy.recentMessages}
            className="fixed left-3 right-3 top-[4.5rem] z-[1001] max-h-[70dvh] overflow-hidden rounded-2xl border border-slate-200 bg-white text-sm shadow-[0_18px_48px_-20px_rgba(30,20,48,0.38)] animate-fadeIn md:absolute md:inset-x-auto md:right-0 md:top-auto md:mt-3 md:w-[22rem] md:max-h-none md:rounded-2xl md:border md:shadow-xl"
          >
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">{copy.recentMessages}</p>
            </div>
            <div className="max-h-[calc(70dvh-7.5rem)] overflow-y-auto md:max-h-[22rem]">
              {conversations.isLoading ? (
                <p className="px-4 py-8 text-center text-slate-500" role="status">{copy.loadingMessages}</p>
              ) : null}
              {conversations.error ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-slate-500">{copy.unableConversation}</p>
                  <button type="button" onClick={() => conversations.refetch()} className="mt-2 text-xs font-bold text-primary hover:underline">
                    {t.core.common.retry}
                  </button>
                </div>
              ) : null}
              {!conversations.isLoading && !conversations.error && recent.length === 0 ? (
                <div className="px-6 py-6 text-center" role="status">
                  <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-purple-50 text-primary">
                    <Inbox className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-slate-700">{copy.noMessages}</p>
                  <p className="mx-auto mt-1 max-w-[17rem] text-xs leading-5 text-slate-500">{copy.noMessagesDetail}</p>
                </div>
              ) : null}
              {recent.map((conversation) => (
                <Link
                  key={conversation.id}
                  href={`/dashboard/messages?conversation=${encodeURIComponent(conversation.id)}`}
                  onClick={() => setOpen(false)}
                  className={`flex gap-3 border-b border-slate-100 px-4 py-3 transition last:border-b-0 hover:bg-slate-50 ${conversation.unread ? "bg-purple-50/60" : ""}`}
                >
                  <UserAvatar
                    image={conversation.counterpart?.image}
                    name={conversation.counterpart?.name}
                    size={40}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-bold text-slate-900">{conversation.counterpart?.name || copy.user}</p>
                      {conversation.unread ? <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-label={copy.unreadMessage} /> : null}
                    </div>
                    <p className="mt-0.5 truncate text-xs font-medium text-slate-600">{conversation.context.title}</p>
                    <p className="mt-1 truncate text-xs text-slate-400">
                      {conversation.lastMessage?.kind === "SYSTEM" ? copy.system : ""}{conversation.lastMessage?.body || ""}
                    </p>
                    {conversation.lastMessageAt ? (
                      <p className="mt-1 text-[10px] text-slate-400">{new Date(conversation.lastMessageAt).toLocaleString(lang)}</p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
            <div className="border-t border-slate-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <Link
                href="/dashboard/messages"
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center justify-center rounded-xl bg-primary/10 px-4 text-xs font-bold text-primary transition hover:bg-primary/15"
              >
                {copy.viewMessageCenter}
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
