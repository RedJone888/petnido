import type { Lang } from "@/domain/lang/types";
import type { RouterOutputs } from "@/server/trpc";

type NeedDetailDTO = RouterOutputs["marketplaceNeed"]["get"];

type ExampleCopy = {
  description: string;
  scheduleNotes: string;
  location: string;
  petNotes: string[];
  tasks: Array<{ label: string; instructions: string; priority: "MUST" | "NICE" }>;
};

const copy: Record<Lang, ExampleCopy> = {
  en: {
    description:
      "I need eight evening home visits for two rabbits while I am away. Key handover via smart lockbox by the door. Shoe covers and hand sanitizer are in the entryway; Timothy hay and pellets are on the 2nd shelf of the cabinet; please dispose of litter waste in the hallway bin upon departure. Please keep their usual routine, check room conditions carefully, and send a visit update.",
    scheduleNotes: "Any time between 18:00 and 20:00 works. Please allow about 60 minutes per visit.",
    location: "Setagaya, Tokyo",
    petNotes: [
      "Gentle and friendly, loves gentle head pets.",
      "Curious and quick; double-check the pen latch before leaving.",
    ],
    tasks: [
      {
        label: "Check room temperature, humidity & health condition",
        instructions: "Check room thermometer, water level, and droppings. Report anything unusual immediately.",
        priority: "MUST",
      },
      {
        label: "Refresh Timothy hay, pellets & drinking water",
        instructions: "Top up Timothy hay rack, add measured pellet portions, and replace drinking water.",
        priority: "MUST",
      },
      {
        label: "Clean rabbit litter box, trays & play area",
        instructions: "Empty waste, replace absorbent pads, refresh pine pellets, and return tools to place.",
        priority: "MUST",
      },
      {
        label: "Supervised pen exercise & companionship",
        instructions: "If time permits after essential tasks, allow 15 minutes of supervised exercise in the pen.",
        priority: "NICE",
      },
      {
        label: "Lock confirmation & visit report",
        instructions: "Before leaving, verify pen latches and front door lock twice, switch off lights, and send photos, video, and notes.",
        priority: "MUST",
      },
    ],
  },
  zh: {
    description:
      "外出期间，需要为两只兔子安排八次晚间上门照护。钥匙通过门外智能密码盒交接；玄关备有鞋套与消毒洗手液；提摩西草和兔粮在客厅储物柜第二层；离开时请顺手将兔厕所垃圾带至楼道垃圾处。请尽量保持原有作息，仔细确认室内环境，并在每次照护后反馈状态。",
    scheduleNotes: "18:00–20:00 之间到达即可，每次请预留约 60 分钟。",
    location: "东京都世田谷区",
    petNotes: [
      "性格温和亲人，喜欢被轻抚额头。",
      "好奇活泼，动作敏捷，离开前请仔细检查围栏插销。",
    ],
    tasks: [
      {
        label: "检查室温、湿度及精神状态",
        instructions: "确认温湿度计、饮水量与便便形态；发现异常请拍照记录并沟通。",
        priority: "MUST",
      },
      {
        label: "补充提摩西牧草、兔粮与新鲜饮水",
        instructions: "添满草架上的提摩西草，按定量分装盒添粮，清洗更换饮水壶。",
        priority: "MUST",
      },
      {
        label: "清洁兔厕所、托盘与活动区域",
        instructions: "清理便便和尿垫，更换除臭木粒垫料，并将清洁工具归位。",
        priority: "MUST",
      },
      {
        label: "看护下围栏放风与互动",
        instructions: "在完成必做任务且时间充裕时，在安全围栏内放风互动15分钟。",
        priority: "NICE",
      },
      {
        label: "离开前安全确认与图文反馈",
        instructions: "离开前双重核对围栏插销与大门门锁，关闭不必要的灯，发送照片、短视频及状态总结。",
        priority: "MUST",
      },
    ],
  },
  ja: {
    description:
      "留守中、2匹のうさぎを対象に夕方の訪問ケアを8回お願いします。鍵は玄関前の暗証番号ボックスで受け渡し。玄関に使い捨てスリッパと除菌液を用意しています。チモシー牧草とペレットはリビング収納の2段目です。ゴミ袋は退出時にフロアの回収場所へお出しください。いつもの生活リズムを保ち、室内環境を丁寧に確認し、毎回ケア後に様子を知らせてください。",
    scheduleNotes: "18:00〜20:00の間に訪問してください。1回につき約60分を想定しています。",
    location: "東京都世田谷区",
    petNotes: [
      "穏やかで人懐っこく、頭をなでられるのが好きです。",
      "好奇心旺盛で素早いため、退出前にサークルの扉を再確認してください。",
    ],
    tasks: [
      {
        label: "室温・湿度と2匹の様子を確認",
        instructions: "温湿度計、飲水量、排泄を確認し、異変があれば写真付きで報告してください。",
        priority: "MUST",
      },
      {
        label: "チモシー牧草・ペレット・新鮮な水を補充",
        instructions: "牧草をたっぷり補充し、計量済みペレットを与え、給水器の水を交換してください。",
        priority: "MUST",
      },
      {
        label: "トイレ・トレー・遊びスペースの清掃",
        instructions: "トイレの排泄物とシーツを交換し、木質ペレットを補充して清掃用具を戻してください。",
        priority: "MUST",
      },
      {
        label: "サークル内での見守り運動とふれあい",
        instructions: "必須ケア完了後に余裕がある場合、サークル内で15分ほど見守り運動を行ってください。",
        priority: "NICE",
      },
      {
        label: "退出時の施錠確認と報告送信",
        instructions: "退出前にサークル扉と玄関の施錠を二重確認し、不要な照明を消して写真・動画・様子を送信してください。",
        priority: "MUST",
      },
    ],
  },
};

