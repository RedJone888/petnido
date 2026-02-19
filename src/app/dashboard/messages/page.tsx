"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import EmptyState from "@/components/dashboard/EmptyState";
export default function MessagesPage() {
  const hasMessage = true;
  if (!hasMessage) {
    return (
      <EmptyState
        icon={<MessageCircle className="w-10 h-10" />}
        title="まだメッセージはありません"
        description="依頼が成立すると、ここにシッターさんや飼い主さんとのメッセージが表示されます。"
      />
    );
  }
  // ---------- MOCK CONVERSATIONS ----------
  const conversations = [
    {
      id: "c1",
      userName: "兔兔姐姐",
      lastMessage: "好的，我可以照顾你的小兔子！",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      messages: [
        { fromMe: false, text: "你好，我下周要出差两天……" },
        { fromMe: true, text: "你好，我有空的，可以帮你照顾兔兔！" },
        { fromMe: false, text: "好的，我可以照顾你的小兔子！" },
      ],
    },
    {
      id: "c2",
      userName: "宠物博士",
      lastMessage: "好的，我会把具体事项发给你。",
      avatar:
        "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80",
      messages: [
        { fromMe: true, text: "你有时间吗？我需要帮忙照顾猫咪一天。" },
        { fromMe: false, text: "好的，我会把具体事项发给你。" },
      ],
    },
  ];

  // 当前选中的会话
  const [activeId, setActiveId] = useState("c1");
  const activeChat = conversations.find((c) => c.id === activeId)!;

  // 输入框状态
  const [input, setInput] = useState("");

  function handleSend() {
    if (!input.trim()) return;

    activeChat.messages.push({
      fromMe: true,
      text: input,
    });
    setInput("");
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900 mb-4">
        メッセージ
      </h1>
      <p>メッセージ機能は後ほど実装します。</p>
      <div className="flex h-[80vh] border rounded-lg overflow-hidden">
        {/* -------------------------------------- */}
        {/* LEFT SIDEBAR – Conversation List */}
        {/* -------------------------------------- */}
        <aside className="w-64 border-r bg-gray-50">
          <h2 className="p-4 text-lg font-semibold">我的消息</h2>

          <div className="overflow-y-auto h-full">
            {conversations.map((conv) => {
              const active = conv.id === activeId;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveId(conv.id)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b 
                  ${
                    active
                      ? "bg-white shadow-inner"
                      : "hover:bg-gray-100 transition"
                  }`}
                >
                  <img
                    src={conv.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{conv.userName}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {conv.lastMessage}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* -------------------------------------- */}
        {/* RIGHT CONTENT – Chat Window */}
        {/* -------------------------------------- */}
        <section className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b p-4 font-semibold">
            与 {activeChat.userName} 的对话
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeChat.messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-2 rounded-lg max-w-[70%] text-sm ${
                    m.fromMe
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t p-3 flex gap-3">
            <input
              className="flex-1 border rounded px-3 py-2"
              placeholder="输入消息…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button
              onClick={handleSend}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg"
            >
              发送
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
