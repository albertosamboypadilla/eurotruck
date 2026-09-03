export type InventoryExportValue = string | number | null | undefined;

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