const petNames: Record<Lang, string[]> = {
  en: ["Snowball", "Caramel"],
  zh: ["雪球", "焦糖"],
  ja: ["ゆき", "キャラメル"],
};

const petBreeds: Record<Lang, string[]> = {
  en: ["Netherland Dwarf", "Holland Lop"],
  zh: ["纯白侏儒兔", "焦糖垂耳兔"],
  ja: ["ホワイトドワーフ", "ホーランドロップ"],
};

const petImages = [
  "/images/care-guides/example-rabbit-snowball.jpg",
  "/images/care-guides/example-rabbit-caramel.jpg",
];

function buildExample(lang: Lang): NeedDetailDTO {
  const text = copy[lang];
  const petIds = ["example-pet-1", "example-pet-2"];
  const linkedPets = petIds.map((id, index) => ({
    id,
    name: petNames[lang][index],
    petType: "RABBIT" as const,
  }));
  const visitOrder = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 };

  return {
    id: "home-visit-guide-example",
    publicId: "v2:home-visit-guide-example",
    source: "V2",
    mode: "HOME_VISIT",
    state: "OPEN",
    updatedAt: "2026-08-20T00:00:00.000Z",
    title: "",
    description: text.description,
    scheduleNotes: text.scheduleNotes,
    startsAt: "2026-09-05T00:00:00.000Z",
    endsAt: "2026-09-20T00:00:00.000Z",
    timeZone: "Asia/Tokyo",
    location: {
      label: text.location,
      regionLabel: text.location,
      displayPrecision: "DISTRICT",
      distanceMeters: null,
      mapPoint: { lat: 35.6466, lon: 139.6532 },
    },
    budget: {
      kind: "EXACT",
      minAmountMinor: 5000,
      maxAmountMinor: null,
      currency: "JPY",
      negotiable: false,
    },
    pets: petIds.map((id, index) => ({
      id,
      order: index,
      name: petNames[lang][index],
      petType: "RABBIT",
      customPetType: null,
      quantity: 1,
      breed: petBreeds[lang][index],
      birthDate: new Date(2023 + index, 4, 12).toISOString(),
      weightGrams: 1050 + index * 350,
      sex: index === 1 ? "FEMALE" : "MALE",
      neutered: "YES",
      careNotes: text.petNotes[index],
      image: petImages[index],
    })),
    tasks: text.tasks.map((task, index) => ({
      id: `example-task-${index + 1}`,
      category: `CUSTOM-${index + 1}`,
      label: task.label,
      instructions: task.instructions,
      priority: task.priority,
      scheduleKind: "EACH_VISIT",
      visitNumbers: [],
      order: index,
      orderByVisit: visitOrder,
      pets: linkedPets,
    })),
    schedule: {
      homeVisit: {
        intervalDays: 2,
        firstServiceDate: "2026-09-05T00:00:00.000Z",
        visitsPerServiceDay: 1,
        visitWindows: [1, 2, 3, 4, 5].map((visitNumber) => ({
          visitNumber,
          kind: "PREFERRED" as const,
          preferredLocalTime: "18:30",
        })),
      },
      boarding: null,
      custom: null,
    },
    supplies: [],
    requirements: [],
    additionalCosts: [
      { kind: "TRAVEL", mode: "FIXED", amountMinor: 800 },
      { kind: "SUPPLY", mode: "NONE", amountMinor: null },
    ],
    attachments: [],
    owner: {
      id: "example-owner",
      nickname: lang === "zh" ? "林女士" : lang === "ja" ? "林さん" : "Sarah M.",
      image: "/images/care-guides/example-owner-avatar.jpg",
      memberSince: "2024-01-01T00:00:00.000Z",
      bio: null,
      requestsCount: 3,
    },
    createdAt: "2026-08-20T00:00:00.000Z",
  };
}

export const homeVisitExampleData: Record<Lang, NeedDetailDTO> = {
  en: buildExample("en"),
  zh: buildExample("zh"),
  ja: buildExample("ja"),
};
