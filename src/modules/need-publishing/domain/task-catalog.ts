import type { Lang } from "@/domain/lang/types";
import { getNeedPublishingMessages } from "@/modules/need-publishing/i18n/messages";

/**
 * Stable task template identifiers used by the publishing domain.
 *
 * The value shown to a user is deliberately not part of this list's identity:
 * labels are translated at the edge, while these codes are safe to persist in
 * drafts, publish payloads and NeedTaskV2 rows.
 */
export const STANDARD_TASK_CODES = [
  "feeding",
  "water",
  "cleaning",
  "play",
  "walk",
  "medication",
  "safety",
  "boarding-feeding",
  "boarding-water",
  "boarding-cleaning",
  "boarding-walks",
  "boarding-medication",
  "boarding-play",
  "boarding-grooming",
  "boarding-nails",
  "boarding-updates",
  "transport",
  "vet",
  "enclosure",
  "pickup",
  "supervision",
] as const;

export type StandardTaskCode = (typeof STANDARD_TASK_CODES)[number];

type CatalogEntry = {
  code: StandardTaskCode;
  /** Translation key in needPublishing.taskLabels. */
  labelKey:
    | "feeding"
    | "water"
    | "cleaning"
    | "play"
    | "walk"
    | "medication"
    | "safety"
    | "grooming"
    | "nails"
    | "updates"
    | "transport"
    | "vet"
    | "enclosure"
    | "pickup"
    | "supervision";
  aliases?: readonly string[];
};

/**
 * Keep this catalog independent of the large message objects.  The message
 * files remain the source of UI copy; labelKey lets this domain helper select
 * the current language without persisting any of that copy.
 */
const catalog: readonly CatalogEntry[] = [
  { code: "feeding", labelKey: "feeding", aliases: ["feed", "food"] },
  { code: "water", labelKey: "water", aliases: ["fresh water", "change water", "refresh water"] },
  { code: "cleaning", labelKey: "cleaning", aliases: ["clean", "cleaning"] },
  { code: "play", labelKey: "play", aliases: ["play", "companionship"] },
  { code: "walk", labelKey: "walk", aliases: ["walking", "walk outside"] },
  { code: "medication", labelKey: "medication", aliases: ["medicine", "meds"] },
  { code: "safety", labelKey: "safety", aliases: ["safety check"] },
  {
    code: "boarding-feeding",
    labelKey: "feeding",
    aliases: ["boarding feeding", "boarding-feed"],
  },
  {
    code: "boarding-water",
    labelKey: "water",
    aliases: ["boarding water", "boarding fresh water"],
  },
  {
    code: "boarding-cleaning",
    labelKey: "cleaning",
    aliases: ["boarding cleaning"],
  },
  {
    code: "boarding-walks",
    labelKey: "walk",
    aliases: ["boarding walk", "boarding walks"],
  },
  {
    code: "boarding-medication",
    labelKey: "medication",
    aliases: ["boarding medication"],
  },
  { code: "boarding-play", labelKey: "play", aliases: ["boarding play"] },
  {
    code: "boarding-grooming",
    labelKey: "grooming",
    aliases: ["boarding grooming"],
  },
  {
    code: "boarding-nails",
    labelKey: "nails",
    aliases: ["boarding nails", "boarding nail care"],
  },
  {
    code: "boarding-updates",
    labelKey: "updates",
    aliases: ["boarding updates", "boarding photo updates"],
  },
  { code: "transport", labelKey: "transport", aliases: ["pet transport", "transportation"] },
  { code: "vet", labelKey: "vet", aliases: ["vet visit", "veterinary"] },
  { code: "enclosure", labelKey: "enclosure", aliases: ["enclosure cleaning"] },
  { code: "pickup", labelKey: "pickup", aliases: ["pick up", "supply pickup"] },
  {
    code: "supervision",
    labelKey: "supervision",
    aliases: ["temporary supervision", "supervise"],
  },
];

const catalogByCode = new Map(catalog.map((entry) => [entry.code, entry]));

// These are the labels that have already been emitted by the three supported
// locales. Keep aliases here, rather than asking callers to translate first,
// so old rows can be read safely even when the current locale differs.
const historicalLabels: Record<Lang, Record<string, StandardTaskCode>> = {
  en: {
    Feeding: "feeding",
    "Refresh water": "water",
    "Clean litter or enclosure": "cleaning",
    "Play and companionship": "play",
    "Walk outside": "walk",
    Medication: "medication",
    "Safety check": "safety",
    "Grooming or bathing": "boarding-grooming",
    "Nail care": "boarding-nails",
    "Photo updates": "boarding-updates",
    "Pet transport": "transport",
    "Vet visit support": "vet",
    "Enclosure cleaning": "enclosure",
    "Food or supply pickup": "pickup",
    "Temporary supervision": "supervision",
  },
  zh: {
    "喂食": "feeding",
    "更换饮水": "water",
    "清洁猫砂或笼舍": "cleaning",
    "陪玩和陪伴": "play",
    "外出遛弯": "walk",
    "喂药": "medication",
    "安全检查": "safety",
    "美容或洗澡": "boarding-grooming",
    "修剪指甲": "boarding-nails",
    "发送照片更新": "boarding-updates",
    "宠物接送": "transport",
    "陪同就医": "vet",
    "清洁笼舍": "enclosure",
    "购买食物或用品": "pickup",
    "临时照看": "supervision",
  },
  ja: {
    "給餌": "feeding",
    "水の交換": "water",
    "トイレ・ケージの掃除": "cleaning",
    "遊び・ふれあい": "play",
    "散歩": "walk",
    "投薬": "medication",
    "安全確認": "safety",
    "グルーミング・入浴": "boarding-grooming",
    "爪のケア": "boarding-nails",
    "写真の共有": "boarding-updates",
    "ペットの送迎": "transport",
    "通院サポート": "vet",
    "ケージの掃除": "enclosure",
    "フード・用品の購入": "pickup",
    "一時的な見守り": "supervision",
  },
};

