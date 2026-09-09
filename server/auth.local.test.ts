import { describe, expect, it, vi } from "vitest";

const { getLocalAdminByUsername } = vi.hoisted(() => ({ getLocalAdminByUsername: vi.fn(async () => undefined) }));
vi.mock("./db", () => ({ getLocalAdminByUsername, createOrder: vi.fn(), archiveOrder: vi.fn(), purgeDeletedOrder: vi.fn(), listDeletedOrders: vi.fn(), listOrders: vi.fn() }));

import { appRouter } from "./routers";

describe("local login procedure", () => {
  it("rejects invalid administrator credentials", async () => {
    const caller = appRouter.createCaller({ req: {} as never, res: {} as never, user: null });
    await expect(caller.auth.localLogin({ username: "not-an-admin", password: "wrong" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(getLocalAdminByUsername).toHaveBeenCalledWith("not-an-admin");
  });

  it("accepts admin1 with the configured credential hash", async () => {
    getLocalAdminByUsername.mockResolvedValueOnce({ id: 1, username: "admin1", active: 1, passwordSalt: "db6e503281697e03417994f41f959014", passwordHash: "1d901bf5fb415fa59cf40e1392f631a3833d716d1e2e6b82ca9e8dbb17b07b95fba2b400134951d5c3d101b47105b9b2d0473a9b5f6ff1b894ec50fb7d0ce79b" } as never);
    const res = { cookie: vi.fn() };
    const caller = appRouter.createCaller({ req: { headers: {} } as never, res: res as never, user: null });
    await expect(caller.auth.localLogin({ username: "admin1", password: "1989" })).resolves.toEqual({ success: true, username: "admin1" });
    expect(res.cookie).toHaveBeenCalled();
  });
});
