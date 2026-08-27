import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

const baseContext = { req: {} as never, res: {} as never };

describe("order inbox authorization", () => {
  it("rejects listing orders without an administrator session", async () => {
    const caller = appRouter.createCaller({ ...baseContext, user: null });
    await expect(caller.orders.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects deleting orders without an administrator session", async () => {
    const caller = appRouter.createCaller({ ...baseContext, user: null });
    await expect(caller.orders.remove({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects taking orders without an administrator session", async () => {
    const caller = appRouter.createCaller({ ...baseContext, user: null });
    await expect(caller.orders.take({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects taking orders for an authenticated non-admin user", async () => {
    const caller = appRouter.createCaller({ ...baseContext, user: { id: 2, openId: "user-2", name: "Cliente", email: "cliente@example.com", loginMethod: "oauth", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } });
    await expect(caller.orders.take({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
