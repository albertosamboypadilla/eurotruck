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
