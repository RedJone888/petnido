import { ImageItem } from "@/domain/attachment/type";
import {
  DistanceRange,
  FrequencyType,
  ServiceCategory,
  NeedStatus,
  PetType,
  TransportMethod,
  Currency,
} from "@prisma/client";
import { isBefore, parseISO } from "date-fns";
import { z } from "zod";
const needPetBase = z.object({
  petCategory: z
    .nativeEnum(PetType)
    .nullable()
    .refine((val) => val !== null, {
      message: "ペットの種類を選択してください",
    }),
  petType: z.string().nullable(),
  description: z.string().nullable(),
  petIds: z.array(z.string()),
  tags: z.array(z.string()),
});
const needPetFormSchema = needPetBase
  .extend({
    count: z.string().min(1, "1以上の数字"),
    photos: z.array(z.custom<ImageItem>()),
  })
  .superRefine((data, ctx) => {
    if (data.petCategory === "OTHER" || data.petCategory === null) {
      if (!data.petType || data.petType.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["petType"],
          message: "具体的な種類を入力してください",
        });
      }
    }
    if (parseInt(data.count) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["count"],
        message: "1以上の数字",
      });
    }
  });
const needPetApiSchema = needPetBase.extend({
  count: z.coerce.number().int().default(1),
  photoIds: z.array(z.string()),
});
const needValidation = (data: any, ctx: z.RefinementCtx) => {
  if (data.category === "VISIT") {
    if (data.frequencyType === FrequencyType.CUSTOM) {
      if (!data.customDays || Number(data.customDays) <= 0) {
        ctx.addIssue({
          path: ["customDays"],
          message: "1以上の数字",
          code: z.ZodIssueCode.custom,
        });
      }
      if (!data.customTimes || Number(data.customTimes) <= 0) {
        ctx.addIssue({
          path: ["customTimes"],
          message: "1以上の数字",
          code: z.ZodIssueCode.custom,
        });
      }
    }
  }

  if (data.startDate && data.endDate) {
    const from = parseISO(data.startDate);
    const to = parseISO(data.endDate);
    if (isBefore(to, from)) {
      ctx.addIssue({
        path: ["endDate"],
        message: "終了日は開始日以降の日付を選択してください",
        code: z.ZodIssueCode.custom,
      });
    }
  }
};
const commonFields = z.object({
  title: z.string().min(1, "请输入标题"),
  startDate: z.string().min(1, "请选择开始日期"),
  endDate: z.string().min(1, "请选择结束日期"),
  addressRaw: z.string().min(1, "请选择地点"),
  addressLat: z.number(),
  addressLon: z.number(),
  requirement: z.string().min(1, "请输入需求说明"),
  currency: z.nativeEnum(Currency),
  status: z.nativeEnum(NeedStatus),
});

// 封装一个工厂函数，避免前后端 Schema 重复写 discriminatedUnion 逻辑
function createNeedSchema<T extends z.ZodRawShape>(specificFields: z.ZodObject<T>) {
  const base = commonFields.merge(specificFields);
  return z.discriminatedUnion("category", [
    // VISIT 类型：强制要求 frequencyType
    base.extend({
      category: z.literal(ServiceCategory.VISIT),
      frequencyType: z.nativeEnum(FrequencyType),
      fosterRange: z.any().nullable().optional(),     // 允许但在该类型下不强制校验
      transportMethod: z.any().nullable().optional(), 
    }),
    // FOSTER 类型：强制要求 fosterRange 和 transportMethod
    base.extend({
      category: z.literal(ServiceCategory.FOSTER),
      fosterRange: z.nativeEnum(DistanceRange),
      transportMethod: z.nativeEnum(TransportMethod),
      frequencyType: z.any().nullable().optional(),
    }),
    // OTHER 类型
    base.extend({
      category: z.literal(ServiceCategory.OTHER),
      frequencyType: z.any().nullable().optional(),
      fosterRange: z.any().nullable().optional(),
      transportMethod: z.any().nullable().optional(),
    }),
  ]);
}

const formSpecificFields = z.object({
  customDays: z.string().nullable(),
  customTimes: z.string().nullable(),
  needPets: z.array(needPetFormSchema).min(1),
  photos: z.array(z.custom<ImageItem>()),
  priceAmount: z.string().min(1, "请输入价格"),
  totalPrice: z.string().min(1, "请输入jiage"),
});

export const needFormSchema = createNeedSchema(formSpecificFields).superRefine(needValidation);

const apiSpecificFields = z.object({
  customDays: z.coerce.number().int().default(1).nullable(),
  customTimes: z.coerce.number().int().default(0).nullable(),
  needPets: z.array(needPetApiSchema).min(1),
  photoIds: z.array(z.string()),
  priceAmount: z.coerce.number().int().default(0).nullable(),
  totalPrice: z.coerce.number().int().default(0),
});

const needApiSchema = createNeedSchema(apiSpecificFields);

export const needCreateSchema = needApiSchema.superRefine(needValidation);

export const needUpdateSchema = createNeedSchema(
  apiSpecificFields.extend({
    id: z.string(),
    needPets: z
      .array(
        needPetApiSchema.extend({
          id: z.string().optional(),
        }),
      )
      .min(1),
  })
).superRefine(needValidation);

export type NeedCreateInput = z.infer<typeof needCreateSchema>;
export type NeedPetForm = z.input<typeof needPetFormSchema>;
export type NeedForm = z.input<typeof needFormSchema>;
