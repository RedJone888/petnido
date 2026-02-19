import { PetType } from "@prisma/client";
import { PetMeta } from "@/domain/pet/types";

const COMMON_PET: Partial<Record<PetType, PetMeta>> = {
  CAT: {
    headImg: "/petheads/cat.png",
    placeImg: "/placeholders/cat.png",
    label: {
      ja: {
        name: "猫",
        placeholder: "品種名（例：マンチカン、スコなど）",
        keywords: ["猫", "ねこ", "ニャン", "にゃん"],
      },
      en: {
        name: "",
        placeholder: "",
        keywords: [],
      },
      zh: {
        name: "",
        placeholder: "",
        keywords: [],
      },
    },
  },
  DOG: {
    headImg: "/petheads/dog.png",
    placeImg: "/placeholders/dog.png",
    label: {
      ja: {
        name: "犬",
        placeholder: "品種名（例：トイプードル、柴犬など）",
        keywords: ["犬", "いぬ", "ワン", "わん", "ワンちゃん"],
      },
      en: {
        name: "",
        placeholder: "",
        keywords: [],
      },
      zh: {
        name: "",
        placeholder: "",
        keywords: [],
      },
    },
  },
  RABBIT: {
    headImg: "/petheads/rabbit.png",
    placeImg: "/placeholders/rabbit.png",
    label: {
      ja: {
        name: "うさぎ",
        placeholder: "品種名（例：ホーランドロップなど）",
        keywords: ["うさぎ", "兎", "ウサギ"],
      },
      en: {
        name: "",
        placeholder: "",
        keywords: [],
      },
      zh: {
        name: "",
        placeholder: "",
        keywords: [],
      },
    },
  },
};
const NOT_COMMON_PET: Partial<Record<PetType, PetMeta>> = {
  BIRD: {
    headImg: "/petheads/bird.png",
    placeImg: "/placeholders/bird.png",
    label: {
      ja: {
        name: "鳥",
        placeholder: "",
        keywords: ["鳥", "とり", "インコ", "オウム"],
      },
      en: {
        name: "",
        placeholder: "",
        keywords: [],
      },
      zh: {
        name: "",
        placeholder: "",
        keywords: [],
      },
    },
  },
  CHINCHILLA: {
    headImg: "/petheads/chinchilla.png",
    placeImg: "/placeholders/chinchilla.png",
    label: {
      ja: {
        name: "チンチラ",
        placeholder: "",
        keywords: ["チンチラ"],
      },
      en: {
        name: "",
        placeholder: "",
        keywords: [],
      },
      zh: {
        name: "",
        placeholder: "",
        keywords: [],
      },
    },
  },
  GUINEA_PIG: {
    headImg: "/petheads/marmot.png",
    placeImg: "/placeholders/marmot.png",
    label: {
      ja: {
        name: "モルモット",
        placeholder: "",
        keywords: ["モルモット"],
      },
      en: {
        name: "",
        placeholder: "",
        keywords: [],
      },
      zh: {
        name: "",
        placeholder: "",
        keywords: [],
      },
    },
  },
  HAMSTER: {
    headImg: "/petheads/hamster.png",
    placeImg: "/placeholders/hamster.png",
    label: {
      ja: {
        name: "ハムスター",
        placeholder: "",
        keywords: ["ハムスター"],
      },
      en: {
        name: "",
        placeholder: "",
        keywords: [],
      },
      zh: {
        name: "",
        placeholder: "",
        keywords: [],
      },
    },
  },
};
export const PET_META: Record<PetType, PetMeta> = {
  ...COMMON_PET,
  ...NOT_COMMON_PET,
  OTHER: {
    headImg: "/petheads/other.png",
    placeImg: "/placeholders/other.png",
    label: {
      ja: {
        name: "その他",
        placeholder: "種類（例：カメ、ハムスターなど）",
        keywords: ["ハムスター"],
      },
      en: {
        name: "",
        placeholder: "",
        keywords: [],
      },
      zh: {
        name: "",
        placeholder: "",
        keywords: [],
      },
    },
  },
} as Record<PetType, PetMeta>;

export const COMMON_PET_TYPES = Object.keys(COMMON_PET) as PetType[];
export const NOT_COMMON_PET_TYPES = Object.keys(NOT_COMMON_PET) as PetType[];
