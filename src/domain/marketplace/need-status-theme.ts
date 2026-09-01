export type NeedStatusBadgeTheme = {
  container: string;
  dot: string;
};

export const defaultNeedStatusTheme: NeedStatusBadgeTheme = {
  container:
    "bg-white/95 text-slate-700 border border-slate-300/90 shadow-2xs backdrop-blur-md",
  dot: "bg-slate-400 ring-2 ring-slate-200",
};

/**
 * Standard status badge themes for published needs across dashboard and marketplace:
 * - OPEN: Emerald (招募中 / 募集中 / Open)
 * - MATCHED: Purple (已找到服务者 / シッター決定 / Provider found)
 * - EXPIRED: Amber (已过期 / 期限切れ / Expired)
 * - CLOSED: Slate (已关闭 / 終了 / Closed)
 */
export const needStatusThemes: Record<string, NeedStatusBadgeTheme> = {
  OPEN: {
    container:
      "bg-white/95 text-emerald-800 border border-emerald-300/90 shadow-2xs backdrop-blur-md",
    dot: "bg-emerald-500 ring-2 ring-emerald-200",
  },
  MATCHED: {
    container:
      "bg-white/95 text-purple-900 border border-purple-300/90 shadow-2xs backdrop-blur-md",
    dot: "bg-purple-500 ring-2 ring-purple-200",
  },
  EXPIRED: {
    container:
      "bg-white/95 text-amber-900 border border-amber-300/90 shadow-2xs backdrop-blur-md",
    dot: "bg-amber-500 ring-2 ring-amber-200",
  },
  CLOSED: {
    container:
      "bg-white/95 text-slate-700 border border-slate-300/90 shadow-2xs backdrop-blur-md",
    dot: "bg-slate-400 ring-2 ring-slate-200",
  },
};

export function getNeedStatusBadgeTheme(status: string | null | undefined): NeedStatusBadgeTheme {
  const norm = (status || "").trim().toUpperCase();
  return needStatusThemes[norm] ?? defaultNeedStatusTheme;
}
