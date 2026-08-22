import type { Lang } from "@/domain/lang/types";

export const knowledgePetTypes = ["ALL", "DOG", "CAT", "RABBIT", "GUINEA_PIG", "BIRD"] as const;
export const knowledgeTopics = ["BASIC_CARE", "NUTRITION", "ENVIRONMENT", "GROOMING", "HEALTH", "EMERGENCY"] as const;

export type KnowledgePetType = (typeof knowledgePetTypes)[number];
export type KnowledgeTopic = (typeof knowledgeTopics)[number];
type LocalizedText = Record<Lang, string>;

export type CareKnowledgeResource = {
  id: string;
  petTypes: readonly KnowledgePetType[];
  topics: readonly KnowledgeTopic[];
  title: LocalizedText;
  summary: LocalizedText;
  sourceName: string;
  sourceUrl: string;
  sourceCheckedOn: string;
};

export const careKnowledgeResources: readonly CareKnowledgeResource[] = [
  {
    id: "aspca-dog-care",
    petTypes: ["DOG"], topics: ["BASIC_CARE", "NUTRITION", "GROOMING", "HEALTH"],
    title: { en: "Dog care reference library", zh: "犬类照护参考资料", ja: "犬のお世話資料" },
    summary: { en: "An overview hub for everyday care, grooming, nutrition, behaviour and common health topics.", zh: "汇总日常照护、美容、饮食、行为与常见健康主题的入口。", ja: "日常ケア、グルーミング、食事、行動、健康情報をまとめた入口です。" },
    sourceName: "ASPCA", sourceUrl: "https://www.aspca.org/pet-care/dog-care", sourceCheckedOn: "2026-08-04",
  },
  {
    id: "aspca-cat-care",
    petTypes: ["CAT"], topics: ["BASIC_CARE", "NUTRITION", "ENVIRONMENT", "GROOMING", "HEALTH"],
    title: { en: "General cat care", zh: "猫咪日常照护", ja: "猫の基本的なお世話" },
    summary: { en: "Practical topics for feeding, water, grooming, handling, litter boxes, housing and routine veterinary care.", zh: "涵盖喂食饮水、梳理、抱持、猫砂盆、居住环境与常规兽医照护。", ja: "食事と水、グルーミング、抱き方、トイレ、住環境、定期受診を扱います。" },
    sourceName: "ASPCA", sourceUrl: "https://www.aspca.org/pet-care/cat-care/general-cat-care", sourceCheckedOn: "2026-08-04",
  },
  {
    id: "rspca-rabbit-care",
    petTypes: ["RABBIT"], topics: ["BASIC_CARE", "NUTRITION", "ENVIRONMENT", "HEALTH"],
    title: { en: "Rabbit care guide", zh: "兔子照护指南", ja: "うさぎのお世話ガイド" },
    summary: { en: "A starting point for rabbit health, housing, diet, enrichment and companionship.", zh: "兔子健康、居住环境、饮食、丰富化活动和同伴需求的资料入口。", ja: "健康、住環境、食事、エンリッチメント、仲間との生活を確認できます。" },
    sourceName: "RSPCA", sourceUrl: "https://www.rspca.org.uk/adviceandwelfare/pets/rabbits", sourceCheckedOn: "2026-08-04",
  },
  {
    id: "rspca-rabbit-home",
    petTypes: ["RABBIT"], topics: ["ENVIRONMENT", "HEALTH"],
    title: { en: "A safe home for rabbits", zh: "为兔子准备安全的家庭环境", ja: "うさぎが安全に暮らせる家" },
    summary: { en: "Points to review when making indoor space safe, calm and suitable for normal rabbit behaviour.", zh: "检查室内空间是否安全、安静，并能让兔子表达正常行为。", ja: "室内を安全で落ち着きがあり、自然な行動ができる環境にするための確認事項です。" },
    sourceName: "RSPCA", sourceUrl: "https://www.rspca.org.uk/adviceandwelfare/pets/rabbits/indoors", sourceCheckedOn: "2026-08-04",
  },
  {
    id: "rspca-guinea-pig-care",
    petTypes: ["GUINEA_PIG"], topics: ["BASIC_CARE", "NUTRITION", "ENVIRONMENT", "HEALTH"],
    title: { en: "Understanding guinea pig needs", zh: "了解荷兰猪的照护需要", ja: "モルモットに必要なお世話" },
    summary: { en: "A species-specific overview of environment, diet, behaviour, companionship and welfare.", zh: "从环境、饮食、行为、同伴和福利角度介绍荷兰猪的物种特定需求。", ja: "環境、食事、行動、仲間、福祉の観点からモルモット特有のニーズを紹介します。" },
    sourceName: "RSPCA", sourceUrl: "https://www.rspca.org.uk/adviceandwelfare/pets/rodents/guineapigs", sourceCheckedOn: "2026-08-04",
  },
  {
    id: "rspca-guinea-pig-environment",
    petTypes: ["GUINEA_PIG"], topics: ["ENVIRONMENT", "HEALTH"],
    title: { en: "Creating a good guinea pig home", zh: "布置合适的荷兰猪居住环境", ja: "モルモットに適した住環境" },
    summary: { en: "Housing considerations including shelter, bedding, temperature, cleaning and protection from hazards.", zh: "包括躲藏处、垫材、温度、清洁和远离危险因素等环境注意事项。", ja: "隠れ場所、床材、温度、清掃、危険からの保護など住まいの注意点です。" },
    sourceName: "RSPCA", sourceUrl: "https://www.rspca.org.uk/adviceandwelfare/pets/rodents/guineapigs/environment", sourceCheckedOn: "2026-08-04",
  },
  {
    id: "rspca-bird-care",
    petTypes: ["BIRD"], topics: ["BASIC_CARE", "NUTRITION", "ENVIRONMENT", "HEALTH"],
    title: { en: "Pet bird care topics", zh: "宠物鸟照护主题", ja: "コンパニオンバードのお世話" },
    summary: { en: "Species-aware guidance covering behaviour, company, diet, enrichment, environment, flight and training.", zh: "按鸟类特点介绍行为、同伴、饮食、丰富化活动、环境、飞行与训练。", ja: "鳥種に配慮し、行動、仲間、食事、環境、飛行、トレーニングを扱います。" },
    sourceName: "RSPCA", sourceUrl: "https://www.rspca.org.uk/adviceandwelfare/pets/birds", sourceCheckedOn: "2026-08-04",
  },
  {
    id: "aav-bird-basics",
    petTypes: ["BIRD"], topics: ["BASIC_CARE", "NUTRITION", "ENVIRONMENT", "HEALTH"],
    title: { en: "Basic care for companion birds", zh: "伴侣鸟基础照护", ja: "コンパニオンバードの基本ケア" },
    summary: { en: "A veterinarian-produced PDF on diet, habitat, household safety, preventive care and signs that need attention.", zh: "由鸟类兽医机构制作的 PDF，涉及饮食、栖息环境、家庭安全、预防性照护和异常信号。", ja: "鳥類獣医師の団体による、食事、住環境、家庭内安全、予防ケア、注意すべき兆候のPDFです。" },
    sourceName: "Association of Avian Veterinarians", sourceUrl: "https://www.aav.org/resource/resmgr/pdf_2019/AAV_Basic-Care-for-Companion.pdf", sourceCheckedOn: "2026-08-04",
  },
  {
    id: "avma-pet-first-aid",
    petTypes: ["ALL"], topics: ["EMERGENCY", "HEALTH"],
    title: { en: "Pet first-aid preparation", zh: "宠物急救准备", ja: "ペットの応急手当の備え" },
    summary: { en: "A veterinary checklist for emergency contacts, first-aid supplies and information to prepare before an incident.", zh: "由兽医机构提供的紧急联系人、急救物资和事前信息准备清单。", ja: "緊急連絡先、応急用品、事前に整理する情報についての獣医師団体のチェックリストです。" },
    sourceName: "American Veterinary Medical Association", sourceUrl: "https://ebusiness.avma.org/files/productdownloads/mcm-client-brochures-pet-first-aid-2023.pdf", sourceCheckedOn: "2026-08-04",
  },
] as const;

export function filterCareKnowledge({ petType, topic }: { petType: KnowledgePetType; topic: KnowledgeTopic | "ALL" }) {
  return careKnowledgeResources.filter((resource) =>
    (petType === "ALL" || resource.petTypes.includes(petType) || resource.petTypes.includes("ALL")) &&
    (topic === "ALL" || resource.topics.includes(topic)),
  );
}
