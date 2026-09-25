import { updateInventorySchema } from "@cat-in-sack/shared";
import { Types } from "mongoose";
import { NextResponse } from "next/server";
import { authenticate } from "../../../../lib/auth";
import { connectToDatabase } from "../../../../lib/db";
import { readJsonBody } from "../../../../lib/http";
import { Inventory } from "../../../../models";
import { serializeInventory } from "../serialize";

type RouteContext = { params: Promise<{ id: string }> };

const NOT_FOUND = NextResponse.json({ error: "Inventory item not found" }, { status: 404 });

export async function PATCH(request: Request, { params }: RouteContext) {
  await connectToDatabase();

  const auth = await authenticate(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NOT_FOUND;
  }

  const body = await readJsonBody(request);
  if ("error" in body) {
    return body.error;
  }

  const parsed = updateInventorySchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid Inventory details" }, { status: 400 });
  }

  const item = await Inventory.findOneAndUpdate(
    { _id: id, householdId: auth.user.householdId },
    { $set: parsed.data },
    { new: true, runValidators: true },
  );
  if (!item) {
    return NOT_FOUND;
  }

  return NextResponse.json(serializeInventory(item));
}

export async function DELETE(request: Request, { params }: RouteContext) {
  await connectToDatabase();

  const auth = await authenticate(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NOT_FOUND;
  }

  const item = await Inventory.findOneAndDelete({ _id: id, householdId: auth.user.householdId });
  if (!item) {
    return NOT_FOUND;
  }

  return new NextResponse(null, { status: 204 });
}
