export type InventoryExportValue = string | number | null | undefined;

export type LowStockExportItem = {
  sku: string;
  name: string;
  totalQuantity: number;
  lastTramo?: string | null;
  lastGondola?: string | null;
  costPrice?: string | number | null;
  salePrice?: string | number | null;
  internalCode?: string | null;
  barcode?: string | null;
  gtins?: string[];
};

function escapeExcelCell(value: InventoryExportValue) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

export function buildInventoryExportHtml(headers: string[], rows: InventoryExportValue[][]) {
  const headerHtml = headers.map(header => `<th>${escapeExcelCell(header)}</th>`).join("");
  const bodyHtml = rows.map(row => `<tr>${row.map(cell => `<td>${escapeExcelCell(cell)}</td>`).join("")}</tr>`).join("");
  return `<html><head><meta charset="utf-8"></head><body><table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></body></html>`;
}

export function buildLowStockPurchaseRows(items: LowStockExportItem[], threshold: number): InventoryExportValue[][] {
  return items
    .filter(item => item.totalQuantity <= threshold)
    .map(item => [
      item.sku,
      item.name,
      item.totalQuantity,
      threshold,
      Math.max(0, threshold - item.totalQuantity),
      item.lastTramo || "",
      item.lastGondola || "",
      item.costPrice ?? "0.00",
      item.salePrice ?? "0.00",
      item.internalCode || "",
      item.barcode || "",
      item.gtins?.join(" · ") || "",
    ]);
}
