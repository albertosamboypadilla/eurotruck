import { describe, expect, it } from "vitest";
import { buildInventoryExportHtml } from "../shared/inventoryExport";

describe("inventory export", () => {
  it("builds an Excel-compatible table with escaped cells", () => {
    const html = buildInventoryExportHtml(["SKU", "Nombre"], [["1.00001", "Filtro <nuevo>"]]);
    expect(html).toContain("<th>SKU</th>");
    expect(html).toContain("<td>1.00001</td>");
    expect(html).toContain("Filtro &lt;nuevo&gt;");
    expect(html).not.toContain("<nuevo>");
  });
});

  it("includes audit fields for detailed sales history rows", () => {
    const html = buildInventoryExportHtml(
      ["SKU / DT Spare Parts", "Cantidad descontada", "Fecha y hora local", "Fecha y hora UTC", "Usuario", "Origen"],
      [["1.21574", 2, "03/09/26, 10:30", "2026-09-03T14:30:00.000Z", "admin1", "manual"]],
    );
    expect(html).toContain("Fecha y hora UTC");
    expect(html).toContain("2026-09-03T14:30:00.000Z");
    expect(html).toContain("admin1");
    expect(html).toContain("manual");
    expect(html).toContain("<td>2</td>");
  });
