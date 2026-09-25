import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { connectToDatabase, disconnectFromDatabase } from "../../../../../lib/db";
import { Household, OtpCode } from "../../../../../models";
import { POST as requestOtp } from "../request/route";
import { POST as verifyOtp } from "./route";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function requestCodeFor(email: string): Promise<string> {
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
  return match[1];
}

describe("POST /api/auth/otp/verify", () => {
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
  });

  it("issues a session and auto-creates a User + Household on first verification", async () => {
    const email = "new-user@example.com";
    const code = await requestCodeFor(email);

    const response = await verifyOtp(jsonRequest({ email, code }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.token).toEqual(expect.any(String));
    expect(body.user.email).toBe(email);
    expect(body.user.householdId).toEqual(expect.any(String));
  });

  it("reuses the existing User and Household on a later login instead of creating new ones", async () => {
    const email = "returning-user@example.com";

    const firstCode = await requestCodeFor(email);
    const first = await (await verifyOtp(jsonRequest({ email, code: firstCode }))).json();

    const secondCode = await requestCodeFor(email);
    const second = await (await verifyOtp(jsonRequest({ email, code: secondCode }))).json();

    expect(second.user.id).toBe(first.user.id);
    expect(second.user.householdId).toBe(first.user.householdId);
    expect(second.token).not.toBe(first.token);
  });

  it("creates exactly one User and Household when two verifications for a new email race", async () => {
    const email = "racey-user@example.com";
    const codeA = await requestCodeFor(email);
    const codeB = await requestCodeFor(email);
    const householdCountBefore = await Household.countDocuments({});

    const [responseA, responseB] = await Promise.all([
      verifyOtp(jsonRequest({ email, code: codeA })),
      verifyOtp(jsonRequest({ email, code: codeB })),
    ]);
    const [bodyA, bodyB] = await Promise.all([responseA.json(), responseB.json()]);

    expect(responseA.status).toBe(200);
    expect(responseB.status).toBe(200);
    expect(bodyA.user.id).toBe(bodyB.user.id);
    expect(bodyA.user.householdId).toBe(bodyB.user.householdId);

    const householdCountAfter = await Household.countDocuments({});
    expect(householdCountAfter - householdCountBefore).toBe(1);
  });

  it("rejects an incorrect code", async () => {
    const email = "wrong-code@example.com";
    const code = await requestCodeFor(email);
    const wrongCode = code === "000000" ? "000001" : "000000";

    const response = await verifyOtp(jsonRequest({ email, code: wrongCode }));

    expect(response.status).toBe(401);
  });

  it("rejects a code that has already been consumed", async () => {
    const email = "reused-code@example.com";
    const code = await requestCodeFor(email);

    await verifyOtp(jsonRequest({ email, code }));
    const response = await verifyOtp(jsonRequest({ email, code }));

    expect(response.status).toBe(401);
  });

  it("rejects a malformed JSON body instead of throwing", async () => {
    const response = await verifyOtp(
      new Request("http://localhost/api/auth/otp/verify", {
        method: "POST",
        body: "{not json",
      }),
    );

    expect(response.status).toBe(400);
  });
});
