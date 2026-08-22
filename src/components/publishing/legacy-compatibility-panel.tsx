"use client";

import type { CompatibilityIssueCode } from "@/domain/publishing/legacy-record-compatibility";
import { trpc } from "@/utils/trpc";
import { useLanguage } from "@/components/providers/language-provider";

export function LegacyCompatibilityPanel({ kind }: { kind: "NEED" | "SERVICE" }) {
  const { t } = useLanguage();
  const compatibility = trpc.publishingCompatibility.listMine.useQuery();
  const items = kind === "NEED" ? compatibility.data?.needs : compatibility.data?.services;
  if (compatibility.isLoading || !items?.length) return null;
  const label = kind === "NEED" ? t.core.management.reviewNeeds : t.core.management.reviewServices;
  return (
    <details className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <summary className="cursor-pointer text-sm font-black text-amber-950">
        {items.length} {label}
      </summary>
      <p className="mt-3 text-xs leading-5 text-amber-900">
        {t.core.management.compatibilityIntro}
      </p>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <article key={item.sourceId} className="rounded-xl border border-amber-200 bg-white p-3">
            <p className="text-xs font-black text-slate-900">{t.core.modes[item.mode]} · {t.core.management.record} {item.sourceId}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-600">
              {item.issues.map((issue) => (
                <li key={issue}>{t.core.management.issues[issue as CompatibilityIssueCode]}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </details>
  );
}
