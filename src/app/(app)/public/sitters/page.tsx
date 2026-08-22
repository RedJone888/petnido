import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { messages } from "@/i18n/messages";
import type { Lang } from "@/domain/lang/types";
import { publicMarketplaceV2Enabled } from "@/server/feature-flags/publishing-v2";

/**
 * Compatibility route for links saved before the V2 public marketplace was
 * introduced. The old page rendered fixture sitters and offered no real
 * booking path, so all traffic now uses the public provider marketplace.
 */
export default function SittersBrowsePage() {
  if (publicMarketplaceV2Enabled()) redirect("/providers");
  const cookieLang = cookies().get("petnido_lang")?.value;
  const lang: Lang = cookieLang === "zh" || cookieLang === "ja" ? cookieLang : "en";
  const copy = messages[lang].core.marketplace;
  return (
    <main className="min-h-screen bg-[#f8f6f9] px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">{copy.serviceTitle}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{copy.servicesError}</p>
      </div>
    </main>
  );
}
