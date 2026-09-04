import { describe, expect, it } from "vitest";
import { buildInventoryExportHtml, buildLowStockPurchaseRows } from "../shared/inventoryExport";

describe("inventory export", () => {
  it("builds an Excel-compatible table with escaped cells", () => {
    const html = buildInventoryExportHtml(["SKU", "Nombre"], [["1.00001", "Filtro <nuevo>"]]);
    expect(html).toContain("<th>SKU</th>");
    expect(html).toContain("<td>1.00001</td>");
    expect(html).toContain("Filtro &lt;nuevo&gt;");
    expect(html).not.toContain("<nuevo>");
  });

  it("includes zero-stock products and calculates purchase units", () => {
    const rows = buildLowStockPurchaseRows([
      { sku: "1.00001", name: "Filtro", totalQuantity: 0, lastTramo: "T-01", lastGondola: "G-02", internalCode: "00001", gtins: ["1234567890123"] },
      { sku: "1.00002", name: "Bombilla", totalQuantity: 2 },
      { sku: "1.00003", name: "Sin alerta", totalQuantity: 4 },
    ], 3);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual(["1.00001", "Filtro", 0, 3, 3, "T-01", "G-02", "0.00", "0.00", "00001", "", "1234567890123"]);
    expect(rows[1]?.[4]).toBe(1);
  });
});
