"use client";

import { PawPrint, SlidersHorizontal, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AccountSettings } from "./_components/account-settings";
import { PreferencesSettings } from "./_components/notification-settings";
import { PetSettings } from "./_components/pet-settings";
import { useLanguage } from "@/components/providers/language-provider";

export default function SettingsPage() {
  const { t } = useLanguage();
  type SettingsTab = "account" | "pets" | "preferences";
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const sections = [
    { id: "account" as const, href: "#account", label: t.settings.nav.account, icon: UserRound },
    { id: "pets" as const, href: "#pets", label: t.settings.nav.pets, icon: PawPrint },
    {
      id: "preferences" as const,
      href: "#preferences",
      label: t.settings.nav.preferences,
      icon: SlidersHorizontal,
    },
  ];

  useEffect(() => {
    const syncHash = () => {
      const value = window.location.hash.slice(1);
      if (value === "notifications") {
        window.history.replaceState(null, "", "#preferences");
        setActiveTab("preferences");
        return;
      }
      setActiveTab(value === "pets" || value === "preferences" ? value : "account");
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  return (
    <main className="w-full h-full flex flex-col overflow-hidden">
      <div className="mx-auto max-w-5xl w-full h-full flex flex-col overflow-hidden">
        {/* Top Header: Title + Tab Navigation */}
        <header className="shrink-0 pb-1">
          <h1 className="text-2xl font-bold text-slate-900">
            {t.settings.title}
          </h1>

          <nav
            aria-label={t.settings.title}
            className="mt-4 flex gap-2 overflow-x-auto border-b border-slate-200"
          >
            {sections.map(({ id, href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={activeTab === id ? "page" : undefined}
                onClick={() => setActiveTab(id)}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-t-xl border-b-2 px-4 text-sm font-bold transition ${activeTab === id ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </header>

        {/* Lower Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-5 pr-1 pb-10">
          {activeTab === "account" ? <AccountSettings /> : null}
          {activeTab === "pets" ? <PetSettings /> : null}
          {activeTab === "preferences" ? <PreferencesSettings /> : null}
        </div>
      </div>
    </main>
  );
}
