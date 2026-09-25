import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { connectToDatabase, disconnectFromDatabase } from "../../../../lib/db";
import { Inventory, OtpCode } from "../../../../models";
import { POST as requestOtp } from "../../auth/otp/request/route";
import { POST as verifyOtp } from "../../auth/otp/verify/route";
import { POST as createInventory } from "../route";
import { DELETE, PATCH } from "./route";

async function createSessionFor(email: string): Promise<string> {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

  await requestOtp(
    new Request("http://localhost/api/auth/otp/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  );

  const logged = logSpy.mock.calls.map((call) => String(call[0])).find((line) => line.includes(email));
  logSpy.mockRestore();

  const match = logged?.match(/: (\d{6})$/);
  if (!match) {
    throw new Error("OTP code was not logged");
  }

  const response = await verifyOtp(
    new Request("http://localhost/api/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ email, code: match[1] }),
    }),
  );
  const body = await response.json();
  return body.token;
}

function jsonRequest(url: string, method: string, token?: string, body?: unknown) {
  const headers: Record<string, string> = {};
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }
  return new Request(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function createItemFor(token: string) {
  const response = await createInventory(
    jsonRequest("http://localhost/api/inventory", "POST", token, {
      type: "FOOD",
      totalAmount: 5,
      dailyBurnRate: 0.5,
    }),
  );
  return response.json();
}

describe("/api/inventory/[id]", () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await connectToDatabase(mongod.getUri());
  });

  afterAll(async () => {
    await disconnectFromDatabase();
    await mongod.stop();
  });

  afterEach(async () => {
    await OtpCode.deleteMany({});
    await Inventory.deleteMany({});
  });

  describe("PATCH", () => {
    it("updates fields the caller sent without resetting the rest", async () => {
      const token = await createSessionFor("owner@example.com");
      const item = await createItemFor(token);

      const response = await PATCH(
        jsonRequest(`http://localhost/api/inventory/${item.id}`, "PATCH", token, { totalAmount: 2 }),
        { params: Promise.resolve({ id: item.id }) },
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.totalAmount).toBe(2);
      expect(body.dailyBurnRate).toBe(0.5);
      expect(body.reorderThresholdDays).toBe(3);
    });

    it("recomputes the depletion date and reorder flag from the updated burn rate", async () => {
      const token = await createSessionFor("owner1b@example.com");
      const item = await createItemFor(token);
      expect(item.reorderDue).toBe(false);

      const response = await PATCH(
        jsonRequest(`http://localhost/api/inventory/${item.id}`, "PATCH", token, { dailyBurnRate: 5 }),
        { params: Promise.resolve({ id: item.id }) },
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(new Date(body.depletionDate).getTime()).toBeLessThan(new Date(item.depletionDate).getTime());
      expect(body.reorderDue).toBe(true);
    });

    it("returns 404 for an item belonging to another Household", async () => {
      const tokenA = await createSessionFor("household-a@example.com");
      const tokenB = await createSessionFor("household-b@example.com");
      const item = await createItemFor(tokenA);

      const response = await PATCH(
        jsonRequest(`http://localhost/api/inventory/${item.id}`, "PATCH", tokenB, { totalAmount: 2 }),
        { params: Promise.resolve({ id: item.id }) },
      );

      expect(response.status).toBe(404);
    });

    it("returns 404 for a malformed id instead of throwing", async () => {
      const token = await createSessionFor("owner2@example.com");

      const response = await PATCH(
        jsonRequest("http://localhost/api/inventory/not-an-id", "PATCH", token, { totalAmount: 2 }),
        { params: Promise.resolve({ id: "not-an-id" }) },
      );

      expect(response.status).toBe(404);
    });

    it("rejects an invalid payload", async () => {
      const token = await createSessionFor("owner3@example.com");
      const item = await createItemFor(token);

      const response = await PATCH(
        jsonRequest(`http://localhost/api/inventory/${item.id}`, "PATCH", token, { dailyBurnRate: -1 }),
        { params: Promise.resolve({ id: item.id }) },
      );

      expect(response.status).toBe(400);
    });

    it("rejects a request without a session", async () => {
      const token = await createSessionFor("owner4@example.com");
      const item = await createItemFor(token);

      const response = await PATCH(
        jsonRequest(`http://localhost/api/inventory/${item.id}`, "PATCH", undefined, { totalAmount: 2 }),
        { params: Promise.resolve({ id: item.id }) },
      );

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE", () => {
    it("deletes an item belonging to the caller's Household", async () => {
      const token = await createSessionFor("owner5@example.com");
      const item = await createItemFor(token);

      const response = await DELETE(jsonRequest(`http://localhost/api/inventory/${item.id}`, "DELETE", token), {
        params: Promise.resolve({ id: item.id }),
      });

      expect(response.status).toBe(204);
      expect(await Inventory.findById(item.id)).toBeNull();
    });

    it("returns 404 for an item belonging to another Household", async () => {
      const tokenA = await createSessionFor("household-c@example.com");
      const tokenB = await createSessionFor("household-d@example.com");
      const item = await createItemFor(tokenA);

      const response = await DELETE(jsonRequest(`http://localhost/api/inventory/${item.id}`, "DELETE", tokenB), {
        params: Promise.resolve({ id: item.id }),
      });

      expect(response.status).toBe(404);
      expect(await Inventory.findById(item.id)).not.toBeNull();
    });
  });
});
