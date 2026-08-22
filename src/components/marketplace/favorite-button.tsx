"use client";

import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";

import { pendingActionStartHref } from "@/components/marketplace/pending-action-link";
import { trpc } from "@/utils/trpc";
import { useLanguage } from "@/components/providers/language-provider";

export function FavoriteButton({
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
  const session = useSession();
  const utils = trpc.useContext();
  const input = { kind, publicId } as const;
  const state = trpc.favorite.state.useQuery(input, {
    enabled: session.status === "authenticated",
    staleTime: 30_000,
  });
  const mutation = trpc.favorite.set.useMutation({
    onSuccess: async (result) => {
      utils.favorite.state.setData(input, result);
      await utils.favorite.listMine.invalidate();
    },
  });

  const sharedClassName = "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-purple-200 px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-purple-50";
  if (session.status === "unauthenticated") {
    return (
      <a
        href={pendingActionStartHref({
          action: kind === "NEED" ? "FAVORITE_NEED" : "FAVORITE_SERVICE",
          targetId: publicId,
          returnTo,
        })}
        className={sharedClassName}
      >
        <Heart size={17} /> {kind === "NEED" ? copy.favoriteNeedTitle : copy.favoriteServiceTitle}
      </a>
    );
  }

  const isFavorite = state.data?.favorite ?? false;
  return (
    <div>
      <button
        type="button"
        disabled={session.status === "loading" || state.isLoading || mutation.isLoading}
        onClick={() => mutation.mutate({ target: input, favorite: !isFavorite })}
        aria-pressed={isFavorite}
        className={`${sharedClassName} disabled:cursor-wait disabled:opacity-60`}
      >
        <Heart size={17} fill={isFavorite ? "currentColor" : "none"} />
        {mutation.isLoading ? copy.favoriteSaving : isFavorite ? copy.favoriteSaved : kind === "NEED" ? copy.favoriteNeedTitle : copy.favoriteServiceTitle}
      </button>
      {mutation.error ? <p className="mt-2 text-xs leading-5 text-danger-text" role="alert">{copy.favoriteError}</p> : null}
    </div>
  );
}
