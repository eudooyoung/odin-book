import { z } from "zod";

export const registerSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(15).max(128),
});

export type RegisterDto = z.infer<typeof registerSchema>;
