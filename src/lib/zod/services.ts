import { z } from "zod";
import {
  ServiceCategory,
  PriceUnit,
  AvailabilityRangeType,
  AvailabilityWeekPattern,
  Currency,
} from "@prisma/client";
import { ImageItem } from "@/domain/attachment/type";
import { isBefore, parseISO } from "date-fns";

export const priceRuleFormSchema = z.object({
  // id: z.string().optional(),
  // tempId: z.string(),
  groupLabel: z.string().min(1, "价格名称必填"),
  price: z.string().min(1, "请输入价格"),
});
export const priceRuleApiSchema = z.object({
  groupLabel: z.string().min(1, "价格名称必填"),
  price: z.coerce.number().int(),
});
export type PriceRuleForm = z.infer<typeof priceRuleFormSchema>;

const serviceValidation = (data: any, ctx: z.RefinementCtx) => {
  if (data.serviceType === ServiceCategory.OTHER) {
    if (!data.customType || data.customType?.trim().length === 0) {
      ctx.addIssue({
        path: ["customType"],
        message: "请输入自定义服务名称",
        code: z.ZodIssueCode.custom,
      });
    }
  }

  if (data.availabilityRangeType === AvailabilityRangeType.DATE_RANGE) {
    if (!data.availableFrom) {
      ctx.addIssue({
        path: ["availableFrom"],
        message: "请选择开始日期",
        code: z.ZodIssueCode.custom,
      });
    }
    if (!data.availableTo) {
      ctx.addIssue({
        path: ["availableTo"],
        message: "请选择结束日期",
        code: z.ZodIssueCode.custom,
      });
    }
    if (data.availableFrom && data.availableTo) {
      const from = parseISO(data.availableFrom);
      const to = parseISO(data.availableTo);
      if (isBefore(to, from)) {
        ctx.addIssue({
          path: ["availableTo"],
          message: "结束日期不能早于开始日期",
          code: z.ZodIssueCode.custom,
        });
      }
    }
  }
};
const serviceBase = z.object({
  serviceType: z.nativeEnum(ServiceCategory),
  customType: z.string().trim().nullable(),
  description: z.string().trim().nullable(),
  isActive: z.boolean(),
  availabilityRangeType: z.nativeEnum(AvailabilityRangeType),
  availabilityWeekPattern: z.nativeEnum(AvailabilityWeekPattern),
  availableFrom: z.string().nullable(),
  availableTo: z.string().nullable(),
  includeHolidays: z.boolean(),
  areaRaw: z.string().min(1, "地点不能为空"),
  areaLat: z.number(),
  areaLon: z.number(),
  currency: z.nativeEnum(Currency),
  priceUnit: z.nativeEnum(PriceUnit),
});
export const serviceFormSchema = serviceBase
  .extend({
    photos: z.array(z.custom<ImageItem>()),
    priceRules: z.array(priceRuleFormSchema).min(1),
  })
  .superRefine(serviceValidation);
export type ServiceForm = z.infer<typeof serviceFormSchema>;

export const serviceApiSchema = serviceBase.extend({
  experiencePhotoIds: z.array(z.string()),
  homePhotoIds: z.array(z.string()),
  priceRules: z.array(priceRuleApiSchema).min(1),
});
export const serviceCreateSchema =
  serviceApiSchema.superRefine(serviceValidation);
export const serviceUpdateSchema = serviceApiSchema.partial().extend({
  serviceId: z.string(),
});
export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>;

export const serviceToggleSchema = z.object({
  serviceId: z.string(),
  isActive: z.boolean(),
});
export const serviceDeleteSchema = z.object({
  serviceId: z.string(),
});
