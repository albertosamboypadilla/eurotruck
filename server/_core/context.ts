import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { parse as parseCookieHeader } from "cookie";
import { getLocalAdminByUsername } from "../db";
import { readAdminSession, SESSION_COOKIE } from "../localAuth";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }

  if (!user) {
    const token = parseCookieHeader(opts.req.headers.cookie ?? "")[SESSION_COOKIE];
    const session = await readAdminSession(token);
    if (session) {
      const admin = await getLocalAdminByUsername(session.username);
      if (admin?.active) {
        const now = new Date();
        user = { id: -admin.id, openId: `local:${admin.username}`, name: admin.username, email: null, loginMethod: "local", role: "admin", createdAt: now, updatedAt: now, lastSignedIn: now };
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
