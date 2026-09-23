import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { connectToDatabase, disconnectFromDatabase } from "../../../lib/db";
import { GET } from "./route";

describe("GET /api/health", () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await connectToDatabase(mongod.getUri());
  });

  afterAll(async () => {
    await disconnectFromDatabase();
    await mongod.stop();
  });

  it("responds successfully when the database is reachable", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: "ok" });
  });
});
