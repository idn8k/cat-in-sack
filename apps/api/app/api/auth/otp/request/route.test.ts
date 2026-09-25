import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { connectToDatabase, disconnectFromDatabase } from "../../../../../lib/db";
import { OtpCode } from "../../../../../models";
import { POST } from "./route";

describe("POST /api/auth/otp/request", () => {
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

  it("stores a hashed OTP code and logs the plaintext code instead of emailing it", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const response = await POST(
      new Request("http://localhost/api/auth/otp/request", {
        method: "POST",
        body: JSON.stringify({ email: "user@example.com" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("user@example.com"));

    const stored = await OtpCode.findOne({ email: "user@example.com" });
    expect(stored).not.toBeNull();
    expect(stored?.codeHash).not.toMatch(/^\d{6}$/);

    logSpy.mockRestore();
  });

  it("rejects an invalid email", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/otp/request", {
        method: "POST",
        body: JSON.stringify({ email: "not-an-email" }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("rejects a malformed JSON body instead of throwing", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/otp/request", {
        method: "POST",
        body: "{not json",
      }),
    );

    expect(response.status).toBe(400);
  });
});
