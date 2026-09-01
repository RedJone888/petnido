import type { Lang } from "@/domain/lang/types";

const routeLanguagePattern = /^\/(en|zh|ja)(?=\/|$)/;
const reservedDetailSegments = new Set(["create", "edit", "new"]);

function isLocalizedPublicPathname(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const [section, detail] = segments;

  if (section === "knowledge") return segments.length === 1;
  if (section === "care-types") {
    return segments.length >= 1;
  }
  if (section === "needs" || section === "services" || section === "providers") {
    return (
      segments.length === 1 ||
      (segments.length === 2 && !reservedDetailSegments.has(detail))
    );
  }
  return false;
}

/**
 * Returns the localized equivalent only for routes that actually exist under
 * app/[lang]. Application flows such as /needs/create and /needs/edit stay on
 * their canonical, unprefixed URL and rely on LanguageProvider for UI copy.
 */
export function localizedPublicPathname(pathname: string, language: Lang) {
  const unprefixedPathname = pathname.replace(routeLanguagePattern, "");
  if (!isLocalizedPublicPathname(unprefixedPathname)) return null;
  return `/${language}${unprefixedPathname}`;
}

export function shouldHidePublicFooter(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  const needsIndex = segments.indexOf("needs");
  const isNeedDetail = needsIndex !== -1 && segments.length > needsIndex + 1;
  const isCareTypes = segments.includes("care-types");

  return isNeedDetail || isCareTypes;
}
