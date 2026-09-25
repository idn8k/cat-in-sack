import {
  felineListSchema,
  felineSchema,
  sessionSchema,
  type CreateFelineInput,
  type Feline,
  type Session,
} from "@cat-in-sack/shared";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export async function requestOtp(email: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/auth/otp/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error("Failed to send code");
  }
}

export async function verifyOtp(email: string, code: string): Promise<Session> {
  const response = await fetch(`${API_URL}/api/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });

  if (!response.ok) {
    throw new Error("Invalid or expired code");
  }

  return sessionSchema.parse(await response.json());
}

export async function listFelines(token: string): Promise<Feline[]> {
  const response = await fetch(`${API_URL}/api/felines`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to load cats");
  }

  return felineListSchema.parse(await response.json());
}

export async function createFeline(token: string, input: CreateFelineInput): Promise<Feline> {
  const response = await fetch(`${API_URL}/api/felines`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to create your cat");
  }

  return felineSchema.parse(await response.json());
}
