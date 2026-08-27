import { describe, expect, it } from "vitest";
import { buildOrderPdf } from "./orderService";
import type { OrderWithItems } from "./db";

const sample: OrderWithItems = {
  order: { id: 1, orderNumber: "ET-2026-000001", company: "Flota de prueba", email: "cliente@example.com", phone: "8090000000", rnc: null, truckBrand: "Scania", partsNote: null, notificationRecipients: "", afterHours: 0, assignedAdmin: null, assignedAt: null, status: "new", createdAt: new Date(), updatedAt: new Date() },
  items: [],
};

describe("manual order PDF", () => {
  it("generates a downloadable PDF without email configuration", async () => {
    const pdf = await buildOrderPdf(sample);
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(pdf.length).toBeGreaterThan(500);
  });
});
