import { describe, expect, it, vi } from "vitest";

const { getLocalAdminByUsername } = vi.hoisted(() => ({ getLocalAdminByUsername: vi.fn(async () => undefined) }));
vi.mock("./db", () => ({ getLocalAdminByUsername, createOrder: vi.fn(), deleteOrder: vi.fn(), listOrders: vi.fn() }));

import { appRouter } from "./routers";

describe("local login procedure", () => {
  it("rejects invalid administrator credentials", async () => {
    const caller = appRouter.createCaller({ req: {} as never, res: {} as never, user: null });
    await expect(caller.auth.localLogin({ username: "not-an-admin", password: "wrong" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(getLocalAdminByUsername).toHaveBeenCalledWith("not-an-admin");
  });
});
