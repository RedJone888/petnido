import { PetType } from "@prisma/client";
import { z } from "zod";

export const petCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    type: z.nativeEnum(PetType),
    breed: z.string().trim().max(120).nullable().optional(),
    age: z.number().int().min(0).max(100).nullable().optional(),
    notes: z.string().trim().max(3000).nullable().optional(),
  })
  .strict();

export const petUpdateSchema = petCreateSchema.partial().extend({
  id: z.string().cuid(),
});

export const petIdSchema = z.object({ id: z.string().cuid() }).strict();
