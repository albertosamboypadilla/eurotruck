import { describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import { createAdminSession, hashPassword, readAdminSession, verifyPassword } from "./localAuth";

describe("local admin authentication", () => {
  it("hashes and verifies an administrator password without storing plaintext", async () => {
    const result = await hashPassword("samboy89");
    expect(result.hash).not.toContain("samboy89");
    await expect(verifyPassword("samboy89", result.salt, result.hash)).resolves.toBe(true);
    await expect(verifyPassword("incorrecta", result.salt, result.hash)).resolves.toBe(false);
  });

  it("signs and reads an administrator session", async () => {
    process.env.JWT_SECRET ??= "test-secret-for-local-admins";
    const token = await createAdminSession("admin1");
    await expect(readAdminSession(token)).resolves.toEqual({ username: "admin1" });
    await expect(readAdminSession("invalid-token")).resolves.toBeNull();
  });

  it("rejects an expired administrator session", async () => {
    process.env.JWT_SECRET ??= "test-secret-for-local-admins";
    const token = await new SignJWT({ username: "admin1", role: "admin" }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("0s").sign(new TextEncoder().encode(process.env.JWT_SECRET));
    await expect(readAdminSession(token)).resolves.toBeNull();
  });
});
