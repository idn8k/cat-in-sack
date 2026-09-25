import { NextResponse } from "next/server";

type JsonBodyResult = { data: unknown } | { error: NextResponse };

/**
 * `request.json()` throws on a malformed body, which would otherwise bubble up as an
 * unhandled 500 before a route's schema validation even runs. Callers check
 * `"error" in result` and return it directly, the same pattern as `authenticate()`.
 */
export async function readJsonBody(request: Request): Promise<JsonBodyResult> {
  try {
    return { data: await request.json() };
  } catch {
    return { error: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }) };
  }
}
