import { describe, expect, it, vi } from "vitest";

const { getLocalAdminByUsername, readAdminSession, authenticateRequest } = vi.hoisted(() => ({
  getLocalAdminByUsername: vi.fn(),
  readAdminSession: vi.fn(),
  authenticateRequest: vi.fn(),
}));

vi.mock("./db", () => ({ getLocalAdminByUsername }));
vi.mock("./localAuth", () => ({ SESSION_COOKIE: "eurotruck_admin_session", readAdminSession }));
vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest } }));

import { createContext } from "./_core/context";

describe("createContext", () => {
  it("prioriza la sesión local activa sobre OAuth", async () => {
    readAdminSession.mockResolvedValue({ username: "admin1" });
    getLocalAdminByUsername.mockResolvedValue({ id: 1, username: "admin1", active: true });
    authenticateRequest.mockResolvedValue({ id: 99, openId: "oauth-user", name: "OAuth", role: "user" });

    const context = await createContext({ req: { headers: { cookie: "eurotruck_admin_session=local-token" } } as never, res: {} as never });

    expect(context.user).toMatchObject({ name: "admin1", role: "admin", loginMethod: "local" });
    expect(authenticateRequest).not.toHaveBeenCalled();
  });
});
