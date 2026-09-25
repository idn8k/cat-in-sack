import { verifyOtpSchema } from "@cat-in-sack/shared";
import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../../../lib/db";
import { hashOtpCode } from "../../../../../lib/otp";
import { generateSessionToken, hashSessionToken, SESSION_TTL_MS } from "../../../../../lib/session";
import { Household, OtpCode, Session, User } from "../../../../../models";

export async function POST(request: Request) {
  await connectToDatabase();

  const parsed = verifyOtpSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or code" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();

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
    user = await User.create({ email, householdId: household._id });
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
