"use client";

import { useState } from "react";
import Toggle from "@/components/ui/Toggle";

export default function SettingsPage() {
  const [acceptAsSitter, setAcceptAsSitter] = useState(true);
  // ------------ MOCK INITIAL DATA -------------
  const [displayName, setDisplayName] = useState("兔兔爱好者");
  const [bio, setBio] = useState(
    "我养兔多年，经验丰富，擅长照顾小动物。\n可以提供上门照看、喂食、简单清洁。"
  );
  const [city, setCity] = useState("Osaka");
  const [country, setCountry] = useState("Japan");

  const [isSitterActive, setIsSitterActive] = useState(true);
  const [emailNotification, setEmailNotification] = useState(true);

  const [language, setLanguage] = useState("zh");

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    alert("（模拟保存）设置已更新！");
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-neutral-900">設定　Settings</h1>
      <section>
        <h2 className="text-sm font-semibold text-neutral-900 mb-2">
          アカウント情報
        </h2>
        <p className="text-xs text-neutral-600 mb-3">
          メールアドレスやパスワードの変更は、今後アカウント管理ページから行えるようになります。
        </p>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-neutral-900 mb-2">
          言語設定
        </h2>
        <p className="text-xs text-neutral-600 mb-3">
          現在は日本語　UI
          を提供しています。今後、中国語や英語にも対応予定です。
        </p>
      </section>
      <section>
        <h2 className="text-sm font-semibold text-neutral-900 mb-2">
          シッターとして受付
        </h2>
        <div className="flex items-center justify-between bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3">
          <div>
            <p className="text-sm font-medium text-neutral-900">
              サービスの受付をオンにする
            </p>
            <p className="text-xs text-neutral-600">
              オンのすると、あなたのサービスプロフィールが検索結果に表示されます。
            </p>
          </div>
          <button
            onClick={() => setAcceptAsSitter((v) => !v)}
            className={`w-11 h-6 rounded-full flex items-center px-1 transition ${
              acceptAsSitter ? "bg-purple2" : "bg-neutral-300"
            }`}
          >
            <span
              className={`w-4 h-4 bg-white rounded-full shadow transform transition ${
                acceptAsSitter ? "translate-x-4" : ""
              }`}
            ></span>
          </button>
        </div>
      </section>
      <form className="space-y-8" onSubmit={handleSave}>
        {/* ----------------- Avatar ----------------- */}
        <div>
          <label className="block font-medium mb-2">头像</label>
          <div className="flex items-center gap-4">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
              className="w-20 h-20 rounded-full object-cover"
              alt="avatar"
            />
            <button
              type="button"
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              上传新头像
            </button>
          </div>
        </div>

        {/* ----------------- Display Name ----------------- */}
        <div>
          <label className="block font-medium mb-1">昵称</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        {/* ----------------- Bio ----------------- */}
        <div>
          <label className="block font-medium mb-1">自我介绍</label>
          <textarea
            className="border rounded px-3 py-2 w-full"
            rows={5}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        {/* ----------------- City & Country ----------------- */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block font-medium mb-1">城市</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div className="flex-1">
            <label className="block font-medium mb-1">国家</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
        </div>

        {/* ----------------- Toggle Switches ----------------- */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">状态设置</h2>

          {/* Sitter Active */}
          <Toggle
            label="是否开放接单（我愿意提供照顾服务）"
            value={isSitterActive}
            onChange={() => setIsSitterActive(!isSitterActive)}
          />

          {/* Email Notification */}
          <Toggle
            label="是否接收邮件通知（匹配、消息提醒）"
            value={emailNotification}
            onChange={() => setEmailNotification(!emailNotification)}
          />
        </div>

        {/* ----------------- Language ----------------- */}
        <div>
          <label className="block font-medium mb-1">界面语言</label>
          <select
            className="border rounded px-3 py-2"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="zh">中文</option>
            <option value="ja">日语</option>
            <option value="en">英语</option>
          </select>
        </div>

        {/* ----------------- Submit Button ----------------- */}
        <div className="pt-4">
          <button
            type="submit"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg"
          >
            保存设置
          </button>
        </div>
      </form>
    </div>
  );
}
