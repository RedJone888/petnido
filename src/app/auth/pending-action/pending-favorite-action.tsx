"use client";

import Link from "next/link";
import { useState } from "react";

import { trpc } from "@/utils/trpc";
import { useLanguage } from "@/components/providers/language-provider";

export function PendingFavoriteAction({
  kind,
  publicId,
  returnTo,
}: {
  kind: "NEED" | "SERVICE";
  publicId: string;
  returnTo: string;
}) {
  const { t } = useLanguage();
  const copy = t.core.pendingAction;
  const [completed, setCompleted] = useState(false);
  const utils = trpc.useContext();
  const favorite = trpc.favorite.set.useMutation({
    onSuccess: async () => {
      setCompleted(true);
      await Promise.all([
        utils.favorite.state.invalidate({ kind, publicId }),
        utils.favorite.listMine.invalidate(),
      ]);
    },
  });

  if (completed) {
    return (
      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900" role="status">
        {copy.favoriteSaved}
      </div>
    );
  }

  return (
    <>
      <p className="mt-4 text-sm leading-6 text-slate-600">
        {copy.favoritePrompt}
      </p>
      {favorite.error ? (
        <p className="mt-4 rounded-xl bg-danger-bg p-3 text-sm text-danger-text" role="alert">
          {copy.favoriteError}
        </p>
      ) : null}
      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href={returnTo} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700">
          {copy.back}
        </Link>
        <button
          type="button"
          disabled={favorite.isLoading}
          onClick={() => favorite.mutate({ target: { kind, publicId }, favorite: true })}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60"
        >
          {favorite.isLoading ? copy.favoriteSaving : copy.favoriteSave}
        </button>
      </div>
    </>
  );
}
