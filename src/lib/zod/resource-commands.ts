import { z } from "zod";

export const ownedResourceIdSchema = z.object({
  id: z.string().min(1),
});

export const legacyNeedCommandSchema = ownedResourceIdSchema.extend({
  command: z.enum(["CLOSE", "REOPEN", "CANCEL"]),
});

export const legacyServiceCommandSchema = ownedResourceIdSchema.extend({
  command: z.enum(["PAUSE", "RESUME"]),
});

export type LegacyNeedCommand = z.infer<typeof legacyNeedCommandSchema>;
export type LegacyServiceCommand = z.infer<typeof legacyServiceCommandSchema>;
