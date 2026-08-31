import { describe, expect, it, vi } from "vitest";

const { sample, createOrder, archiveOrder } = vi.hoisted(() => {
  const sample = { order: { id: 9, orderNumber: "ET-2026-000009", company: "Flota Caribe", email: "cliente@example.com", phone: "8095551234", rnc: null, truckBrand: "Scania", partsNote: null, notificationRecipients: "eurotruckcxa@yahoo.com,albertosamboy89@gmail.com", afterHours: 1, status: "new" as const, deletedAt: null, deletedBy: null, createdAt: new Date(), updatedAt: new Date() }, items: [{ id: 1, orderId: 9, productId: "p1", sku: "DT-001", name: "Filtro de aceite", brand: "DT Spare Parts", application: "Scania", category: "Motor", image: null, sourceUrl: null }] };
  return { sample, createOrder: vi.fn(async () => sample), archiveOrder: vi.fn(async () => true) };
});
vi.mock("./db", () => ({ createOrder, archiveOrder, purgeDeletedOrder: vi.fn(), listDeletedOrders: vi.fn(async () => []), getLocalAdminByUsername: vi.fn(), listOrders: vi.fn(async () => []) }));

import { appRouter } from "./routers";

describe("order flow", () => {
  it("returns a numbered PDF as base64 and after-hours message", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T23:00:00.000Z"));
    const caller = appRouter.createCaller({ req: {} as never, res: {} as never, user: null });
    const result = await caller.orders.create({ company: "Flota Caribe", email: "cliente@example.com", phone: "8095551234", items: [{ productId: "p1", sku: "DT-001", name: "Filtro de aceite" }] });
    expect(result.orderNumber).toBe("ET-2026-000009");
    expect(Buffer.from(result.pdfBase64, "base64").subarray(0, 4).toString()).toBe("%PDF");
    expect(result.afterHoursMessage).toContain("Buenas tardes");
    vi.useRealTimers();
  });

  it("archives an order through the protected administrative action", async () => {
    const admin = { id: 1, openId: "local:admin1", name: "admin1", email: null, loginMethod: "local", role: "admin" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
    const caller = appRouter.createCaller({ req: {} as never, res: {} as never, user: admin });
    await expect(caller.orders.remove({ id: 9 })).resolves.toEqual({ success: true });
    expect(archiveOrder).toHaveBeenCalledWith(9, "admin1");
  });
});
