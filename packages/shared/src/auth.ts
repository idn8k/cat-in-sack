import { z } from "zod";
import { userSchema } from "./user";

const emailSchema = z.string().trim().toLowerCase().email();

export const requestOtpSchema = z.object({
  email: emailSchema,
});
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z.object({
  email: emailSchema,
  code: z.string().length(6),
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const sessionSchema = z.object({
  token: z.string(),
  expiresAt: z.coerce.date(),
  user: userSchema,
});
export type Session = z.infer<typeof sessionSchema>;
