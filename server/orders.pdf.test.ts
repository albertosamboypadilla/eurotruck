import { describe, expect, it, vi } from "vitest";

const { sample, getOrderWithItems } = vi.hoisted(() => {
  const sample = { order: { id: 12, orderNumber: "ET-2026-000012", company: "Flota Caribe", email: "cliente@example.com", phone: "8095551234", rnc: null, truckBrand: "Scania", partsNote: null, notificationRecipients: "", afterHours: 0, assignedAdmin: null, assignedAt: null, status: "new" as const, createdAt: new Date(), updatedAt: new Date() }, items: [{ id: 4, orderId: 12, productId: "p4", quantity: 3, sku: "DT-004", name: "Filtro de aire", brand: "DT Spare Parts", application: "Scania", category: "Motor", image: null, sourceUrl: null }] };
  return { sample, getOrderWithItems: vi.fn(async () => sample) };
});

vi.mock("./db", () => ({ getOrderWithItems, getLocalAdminByUsername: vi.fn(), listOrders: vi.fn(async () => []) }));

import { appRouter } from "./routers";

describe("orders.pdf", () => {
  it("regenerates a numbered PDF for an authenticated administrator", async () => {
    const admin = { id: 1, openId: "local:admin1", name: "admin1", email: null, loginMethod: "local", role: "admin" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
    const caller = appRouter.createCaller({ req: {} as never, res: {} as never, user: admin });
    const result = await caller.orders.pdf({ id: 12 });
    expect(getOrderWithItems).toHaveBeenCalledWith(12);
    expect(result.orderNumber).toBe("ET-2026-000012");
    expect(Buffer.from(result.pdfBase64, "base64").subarray(0, 4).toString()).toBe("%PDF");
  });
});
