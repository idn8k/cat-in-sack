import { verifyOtpSchema } from "@cat-in-sack/shared";
import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../../../lib/db";
import { readJsonBody } from "../../../../../lib/http";
import { hashOtpCode } from "../../../../../lib/otp";
import { generateSessionToken, hashSessionToken, SESSION_TTL_MS } from "../../../../../lib/session";
import { Household, OtpCode, Session, User } from "../../../../../models";

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
}

export async function POST(request: Request) {
  await connectToDatabase();

  const body = await readJsonBody(request);
  if ("error" in body) {
    return body.error;
  }

  const parsed = verifyOtpSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or code" }, { status: 400 });
  }

  const { email } = parsed.data;

  const otp = await OtpCode.findOne({
    email,
    codeHash: hashOtpCode(parsed.data.code),
    consumedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!otp) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
  }

  otp.consumedAt = new Date();
  await otp.save();

  let user = await User.findOne({ email });
  if (!user) {
    const household = await Household.create({});
    try {
      user = await User.create({ email, householdId: household._id });
    } catch (error) {
      // Lost a race with a concurrent verification for the same new email — an unused
      // Household is left behind, and the User that won the race is the source of truth.
      if (!isDuplicateKeyError(error)) {
        throw error;
      }
      await Household.deleteOne({ _id: household._id });
      user = await User.findOne({ email });
    }
  }

  if (!user) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }

  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await Session.create({ tokenHash: hashSessionToken(token), userId: user._id, expiresAt });

  return NextResponse.json({
    token,
    expiresAt,
    user: {
      id: user._id.toString(),
      email: user.email,
      householdId: user.householdId.toString(),
      createdAt: user.createdAt,
    },
  });
}
