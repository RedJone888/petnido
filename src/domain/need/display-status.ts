export type NeedDisplayStatus = "ALL" | "OPEN" | "EXPIRED" | "MATCHED" | "CLOSED";

export const NEED_DISPLAY_CONFIG: Record<
  NeedDisplayStatus,
  { label: string; textColor: string }
> = {
  ALL: { label: "総計", textColor: "text-slate-700" },
  OPEN: { label: "募集中", textColor: "text-green-600" },
  EXPIRED: { label: "期限切れ", textColor: "text-orange-600" },
  MATCHED: { label: "成約済み", textColor: "text-secondary" },
  CLOSED: { label: "募集終了", textColor: "text-slate-500" },
};
