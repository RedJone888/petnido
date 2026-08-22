import { PetType } from "@prisma/client";
import { z } from "zod";

export const petCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    type: z.nativeEnum(PetType),
    customType: z.string().trim().max(80).nullable().optional(),
    quantity: z.number().int().positive().max(100).optional(),
    breed: z.string().trim().max(120).nullable().optional(),
    age: z.number().int().min(0).max(100).nullable().optional(),
    birthDate: z.coerce.date().nullable().optional(),
    weightGrams: z.number().int().positive().nullable().optional(),
    sex: z.enum(["FEMALE", "MALE", "UNKNOWN"]).nullable().optional(),
    neutered: z.enum(["YES", "NO", "UNKNOWN"]).nullable().optional(),
    notes: z.string().trim().max(3000).nullable().optional(),
    photoIds: z.array(z.string().cuid()).max(1).optional(),
  })
  .strict();

export const petUpdateSchema = petCreateSchema.partial().extend({
  id: z.string().cuid(),
});

export const petIdSchema = z.object({ id: z.string().cuid() }).strict();
