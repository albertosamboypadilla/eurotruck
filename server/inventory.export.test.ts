import { describe, expect, it } from "vitest";
import { buildInventoryExportHtml, buildLowStockPurchaseRows, buildPhysicalInventoryExportHtml } from "../shared/inventoryExport";

describe("inventory export", () => {
  it("builds an Excel-compatible table with escaped cells", () => {
    const html = buildInventoryExportHtml(["SKU", "Nombre"], [["1.00001", "Filtro <nuevo>"]]);
    expect(html).toContain("<th>SKU</th>");
    expect(html).toContain("<td>1.00001</td>");
    expect(html).toContain("Filtro &lt;nuevo&gt;");
    expect(html).not.toContain("<nuevo>");
  });

  it("builds the physical inventory template with the reference layout", () => {
    const html = buildPhysicalInventoryExportHtml([
      { productNumber: "1.00001", description: "Filtro de prueba", counter: "admin1", unitQuantity: 4, reference: "00001", shelf: "G-02", tramo: "T-01", cost: "10.00", price: "15.00" },
    ], new Date("2026-09-03T21:10:10Z"));
    expect(html).toContain("EUROTRUCK SRL");
    expect(html).toContain("SISTEMA DE INVENTARIO");
    expect(html).toContain("NO. PRODUCTO");
    expect(html).toContain("CANTIDAD UNIDADES");
    expect(html).toContain("Filtro de prueba");
    expect(html).toContain("T-01");
    expect(html).toContain("G-02");
    expect(html).toContain("#1f497d");
    expect(html).toContain("colspan=\"11\"");
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
