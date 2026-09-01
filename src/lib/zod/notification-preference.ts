import { z } from "zod";

export const notificationPreferenceUpdateSchema = z
  .object({ emailInstant: z.boolean() })
  .strict();
