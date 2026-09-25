import { randomBytes } from "node:crypto";
import { sha256Hex } from "./crypto";

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string): string {
  return sha256Hex(token);
}
