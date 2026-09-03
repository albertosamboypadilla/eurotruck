import { describe, expect, it } from "vitest";
import { buildOrderPdf } from "./orderService";

describe("corporate quote PDF", () => {
  it("generates a valid PDF with priced and pending lines", async () => {
    const now = new Date("2026-09-02T14:00:00.000Z");
    const pdf = await buildOrderPdf({
      order: { id: 21, orderNumber: "ET-2026-000021", company: "Flota Caribe", email: "compras@example.com", phone: "8095551234", rnc: "131000001", truckBrand: "Scania", partsNote: "Confirmar entrega", notificationRecipients: "", afterHours: 0, status: "new", assignedAdmin: null, assignedAt: null, deletedAt: null, deletedBy: null, createdAt: now, updatedAt: now },
      items: [
        { id: 1, orderId: 21, productId: "p-1", sku: "1.00100", name: "Bombilla principal", quantity: 2, unitPrice: "1250.00", brand: "DT Spare Parts", application: "Scania", category: "Iluminación", image: null, sourceUrl: null },
        { id: 2, orderId: 21, productId: "p-2", sku: "1.00101", name: "Bombilla auxiliar", quantity: 1, unitPrice: "0.00", brand: "DT Spare Parts", application: "Volvo", category: "Iluminación", image: null, sourceUrl: null },
      ],
    });
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(pdf.length).toBeGreaterThan(2_000);
  });
});
