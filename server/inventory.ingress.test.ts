import { describe, expect, it } from "vitest";
import { buildRecentIngressRow, normalizeIngressLimit } from "@shared/inventoryIngress";

describe("inventory recent ingress", () => {
  it("clamps the requested history size", () => {
    expect(normalizeIngressLimit(undefined)).toBe(50);
    expect(normalizeIngressLimit(0)).toBe(1);
    expect(normalizeIngressLimit(999)).toBe(200);
  });

  it("joins a scan with its current catalog identity", () => {
    const row = buildRecentIngressRow({ id: 4, inventoryItemId: 9, quantity: 2, tramo: "T-01", gondola: "G-02", countedBy: "admin1", createdAt: "2026-09-04T12:00:00.000Z" }, { id: 9, sku: "1.00123", name: "Bombilla H7", internalCode: "00421", barcode: "1234567890123" });
    expect(row).toMatchObject({ sku: "1.00123", name: "Bombilla H7", internalCode: "00421", barcode: "1234567890123", quantity: 2 });
  });
});
