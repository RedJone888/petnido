import { Bell, MapPin, PawPrint, Settings2, UserRound } from "lucide-react";

import { AccountSettings } from "./_components/account-settings";
import { LocationSettings } from "./_components/location-settings";
import { NotificationSettings } from "./_components/notification-settings";
import { PetSettings } from "./_components/pet-settings";
import { ProviderSettings } from "./_components/provider-settings";

const sections = [
  { href: "#account", label: "個人プロフィール", icon: UserRound },
  { href: "#pets", label: "ペットプロフィール", icon: PawPrint },
  { href: "#locations", label: "保存した場所", icon: MapPin },
  { href: "#provider", label: "サービス設定", icon: Settings2 },
  { href: "#notifications", label: "通知設定", icon: Bell },
];

export default function SettingsPage() {
  return (
    <div className="h-full overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6 pb-16">
        <header>
          <p className="text-sm font-bold text-primary">ACCOUNT & PROFILES</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">設定</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            個人情報、ペット、地図上の場所、サービスプロフィールと通知方法を管理します。
          </p>
        </header>

        <nav aria-label="設定セクション" className="flex gap-2 overflow-x-auto pb-1">
          {sections.map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-primary/40 hover:text-primary"
            >
              <Icon className="h-4 w-4" />
              {label}
            </a>
          ))}
        </nav>

        <AccountSettings />
        <PetSettings />
        <LocationSettings />
        <ProviderSettings />
        <NotificationSettings />
      </div>
    </div>
  );
}
