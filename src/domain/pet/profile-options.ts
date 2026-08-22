import type { Lang } from "@/domain/lang/types";

type PetSuggestionSet = {
  breeds: Record<string, string[]>;
  otherTypes: Array<{ key: string; label: string }>;
  otherBreeds: Record<string, string[]>;
};

const suggestions: Record<Lang, PetSuggestionSet> = {
  en: {
    breeds: {
      dog: ["Golden Retriever", "Labrador Retriever", "Poodle", "Shiba Inu"],
      cat: ["Domestic Shorthair", "British Shorthair", "Ragdoll", "Maine Coon"],
      rabbit: ["Holland Lop", "Netherland Dwarf", "Lionhead", "Mini Rex"],
      bird: ["Budgerigar", "Cockatiel", "African Grey", "Lovebird"],
    },
    otherTypes: [
      { key: "hamster", label: "Hamster" },
      { key: "guinea-pig", label: "Guinea pig" },
      { key: "ferret", label: "Ferret" },
      { key: "turtle", label: "Turtle" },
      { key: "chinchilla", label: "Chinchilla" },
    ],
    otherBreeds: {
      hamster: ["Syrian Hamster", "Dwarf Hamster", "Roborovski Hamster", "Chinese Hamster"],
      "guinea-pig": ["American", "Abyssinian", "Peruvian", "Teddy"],
      ferret: ["Standard", "Angora", "Sable", "Albino"],
      turtle: ["Red-eared Slider", "Box Turtle", "Painted Turtle", "Musk Turtle"],
      chinchilla: ["Standard Grey", "Beige", "Ebony", "Violet"],
    },
  },
  zh: {
    breeds: {
      dog: ["金毛寻回犬", "拉布拉多寻回犬", "贵宾犬", "柴犬"],
      cat: ["短毛家猫", "英国短毛猫", "布偶猫", "缅因猫"],
      rabbit: ["荷兰垂耳兔", "荷兰侏儒兔", "狮子兔", "迷你雷克斯兔"],
      bird: ["虎皮鹦鹉", "玄凤鹦鹉", "非洲灰鹦鹉", "牡丹鹦鹉"],
    },
    otherTypes: [
      { key: "hamster", label: "仓鼠" },
      { key: "guinea-pig", label: "荷兰猪" },
      { key: "ferret", label: "雪貂" },
      { key: "turtle", label: "乌龟" },
      { key: "chinchilla", label: "龙猫" },
    ],
    otherBreeds: {
      hamster: ["叙利亚仓鼠", "侏儒仓鼠", "罗伯罗夫斯基仓鼠", "中国仓鼠"],
      "guinea-pig": ["美国豚鼠", "阿比西尼亚豚鼠", "秘鲁豚鼠", "泰迪豚鼠"],
      ferret: ["标准雪貂", "安哥拉雪貂", "紫貂色", "白化色"],
      turtle: ["红耳龟", "箱龟", "锦龟", "麝香龟"],
      chinchilla: ["标准灰", "米色", "丝绒黑", "紫灰"],
    },
  },
  ja: {
    breeds: {
      dog: ["ゴールデン・レトリーバー", "ラブラドール・レトリーバー", "プードル", "柴犬"],
      cat: ["雑種短毛猫", "ブリティッシュショートヘア", "ラグドール", "メインクーン"],
      rabbit: ["ホーランドロップ", "ネザーランドドワーフ", "ライオンヘッド", "ミニレッキス"],
      bird: ["セキセイインコ", "オカメインコ", "ヨウム", "コザクラインコ"],
    },
    otherTypes: [
      { key: "hamster", label: "ハムスター" },
      { key: "guinea-pig", label: "モルモット" },
      { key: "ferret", label: "フェレット" },
      { key: "turtle", label: "カメ" },
      { key: "chinchilla", label: "チンチラ" },
    ],
    otherBreeds: {
      hamster: ["ゴールデンハムスター", "ドワーフハムスター", "ロボロフスキーハムスター", "チャイニーズハムスター"],
      "guinea-pig": ["アメリカン", "アビシニアン", "ペルビアン", "テディ"],
      ferret: ["スタンダード", "アンゴラ", "セーブル", "アルビノ"],
      turtle: ["ミシシッピアカミミガメ", "ハコガメ", "ニシキガメ", "ニオイガメ"],
      chinchilla: ["スタンダードグレー", "ベージュ", "エボニー", "バイオレット"],
    },
  },
};

const otherTypeAliases: Record<string, string> = {
  豚鼠: "guinea-pig",
  荷兰猪: "guinea-pig",
  龟: "turtle",
  乌龟: "turtle",
};

const supportedLanguages: Lang[] = ["en", "zh", "ja"];

const legacyOtherTypeKeys: Record<string, string> = {
  hamster: "hamster",
  guinea_pig: "guinea-pig",
  chinchilla: "chinchilla",
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function resolveOtherPetTypeKey(value: string) {
  const normalizedValue = normalize(value);
  if (!normalizedValue) return null;
  return (
    otherTypeAliases[normalizedValue] ??
    Object.values(suggestions)
      .flatMap((set) => set.otherTypes)
      .find(
        (item) =>
          item.key === normalizedValue || normalize(item.label) === normalizedValue,
      )?.key ??
    null
  );
}

export function localizeOtherPetType(value: string, lang: Lang) {
  const key = resolveOtherPetTypeKey(value);
  if (!key) return value;
  return (
    suggestions[lang].otherTypes.find((item) => item.key === key)?.label ?? value
  );
}

function resolveBreedGroup(type: string, customType: string) {
  const normalizedType = normalize(type);
  if (normalizedType === "other") return resolveOtherPetTypeKey(customType);
  return legacyOtherTypeKeys[normalizedType] ?? normalizedType;
}

function getBreedList(lang: Lang, group: string) {
  return suggestions[lang].breeds[group] ?? suggestions[lang].otherBreeds[group] ?? [];
}

export function localizePetBreed(
  value: string,
  lang: Lang,
  type: string,
  customType = "",
) {
  const normalizedValue = normalize(value);
  if (!normalizedValue) return value;
  const group = resolveBreedGroup(type, customType);
  if (!group) return value;

  for (const sourceLanguage of supportedLanguages) {
    const sourceList = getBreedList(sourceLanguage, group);
    const index = sourceList.findIndex(
      (breed) => normalize(breed) === normalizedValue,
    );
    if (index >= 0) return getBreedList(lang, group)[index] ?? value;
  }
  return value;
}

export function getOtherPetTypeSuggestions(lang: Lang) {
  return suggestions[lang].otherTypes.map((item) => item.label);
}

export function getOtherPetTypeOptions(lang: Lang) {
  return suggestions[lang].otherTypes;
}

export function getPetBreedSuggestions(
  lang: Lang,
  type: string,
  customType = "",
) {
  const normalizedType = type.toLowerCase();
  if (normalizedType !== "other") {
    return suggestions[lang].breeds[normalizedType] ?? [];
  }
  const canonicalType = resolveOtherPetTypeKey(customType);
  return canonicalType ? suggestions[lang].otherBreeds[canonicalType] ?? [] : [];
}
