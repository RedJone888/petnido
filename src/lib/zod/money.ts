import { z } from "zod";

export const currencySchema = z.enum(["JPY", "USD", "EUR", "CNY", "TWD", "KRW", "GBP"]);
export const priceUnitSchema = z.enum(["TOTAL", "DAY", "HOUR", "VISIT", "PET_DAY"]);

const amountMinorSchema = z.number().int().nonnegative().max(1_000_000_000);

export const moneyOfferSchema = z
  .discriminatedUnion("kind", [
    z.object({ kind: z.literal("FIXED"), amountMinor: amountMinorSchema, currency: currencySchema }).strict(),
    z
      .object({
        kind: z.literal("RANGE"),
        minAmountMinor: amountMinorSchema,
        maxAmountMinor: amountMinorSchema,
        currency: currencySchema,
      })
      .strict(),
    z.object({ kind: z.literal("NEGOTIABLE"), currency: currencySchema }).strict(),
  ])
  .refine(
    (value) => value.kind !== "RANGE" || value.maxAmountMinor >= value.minAmountMinor,
    "INVALID_MONEY_RANGE",
  );

export const feeRuleSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("INCLUDED") }),
  z.object({ kind: z.literal("FIXED_EXTRA"), amountMinor: amountMinorSchema, currency: currencySchema }),
  z.object({ kind: z.literal("REIMBURSE_ACTUAL") }),
  z.object({ kind: z.literal("NEGOTIABLE") }),
]);

export type MoneyOffer = z.infer<typeof moneyOfferSchema>;
export type FeeRule = z.infer<typeof feeRuleSchema>;
