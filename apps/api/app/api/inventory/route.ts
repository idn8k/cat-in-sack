import { createInventorySchema } from "@cat-in-sack/shared";
import { NextResponse } from "next/server";
import { authenticate } from "../../../lib/auth";
import { connectToDatabase } from "../../../lib/db";
import { readJsonBody } from "../../../lib/http";
import { Inventory } from "../../../models";
import { serializeInventory } from "./serialize";

export async function GET(request: Request) {
  await connectToDatabase();

  const auth = await authenticate(request);
  if ("error" in auth) {
    return auth.error;
  }

  const items = await Inventory.find({ householdId: auth.user.householdId }).sort({ createdAt: 1 });
  return NextResponse.json(items.map(serializeInventory));
}

export async function POST(request: Request) {
  await connectToDatabase();

  const auth = await authenticate(request);
  if ("error" in auth) {
    return auth.error;
  }

  const body = await readJsonBody(request);
  if ("error" in body) {
    return body.error;
  }

  const parsed = createInventorySchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid Inventory details" }, { status: 400 });
  }

  const item = await Inventory.create({
    householdId: auth.user.householdId,
    ...parsed.data,
  });

  return NextResponse.json(serializeInventory(item), { status: 201 });
}
