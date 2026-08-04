import { z } from "zod";

import { mapLocationSchema } from "./location";

export const savedLocationCreateSchema = mapLocationSchema.extend({
  label: z.string().trim().min(1).max(50).nullable().optional(),
  makeDefault: z.boolean().default(false),
});

export const savedLocationUpdateSchema = savedLocationCreateSchema
  .omit({ makeDefault: true })
  .partial()
  .extend({ id: z.string().cuid() });

export const savedLocationIdSchema = z
  .object({ id: z.string().cuid() })
  .strict();
