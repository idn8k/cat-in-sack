import { NextResponse } from "next/server";
import { hashSessionToken } from "./session";
import { Session, User } from "../models";
import type { UserDocument } from "../models/User";
import type { HydratedDocument } from "mongoose";

export class UnauthorizedError extends Error {}

export async function requireUser(request: Request): Promise<HydratedDocument<UserDocument>> {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new UnauthorizedError("Missing bearer token");
  }

  const session = await Session.findOne({
    tokenHash: hashSessionToken(token),
    expiresAt: { $gt: new Date() },
  });
  if (!session) {
    throw new UnauthorizedError("Invalid or expired session");
  }

  const user = await User.findById(session.userId);
  if (!user) {
    throw new UnauthorizedError("Invalid or expired session");
  }

  return user;
}

type AuthResult = { user: HydratedDocument<UserDocument> } | { error: NextResponse };

/**
 * Route-handler-friendly wrapper around requireUser: callers check `"error" in result`
 * and return it directly, instead of each route repeating its own try/catch.
 */
export async function authenticate(request: Request): Promise<AuthResult> {
  try {
    return { user: await requireUser(request) };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }
    throw error;
  }
}
