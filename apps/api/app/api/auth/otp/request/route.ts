import { requestOtpSchema } from "@cat-in-sack/shared";
import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../../../lib/db";
import { readJsonBody } from "../../../../../lib/http";
import { sendOtpEmail } from "../../../../../lib/mailer";
import { generateOtpCode, hashOtpCode, OTP_TTL_MS } from "../../../../../lib/otp";
import { OtpCode } from "../../../../../models";

export async function POST(request: Request) {
  await connectToDatabase();

  const body = await readJsonBody(request);
  if ("error" in body) {
    return body.error;
  }

  const parsed = requestOtpSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { email } = parsed.data;
  const code = generateOtpCode();

  await OtpCode.create({
    email,
    codeHash: hashOtpCode(code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  await sendOtpEmail(email, code);

  return NextResponse.json({ status: "sent" });
}
