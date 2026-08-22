/**
 * Font tokens deliberately use the platform font stack.
 *
 * The previous implementation imported next/font/google at build time, which
 * made production builds depend on an external font download. Keeping the
 * same token names lets existing layouts continue to work while using a
 * deterministic local stack for Latin and CJK text.
 */
type LocalFont = {
  className: string;
  variable: string;
};

export const inter: LocalFont = {
  className: "font-local-inter",
  variable: "--font-inter",
};

export const kosugiMaru: LocalFont = {
  className: "font-local-kosugi",
  variable: "--font-kosugi",
};

export const kiwiMaru: LocalFont = {
  className: "font-local-kiwi",
  variable: "--font-kiwi",
};

export const plusJakarta: LocalFont = {
  className: "font-local-plus-jakarta",
  variable: "--font-plus-jakarta",
};
