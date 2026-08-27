import { describe, expect, it } from "vitest";
import { buildInventoryNotice, isInventoryAdmin } from "@shared/inventoryHelpers";

describe("inventory helpers", () => {
  it("allows only admin1 regardless of case and whitespace", () => {
    expect(isInventoryAdmin(" admin1 ")).toBe(true);
    expect(isInventoryAdmin("admin2")).toBe(false);
    expect(isInventoryAdmin(null)).toBe(false);
  });

  it("communicates a repeated count and the accumulated total", () => {
    expect(buildInventoryNotice(true, 3, 11)).toContain("Total acumulado: 11");
    expect(buildInventoryNotice(false, 1, 1)).toContain("contado correctamente");
  });
});
