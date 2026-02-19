import { Currency } from "@prisma/client";
import { Lang } from "@/domain/lang/types";

export type AddressLevel =
  | "country"
  | "admin1"
  | "city"
  | "district"
  | "neighbourhood"
  | "residential";
// export type LevelMap = {
//   [addressField: string]: AddressLevel;
// };
export type LevelMap = Record<string, AddressLevel>;
export type LocationSource = "search" | "database" | "reverse" | "map" | null;

export type LabelObj = {
  long: string;
  short: string;
};
export type CurrencyMeta = {
  currency: Currency;
  countryCode: string;
  symbol: string;
  label: Record<Lang, LabelObj>;
};