function compact(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/gu, " ")
    .toLocaleLowerCase("en-US");
}

function codeCandidate(value: string | null | undefined) {
  const normalized = compact(value);
  if (!normalized) return "";
  return normalized
    .replace(/[\s_]+/gu, "-")
    .replace(/[^a-z0-9-]/gu, "")
    .replace(/-+/gu, "-");
}

function exactHistoricalLabel(value: string | null | undefined) {
  const normalized = compact(value);
  if (!normalized) return null;
  for (const labels of Object.values(historicalLabels)) {
    const match = Object.entries(labels).find(
      ([label]) => compact(label) === normalized,
    );
    if (match) return match[1];
  }
  return null;
}

function isKnownCatalogLabel(value: string | null | undefined) {
  const normalized = compact(value);
  if (!normalized) return true;
  if (exactHistoricalLabel(value)) return true;
  return catalog.some((entry) =>
    [entry.code, entry.labelKey, ...(entry.aliases ?? [])].some(
      (candidate) => compact(candidate) === normalized,
    ),
  );
}

/** True only for codes known to this product, never for arbitrary user text. */
export function isStandardTaskCode(
  value: string | null | undefined,
): value is StandardTaskCode {
  return Boolean(value && catalogByCode.has(value as StandardTaskCode));
}

/**
 * Resolve a template/category or a historical display label to one stable
 * code. `custom: true` is an explicit guard: a user may legitimately name a
 * custom task "Feeding", and that text must never be rewritten as a template.
 */
export function resolveStandardTaskCode({
  templateId,
  category,
  label,
  custom = false,
}: {
  templateId?: string | null;
  category?: string | null;
  label?: string | null;
  custom?: boolean;
}): StandardTaskCode | null {
  if (custom) return null;

  for (const candidate of [templateId, category]) {
    const code = codeCandidate(candidate);
    if (isStandardTaskCode(code) && isKnownCatalogLabel(label)) return code;
    // Older boarding rows sometimes omitted the `boarding-` prefix when the
    // label/category was already unambiguous.
    if (
      code &&
      isStandardTaskCode(`boarding-${code}`) &&
      isKnownCatalogLabel(label)
    ) {
      return `boarding-${code}` as StandardTaskCode;
    }
  }

  const historical = exactHistoricalLabel(label);
  if (historical) return historical;

  const normalizedLabel = compact(label);
  if (normalizedLabel) {
    const direct = catalog.find((entry) => {
      const labels = [entry.code, entry.labelKey, ...(entry.aliases ?? [])];
      return labels.some((candidate) => compact(candidate) === normalizedLabel);
    });
    if (direct) return direct.code;
  }
  return null;
}

/** Normalize user-entered text without applying the standard catalog. */
export function normalizeCustomTaskLabel(value: string | null | undefined) {
  return (value ?? "").normalize("NFKC").trim().replace(/\s+/gu, " ");
}

/** The value that belongs in a draft/publish payload/NeedTaskV2 row. */
export function taskPersistenceLabel({
  code,
  label,
  custom = false,
}: {
  code?: string | null;
  label?: string | null;
  custom?: boolean;
}) {
  if (custom) return normalizeCustomTaskLabel(label);
  return (
    resolveStandardTaskCode({ templateId: code, label, custom: false }) ??
    (codeCandidate(code) || normalizeCustomTaskLabel(label))
  );
}

/**
 * Resolve any task row as either a standard code or untouched custom text.
 * This is useful at database/read boundaries where category and label are both
 * available but the row may predate the canonical-code rollout.
 */
export function normalizeTaskIdentity({
  templateId,
  category,
  label,
  custom = false,
}: {
  templateId?: string | null;
  category?: string | null;
  label?: string | null;
  custom?: boolean;
}) {
  const code = resolveStandardTaskCode({
    templateId,
    category,
    label,
    custom,
  });
  if (code) return { custom: false as const, code, label: code };
  return {
    custom: true as const,
    code: null,
    label: normalizeCustomTaskLabel(label),
  };
}

/**
 * Localize a standard code. If the value is an old localized label, it is
 * first normalized to a code. Custom text is returned as entered.
 */
export function localizeTaskLabel(
  value: string | null | undefined,
  lang: Lang,
  options: { templateId?: string | null; category?: string | null; custom?: boolean } = {},
) {
  const explicitCode = options.custom
    ? null
    : resolveStandardTaskCode({
        templateId: options.templateId,
        category: options.category,
        custom: false,
      });
  const translatedTaskLabels = getNeedPublishingMessages(lang).needPublishing.taskLabels;
  if (explicitCode) {
    const entry = catalogByCode.get(explicitCode);
    if (entry) return translatedTaskLabels[entry.labelKey] ?? entry.code;
  }
  const identity = normalizeTaskIdentity({
    templateId: options.templateId,
    category: options.category,
    label: value,
    custom: options.custom,
  });
  if (identity.custom) return identity.label;

  const entry = catalogByCode.get(identity.code);
  if (!entry) return identity.label;
  // This import-free lookup keeps the domain module usable from server and
  // browser code. The actual translated strings are supplied by the caller
  // when available; these labels are the canonical fallback for snapshots.
  return translatedTaskLabels[entry.labelKey] ?? entry.code;
}

export const taskCatalog = catalog;
