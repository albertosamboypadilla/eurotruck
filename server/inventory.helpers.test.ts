import { describe, expect, it } from "vitest";
import { buildInventoryNotice, getInventoryScanLocation, isInventoryAdmin, isInventoryItemCounted, isInventorySaleConfirmationKey, rebuildInventoryAfterScanRemoval, shouldAutoRegisterInventoryScan } from "@shared/inventoryHelpers";

describe("inventory helpers", () => {
  it("allows only admin1 regardless of case and whitespace", () => {
    expect(isInventoryAdmin(" admin1 ")).toBe(true);
    expect(isInventoryAdmin("admin2")).toBe(false);
    expect(isInventoryAdmin(null)).toBe(false);
  });

  it("accepts only the configured sale confirmation key", () => {
    expect(isInventorySaleConfirmationKey("1989")).toBe(true);
    expect(isInventorySaleConfirmationKey("0000")).toBe(false);
    expect(isInventorySaleConfirmationKey("00000")).toBe(false);
  });

  it("marks only positive accumulated quantities as counted", () => {
    expect(isInventoryItemCounted(0)).toBe(false);
    expect(isInventoryItemCounted(1)).toBe(true);
    expect(isInventoryItemCounted(12)).toBe(true);
  });

  it("communicates a repeated count and the accumulated total", () => {
    expect(buildInventoryNotice(true, 3, 11)).toContain("Total acumulado: 11");
    expect(buildInventoryNotice(false, 1, 1)).toContain("contado correctamente");
  });

  it("starts automatic scanning only with a complete code and no pending mutation", () => {
    expect(shouldAutoRegisterInventoryScan(" 1234567890123 ", true, false)).toBe(true);
    expect(shouldAutoRegisterInventoryScan("SKU-1", true, false)).toBe(true);
    expect(shouldAutoRegisterInventoryScan("1234", false, false)).toBe(false);
    expect(shouldAutoRegisterInventoryScan("123456", false, true)).toBe(false);
  });

  it("arms automatic scanning when a reference, SKU, or GTIN was selected by click", () => {
    expect(shouldAutoRegisterInventoryScan("5.94224", false, false, "5.94224")).toBe(true);
    expect(shouldAutoRegisterInventoryScan(" 4006381333931 ", false, false, "4006381333931")).toBe(true);
    expect(shouldAutoRegisterInventoryScan("5.94224", false, true, "5.94224")).toBe(false);
  });

  it("normalizes an active location for every scan", () => {
    expect(getInventoryScanLocation("", " ")).toEqual({ tramo: "GENERAL", gondola: "GENERAL" });
    expect(getInventoryScanLocation(" T-03 ", " G-12 ")).toEqual({ tramo: "T-03", gondola: "G-12" });
  });

  it("recalculates total and last location when the latest scan is removed", () => {
    const result = rebuildInventoryAfterScanRemoval([
      { id: 11, quantity: 1, tramo: "T-02", gondola: "G-04", createdAt: "2026-08-28T10:02:00.000Z" },
      { id: 10, quantity: 1, tramo: "GENERAL", gondola: "GENERAL", createdAt: "2026-08-28T10:01:00.000Z" },
    ], 11);
    expect(result).toEqual({ found: true, removedQuantity: 1, totalQuantity: 1, lastTramo: "GENERAL", lastGondola: "GENERAL" });
  });

  it("sets the total to zero when the only scan is removed", () => {
    expect(rebuildInventoryAfterScanRemoval([{ id: 12, quantity: 1, tramo: "T-01", gondola: "G-01", createdAt: "2026-08-28T10:00:00.000Z" }], 12)).toMatchObject({ found: true, removedQuantity: 1, totalQuantity: 0, lastTramo: null, lastGondola: null });
  });
});
