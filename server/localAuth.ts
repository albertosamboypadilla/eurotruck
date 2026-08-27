import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { SignJWT, jwtVerify } from "jose";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "eurotruck_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function getSecret() {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET is not configured");
  return new TextEncoder().encode(value);
}

export async function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return { salt, hash: derived.toString("hex") };
}

export async function verifyPassword(password: string, salt: string, expectedHash: string) {
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(expectedHash, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export async function createAdminSession(username: string) {
  return new SignJWT({ username, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(username)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function readAdminSession(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    return typeof payload.username === "string" && payload.role === "admin" ? { username: payload.username } : null;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE, SESSION_TTL_SECONDS };
