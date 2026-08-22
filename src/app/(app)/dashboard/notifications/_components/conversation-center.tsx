"use client";

import { Archive, LoaderCircle, MessageCircle, Send } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import EmptyState from "../../_components/EmptyState";
import { trpc } from "@/utils/trpc";
import { RecoverableError } from "@/components/shared/recoverable-error";
import { useLanguage } from "@/components/providers/language-provider";
import { AppImage } from "@/components/ui/app-image";

function newClientMessageId() {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `chat:${random}`;
}

export function ConversationCenter() {
  const { t, lang } = useLanguage();
  const copy = t.core.workflow;
  const requestedConversation = useSearchParams().get("conversation");
  const [activeId, setActiveId] = useState<string | null>(requestedConversation);
  const [input, setInput] = useState("");
  const pendingClientMessageId = useRef<string | null>(null);
  const lastMarkedMessage = useRef<string | null>(null);
  const utils = trpc.useContext();
  const conversations = trpc.conversation.listMine.useQuery({ includeArchived: false }, { refetchInterval: 5_000 });

  useEffect(() => {
    if (requestedConversation) setActiveId(requestedConversation);
    else if (!activeId && conversations.data?.[0]) setActiveId(conversations.data[0].id);
  }, [activeId, conversations.data, requestedConversation]);

  const messages = trpc.conversation.listMessages.useInfiniteQuery(
    { conversationId: activeId ?? "", limit: 30 },
    {
      enabled: Boolean(activeId),
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      refetchInterval: 3_000,
    },
  );
  const messageItems = useMemo(() => {
    const items = messages.data?.pages.flatMap((page) => page.items) ?? [];
    return [...items].sort((left, right) => {
      const byTime = new Date(left.createdAt).valueOf() - new Date(right.createdAt).valueOf();
      return byTime || left.id.localeCompare(right.id);
    });
  }, [messages.data]);
  const activeConversation = conversations.data?.find((conversation) => conversation.id === activeId) ?? null;
  const markRead = trpc.conversation.markRead.useMutation({
    onSuccess: () => utils.conversation.listMine.invalidate(),
  });

  useEffect(() => {
    const latest = messageItems.at(-1);
    if (!activeId || !latest || lastMarkedMessage.current === latest.id) return;
    lastMarkedMessage.current = latest.id;
    markRead.mutate({ conversationId: activeId });
  }, [activeId, markRead, messageItems]);

  const send = trpc.conversation.send.useMutation({
    onSuccess: async () => {
      setInput("");
      pendingClientMessageId.current = null;
      await Promise.all([
        utils.conversation.listMessages.invalidate({ conversationId: activeId ?? "", limit: 30 }),
        utils.conversation.listMine.invalidate(),
      ]);
    },
  });
  const archive = trpc.conversation.setArchived.useMutation({
    onSuccess: async () => {
      setActiveId(null);
      await utils.conversation.listMine.invalidate();
    },
  });

  const submit = () => {
    const body = input.trim();
    if (!body || !activeId) return;
    pendingClientMessageId.current ??= newClientMessageId();
    send.mutate({ conversationId: activeId, body, clientMessageId: pendingClientMessageId.current });
  };

  if (conversations.isLoading) {
    return <div className="grid h-full place-items-center text-sm text-slate-500"><span className="flex items-center gap-2"><LoaderCircle size={18} className="animate-spin" />{copy.loadingMessages}</span></div>;
  }
  if (conversations.error) {
    return <div className="m-6"><RecoverableError error={conversations.error} onRetry={() => void conversations.refetch()} backHref="/dashboard" compact /></div>;
  }
  if (!conversations.data?.length && !requestedConversation) {
    return <EmptyState icon={<MessageCircle className="h-10 w-10" />} title={copy.noMessages} description={copy.noMessagesDetail} />;
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-white">
      <aside className={`${activeId ? "hidden md:block" : "block"} w-full shrink-0 border-r border-slate-200 bg-slate-50 md:w-80`}>
        <div className="border-b border-slate-200 bg-white p-5"><h1 className="text-xl font-black text-slate-900">{copy.messagesTitle}</h1><p className="mt-1 text-xs text-slate-500">{copy.messagesDescription}</p></div>
        <div className="h-[calc(100%-81px)] overflow-y-auto">
          {conversations.data?.map((conversation) => (
            <button key={conversation.id} type="button" onClick={() => setActiveId(conversation.id)} className={`w-full border-b border-slate-200 p-4 text-left transition ${activeId === conversation.id ? "bg-purple-50" : "bg-white hover:bg-slate-50"}`}>
              <div className="flex items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-purple-100 text-sm">{conversation.counterpart?.image ? <AppImage src={conversation.counterpart.image} alt="" width={40} height={40} className="h-full w-full object-cover" /> : "🐾"}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-bold text-slate-900">{conversation.counterpart?.name || copy.user}</p>{conversation.unread ? <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-label={copy.unreadMessage} /> : null}</div><p className="mt-1 truncate text-xs font-medium text-slate-600">{conversation.context.title}</p><p className="mt-1 truncate text-xs text-slate-400">{conversation.lastMessage?.kind === "SYSTEM" ? copy.system : ""}{conversation.lastMessage?.body || ""}</p></div></div>
            </button>
          ))}
        </div>
      </aside>

      <section className={`${activeId ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col`}>
        {activeConversation ? (
          <>
            <header className="flex min-h-20 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-6"><div className="min-w-0"><button type="button" onClick={() => setActiveId(null)} className="mb-1 text-xs font-bold text-primary md:hidden">← {copy.backToConversations}</button><h2 className="truncate font-black text-slate-900">{activeConversation.counterpart?.name || copy.user}</h2><p className="truncate text-xs text-slate-500">{activeConversation.context.kind === "NEED" ? copy.request : copy.service} · {activeConversation.context.title}</p></div><button type="button" disabled={archive.isLoading} onClick={() => archive.mutate({ conversationId: activeConversation.id, archived: true })} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 px-3 text-xs font-bold text-slate-600"><Archive size={15} />{copy.archive}</button></header>
            <div className="flex-1 overflow-y-auto bg-[#faf9fc] p-4 sm:p-6">
              {messages.hasNextPage ? <div className="mb-5 text-center"><button type="button" disabled={messages.isFetchingNextPage} onClick={() => messages.fetchNextPage()} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-600">{messages.isFetchingNextPage ? copy.loading : copy.olderMessages}</button></div> : null}
              {messages.isLoading ? <p className="py-10 text-center text-sm text-slate-500">{copy.loading}</p> : messages.error ? <p className="rounded-xl bg-danger-bg p-3 text-sm text-danger-text">{copy.unableConversation}</p> : <div className="space-y-3">{messageItems.map((message) => message.kind === "SYSTEM" ? <div key={message.id} className="mx-auto max-w-xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs leading-5 text-amber-900">{message.body}</div> : <div key={message.id} className={`flex ${message.sender?.id === activeConversation.counterpart?.id ? "justify-start" : "justify-end"}`}><div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.sender?.id === activeConversation.counterpart?.id ? "rounded-bl-md bg-white text-slate-800 shadow-sm" : "rounded-br-md bg-primary text-white"}`}><p className="whitespace-pre-wrap break-words">{message.body}</p><p className={`mt-1 text-[10px] ${message.sender?.id === activeConversation.counterpart?.id ? "text-slate-400" : "text-white/65"}`}>{new Date(message.createdAt).toLocaleString(lang)}</p></div></div>)}</div>}
            </div>
            <footer className="border-t border-slate-200 bg-white p-3 sm:p-4"><div className="flex items-end gap-2"><textarea value={input} onChange={(event) => { setInput(event.target.value.slice(0, 4000)); if (send.error) send.reset(); }} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(); } }} rows={2} placeholder={copy.placeholder} className="min-h-12 flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm leading-6 outline-none focus:border-primary" /><button type="button" aria-label={copy.send} disabled={!input.trim() || send.isLoading} onClick={submit} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-white disabled:opacity-40"><Send size={18} /></button></div>{send.error ? <p className="mt-2 text-xs text-danger-text" role="alert">{copy.sendError}</p> : null}</footer>
          </>
        ) : <div className="grid h-full place-items-center text-sm text-slate-400">{copy.chooseConversation}</div>}
      </section>
    </div>
  );
}
