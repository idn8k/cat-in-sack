import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { connectToDatabase, disconnectFromDatabase } from "../../../lib/db";
import { Feline, OtpCode } from "../../../models";
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

describe("/api/felines", () => {
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
    await Feline.deleteMany({});
  });

  describe("POST", () => {
    it("creates a Feline for the current session's Household", async () => {
      const token = await createSessionFor("owner@example.com");

      const response = await POST(
        jsonRequest("http://localhost/api/felines", "POST", token, {
          name: "Whiskers",
          dateOfBirth: "2020-01-15",
          breed: "Tabby",
        }),
      );
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.name).toBe("Whiskers");
      expect(body.breed).toBe("Tabby");
      expect(body.id).toEqual(expect.any(String));
      expect(body.householdId).toEqual(expect.any(String));

      const stored = await Feline.findById(body.id);
      expect(stored).not.toBeNull();
      expect(stored?.householdId.toString()).toBe(body.householdId);
    });

    it("rejects a request without a session", async () => {
      const response = await POST(
        jsonRequest("http://localhost/api/felines", "POST", undefined, {
          name: "Whiskers",
          dateOfBirth: "2020-01-15",
        }),
      );

      expect(response.status).toBe(401);
    });

    it("rejects an invalid payload", async () => {
      const token = await createSessionFor("owner2@example.com");

      const response = await POST(jsonRequest("http://localhost/api/felines", "POST", token, { name: "" }));

      expect(response.status).toBe(400);
    });

    it("rejects a malformed JSON body instead of throwing", async () => {
      const token = await createSessionFor("owner3@example.com");

      const response = await POST(
        new Request("http://localhost/api/felines", {
          method: "POST",
          headers: { authorization: `Bearer ${token}` },
          body: "{not json",
        }),
      );

      expect(response.status).toBe(400);
    });
  });

  describe("GET", () => {
    it("lists only the Felines belonging to the caller's Household", async () => {
      const tokenA = await createSessionFor("household-a@example.com");
      const tokenB = await createSessionFor("household-b@example.com");

      await POST(
        jsonRequest("http://localhost/api/felines", "POST", tokenA, {
          name: "Mochi",
          dateOfBirth: "2019-06-01",
        }),
      );
      await POST(
        jsonRequest("http://localhost/api/felines", "POST", tokenB, {
          name: "Biscuit",
          dateOfBirth: "2021-03-10",
        }),
      );

      const response = await GET(jsonRequest("http://localhost/api/felines", "GET", tokenA));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0].name).toBe("Mochi");
    });

    it("returns an empty list for a Household with no Felines yet", async () => {
      const token = await createSessionFor("new-household@example.com");

      const response = await GET(jsonRequest("http://localhost/api/felines", "GET", token));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual([]);
    });
  });
});
