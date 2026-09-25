import { createFelineSchema } from "@cat-in-sack/shared";
import { NextResponse } from "next/server";
import type { HydratedDocument } from "mongoose";
import { authenticate } from "../../../lib/auth";
import { connectToDatabase } from "../../../lib/db";
import { readJsonBody } from "../../../lib/http";
import { Feline } from "../../../models";
import type { FelineDocument } from "../../../models/Feline";

function serializeFeline(feline: HydratedDocument<FelineDocument>) {
  return {
    id: feline._id.toString(),
    householdId: feline.householdId.toString(),
    name: feline.name,
    dateOfBirth: feline.dateOfBirth,
    breed: feline.breed,
    targetWeightKg: feline.targetWeightKg,
    dietaryRestrictions: feline.dietaryRestrictions,
    createdAt: feline.createdAt,
  };
}

export async function GET(request: Request) {
  await connectToDatabase();

  const auth = await authenticate(request);
  if ("error" in auth) {
    return auth.error;
  }

  const felines = await Feline.find({ householdId: auth.user.householdId }).sort({ createdAt: 1 });
  return NextResponse.json(felines.map(serializeFeline));
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

  const parsed = createFelineSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid Feline details" }, { status: 400 });
  }

  const feline = await Feline.create({
    householdId: auth.user.householdId,
    ...parsed.data,
  });

  return NextResponse.json(serializeFeline(feline), { status: 201 });
}
