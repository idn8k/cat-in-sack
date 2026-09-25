import { z } from "zod";
import { userSchema } from "./user";

export const requestOtpSchema = z.object({
  email: z.string().email(),
});
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const sessionSchema = z.object({
  token: z.string(),
  expiresAt: z.coerce.date(),
  user: userSchema,
});
export type Session = z.infer<typeof sessionSchema>;
