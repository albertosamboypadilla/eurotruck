import { describe, expect, it, vi } from "vitest";

const { claimOrder } = vi.hoisted(() => ({ claimOrder: vi.fn() }));
vi.mock("./db", () => ({ claimOrder, createOrder: vi.fn(), archiveOrder: vi.fn(), purgeDeletedOrder: vi.fn(), listDeletedOrders: vi.fn(), getLocalAdminByUsername: vi.fn(), listOrders: vi.fn() }));

import { appRouter } from "./routers";

const admin = { id: 1, openId: "local:admin1", name: "admin1", email: null, loginMethod: "local", role: "admin" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

describe("taking open orders", () => {
  it("allows the first administrator and rejects a second claim", async () => {
    claimOrder.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const caller = appRouter.createCaller({ req: {} as never, res: {} as never, user: admin });
    await expect(caller.orders.take({ id: 7 })).resolves.toEqual({ success: true });
    await expect(caller.orders.take({ id: 7 })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(claimOrder).toHaveBeenNthCalledWith(1, 7, "admin1");
    expect(claimOrder).toHaveBeenNthCalledWith(2, 7, "admin1");
  });
});
