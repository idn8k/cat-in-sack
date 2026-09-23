import { NextResponse } from "next/server";
import { isDatabaseConnected } from "../../../lib/db";

export async function GET() {
  if (!isDatabaseConnected()) {
    return NextResponse.json({ status: "error" }, { status: 503 });
  }

  return NextResponse.json({ status: "ok" });
}
