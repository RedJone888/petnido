import { Currency } from "@prisma/client";
import { CurrencyMeta, LevelMap } from "./types";
export const DEFAULT_LEVEL_MAP: LevelMap = {
  country: "country",
  state: "admin1",
  province: "admin1",
  region: "admin1",
  city: "city",
  town: "city",
  village: "city",
  municipality: "city",
  city_district: "district",
  suburb: "district",
  county: "district",
  neighbourhood: "neighbourhood",
  quarter: "neighbourhood",
  residential: "residential",
  hamlet: "residential",
  locality: "residential",
};
export const JP_LEVEL_MAP: LevelMap = {
  ...DEFAULT_LEVEL_MAP,
  province: "admin1",
  city_district: "district",
  suburb: "district",
  neighbourhood: "neighbourhood",
  residential: "residential",
};
export const MAP_THEMES = [
  {
    id: "jp-mierune-streets",
    label: "標準",
    description: "地名が見やすい地図",
  },
  {
    id: "streets-v2",
    label: "詳細",
    description: "道路や施設情報が豊富",
  },
  {
    id: "basic-v2",
    label: "シンプル",
    description: "必要最低限の情報のみ表示",
  },
  {
    id: "toner-v2",
    label: "モノクロ",
    description: "白黒で見やすい地図",
  },
  {
    id: "satellite",
    label: "航空写真",
    description: "実際の地形を写真で表示",
  },
];
export const DEFAULT_STYLE = "jp-mierune-streets";

export const CURRENCY_META: Record<Currency, CurrencyMeta> = {
  JPY: {
    currency: "JPY",
    countryCode: "JP",
    symbol: "￥",
    label: {
      ja: {
        long: "日本円",
        short: "円",
      },
      en: {
        long: "Japanese Yen",
        short: "Yen",
      },
      zh: {
        long: "日元",
        short: "日元",
      },
    },
  },
  USD: {
    currency: "USD",
    countryCode: "US",
    symbol: "$",
    label: {
      ja: {
        long: "米ドル",
        short: "米ドル",
      },
      en: {
        long: "US Dollar",
        short: "Dollar",
      },
      zh: {
        long: "美元",
        short: "美元",
      },
    },
  },
  EUR: {
    currency: "EUR",
    countryCode: "EU",
    symbol: "€",
    label: {
      ja: {
        long: "ユーロ",
        short: "ユーロ",
      },
      en: {
        long: "Euro",
        short: "Euro",
      },
      zh: {
        long: "欧元",
        short: "欧元",
      },
    },
  },
  CNY: {
    currency: "CNY",
    countryCode: "CN",
    symbol: "¥",
    label: {
      ja: {
        long: "人民元",
        short: "元",
      },
      en: {
        long: "Chinese Yuan",
        short: "Yuan",
      },
      zh: {
        long: "人民币",
        short: "元",
      },
    },
  },
  TWD: {
    currency: "TWD",
    countryCode: "TW",
    symbol: "NT$",
    label: {
      ja: {
        long: "台湾ドル",
        short: "台湾ドル",
      },
      en: {
        long: "New Taiwan Dollar",
        short: "New Taiwan Dollar",
      },
      zh: {
        long: "新台币",
        short: "新台币",
      },
    },
  },
  KRW: {
    currency: "KRW",
    countryCode: "KR",
    symbol: "₩",
    label: {
      ja: {
        long: "韓国ウォン",
        short: "ウォン",
      },
      en: {
        long: "Korean Won",
        short: "Won",
      },
      zh: {
        long: "韩元",
        short: "韩元",
      },
    },
  },
  GBP: {
    currency: "GBP",
    countryCode: "GB",
    symbol: "£",
    label: {
      ja: {
        long: "英ポンド",
        short: "ポンド",
      },
      en: {
        long: "British Pound",
        short: "Pound",
      },
      zh: {
        long: "英镑",
        short: "英镑",
      },
    },
  },
};
export const COUNTRY_TO_CURRENCY: Record<string, Currency> = Object.values(
  CURRENCY_META
).reduce((acc, meta) => {
  acc[meta.countryCode] = meta.currency;
  return acc;
}, {} as Record<string, Currency>);
