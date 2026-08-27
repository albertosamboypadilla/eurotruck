import { describe, expect, it } from "vitest";
import { buildInventoryNotice, getInventoryScanLocation, isInventoryAdmin, isInventoryItemCounted } from "@shared/inventoryHelpers";

describe("inventory helpers", () => {
  it("allows only admin1 regardless of case and whitespace", () => {
    expect(isInventoryAdmin(" admin1 ")).toBe(true);
    expect(isInventoryAdmin("admin2")).toBe(false);
    expect(isInventoryAdmin(null)).toBe(false);
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

  it("normalizes an active location for every scan", () => {
    expect(getInventoryScanLocation("", " ")).toEqual({ tramo: "GENERAL", gondola: "GENERAL" });
    expect(getInventoryScanLocation(" T-03 ", " G-12 ")).toEqual({ tramo: "T-03", gondola: "G-12" });
  });
});
