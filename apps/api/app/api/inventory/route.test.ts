import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { connectToDatabase, disconnectFromDatabase } from "../../../lib/db";
import { Inventory, OtpCode } from "../../../models";
import { POST as requestOtp } from "../auth/otp/request/route";
import { POST as verifyOtp } from "../auth/otp/verify/route";
import { GET, POST } from "./route";

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

describe("/api/inventory", () => {
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

  describe("POST", () => {
    it("creates an Inventory item for the current session's Household", async () => {
      const token = await createSessionFor("owner@example.com");

      const response = await POST(
        jsonRequest("http://localhost/api/inventory", "POST", token, {
          type: "FOOD",
          totalAmount: 5,
          dailyBurnRate: 0.5,
        }),
      );
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.type).toBe("FOOD");
      expect(body.totalAmount).toBe(5);
      expect(body.dailyBurnRate).toBe(0.5);
      expect(body.reorderThresholdDays).toBe(3);
      expect(body.id).toEqual(expect.any(String));
      expect(body.householdId).toEqual(expect.any(String));
      expect(body.depletionDate).toEqual(expect.any(String));
      expect(body.reorderDue).toBe(false);

      const stored = await Inventory.findById(body.id);
      expect(stored).not.toBeNull();
      expect(stored?.householdId.toString()).toBe(body.householdId);
    });

    it("flags an item whose depletion date falls within its reorder threshold", async () => {
      const token = await createSessionFor("low-stock@example.com");

      const response = await POST(
        jsonRequest("http://localhost/api/inventory", "POST", token, {
          type: "LITTER",
          totalAmount: 1,
          dailyBurnRate: 1,
          reorderThresholdDays: 3,
        }),
      );
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.reorderDue).toBe(true);
    });

    it("rejects a request without a session", async () => {
      const response = await POST(
        jsonRequest("http://localhost/api/inventory", "POST", undefined, {
          type: "FOOD",
          totalAmount: 5,
          dailyBurnRate: 0.5,
        }),
      );

      expect(response.status).toBe(401);
    });

    it("rejects an invalid payload", async () => {
      const token = await createSessionFor("owner2@example.com");

      const response = await POST(
        jsonRequest("http://localhost/api/inventory", "POST", token, { type: "FOOD", dailyBurnRate: 0 }),
      );

      expect(response.status).toBe(400);
    });

    it("rejects a malformed JSON body instead of throwing", async () => {
      const token = await createSessionFor("owner3@example.com");

      const response = await POST(
        new Request("http://localhost/api/inventory", {
          method: "POST",
          headers: { authorization: `Bearer ${token}` },
          body: "{not json",
        }),
      );

      expect(response.status).toBe(400);
    });
  });

  describe("GET", () => {
    it("lists only the Inventory items belonging to the caller's Household", async () => {
      const tokenA = await createSessionFor("household-a@example.com");
      const tokenB = await createSessionFor("household-b@example.com");

      await POST(
        jsonRequest("http://localhost/api/inventory", "POST", tokenA, {
          type: "FOOD",
          totalAmount: 5,
          dailyBurnRate: 0.5,
        }),
      );
      await POST(
        jsonRequest("http://localhost/api/inventory", "POST", tokenB, {
          type: "MEDS",
          totalAmount: 30,
          dailyBurnRate: 1,
        }),
      );

      const response = await GET(jsonRequest("http://localhost/api/inventory", "GET", tokenA));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0].type).toBe("FOOD");
    });

    it("returns an empty list for a Household with no Inventory yet", async () => {
      const token = await createSessionFor("new-household@example.com");

      const response = await GET(jsonRequest("http://localhost/api/inventory", "GET", token));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual([]);
    });
  });
});
