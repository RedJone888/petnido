"use client";

import { BookmarkX, Heart, LoaderCircle } from "lucide-react";
import Link from "next/link";

import { useLanguage } from "@/components/providers/language-provider";
import { trpc } from "@/utils/trpc";

export default function FavoritesPage() {
  const { t } = useLanguage();
  const copy = t.core.favorites;
  const favorites = trpc.favorite.listMine.useQuery();
  const utils = trpc.useContext();
  const remove = trpc.favorite.set.useMutation({
    onSuccess: () => utils.favorite.listMine.invalidate(),
  });

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="mx-auto max-w-4xl w-full h-full flex flex-col overflow-hidden">
        {/* Fixed Top Header */}
        <header className="shrink-0 pb-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-purple-100 text-primary">
              <Heart size={21} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-950">{copy.title}</h1>
              <p className="mt-1 text-sm text-slate-500">{copy.intro}</p>
            </div>
          </div>
        </header>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 pb-8">
          {favorites.isLoading ? (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-white p-10 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} />{copy.loading}</div>
          ) : favorites.error ? (
            <div className="mt-4 rounded-2xl border border-danger-border bg-danger-bg p-5 text-sm text-danger-text" role="alert">{copy.error}</div>
          ) : !favorites.data?.length ? (
            <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <BookmarkX className="mx-auto text-slate-300" size={34} />
              <h2 className="mt-4 font-black text-slate-800">{copy.emptyTitle}</h2>
              <p className="mt-2 text-sm text-slate-500">{copy.emptyDetail}</p>
              <div className="mt-6 flex justify-center gap-3"><Link href="/needs" className="rounded-xl border border-purple-200 px-4 py-2 text-sm font-bold text-primary">{copy.viewRequests}</Link><Link href="/services" className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white">{copy.viewServices}</Link></div>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {favorites.data.map((favorite) => {
              const item = favorite.item;
              const isAvailable = favorite.availability === "AVAILABLE";
              const href = favorite.kind === "NEED"
                ? `/needs/${encodeURIComponent(favorite.targetPublicId)}`
                : `/services/${encodeURIComponent(favorite.targetPublicId)}`;
              return (
                <article key={favorite.favoriteId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                        <span className="rounded-full bg-purple-50 px-2.5 py-1 text-primary">{favorite.kind === "NEED" ? copy.need : copy.service}</span>
                        <span className={favorite.availability === "AVAILABLE" ? "text-emerald-700" : favorite.availability === "EXPIRED" ? "text-amber-700" : "text-slate-500"}>{copy.availability[favorite.availability]}</span>
                      </div>
                      <h2 className="mt-3 truncate text-lg font-black text-slate-900">{item?.title || copy.unavailableItem}</h2>
                      {item ? <p className="mt-2 text-sm text-slate-500">{t.core.modes[item.mode as keyof typeof t.core.modes] ?? item.mode} · {item.location.regionLabel || copy.approximateLocation}</p> : <p className="mt-2 text-sm text-slate-500">{copy.deletedDetail}</p>}
                      {favorite.availability === "EXPIRED" ? <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">{copy.expiredDetail}</p> : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {isAvailable ? <Link href={href} className="inline-flex min-h-10 items-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white">{copy.viewDetails}</Link> : null}
                      <button
                        type="button"
                        disabled={remove.isLoading}
                        onClick={() => remove.mutate({ target: { kind: favorite.kind, publicId: favorite.targetPublicId }, favorite: false })}
                        className="inline-flex min-h-10 items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 disabled:opacity-50"
                      >
                        {copy.remove}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
