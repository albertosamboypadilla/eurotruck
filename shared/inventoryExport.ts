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


export type PhysicalInventoryExportRow = {
  warehouse?: string;
  productNumber: string;
  description: string;
  counter?: string;
  majorPackageQuantity?: number | string | null;
  unitQuantity?: number | string | null;
  reference?: string | null;
  shelf?: string | null;
  tramo?: string | null;
  cost?: number | string | null;
  price?: number | string | null;
};

export function buildPhysicalInventoryExportHtml(rows: PhysicalInventoryExportRow[], generatedAt = new Date()) {
  const dateText = generatedAt.toLocaleString("es-DO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const headers = ["ALMACÉN", "NO. PRODUCTO", "DESCRIPCIÓN PRODUCTO", "CONTADOR", "CANTIDAD EMP. MAYOR", "CANTIDAD UNIDADES", "REFERENCIA", "ESTANTE", "TRAMO", "COSTO", "PRECIO"];
  const body = rows.map(row => `<tr>${[
    row.warehouse || "01",
    row.productNumber,
    row.description,
    row.counter || "admin1",
    row.majorPackageQuantity ?? "",
    row.unitQuantity ?? "",
    row.reference || "",
    row.shelf || "",
    row.tramo || "",
    row.cost ?? "0.00",
    row.price ?? "0.00",
  ].map(cell => `<td>${escapeExcelCell(cell)}</td>`).join("")}</tr>`).join("");
  const header = headers.map(value => `<th>${escapeExcelCell(value)}</th>`).join("");
  return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>
body{font-family:Calibri,Arial,sans-serif;color:#111;background:#fff}.report{border-collapse:collapse;table-layout:fixed;width:100%}.report col:nth-child(1){width:11%}.report col:nth-child(2){width:21%}.report col:nth-child(3){width:46%}.report col:nth-child(4){width:19%}.report col:nth-child(5){width:23%}.report col:nth-child(6){width:21%}.report col:nth-child(7){width:23%}.report col:nth-child(8){width:16%}.report col:nth-child(9){width:16%}.report col:nth-child(10){width:15%}.report col:nth-child(11){width:15%}.report td,.report th{border:1px solid #7f7f7f;height:20px;padding:3px 6px;vertical-align:middle;text-align:left}.report .title{background:#1b365d;color:#fff;font-size:14pt;font-weight:bold;height:26px}.report .subtitle{background:#1b365d;color:#fff;font-size:12pt;font-weight:bold;height:22px}.report .note{background:#d9e2f3;color:#1f1f1f;font-size:9pt;font-weight:bold;height:24px}.report th{background:#1f497d;color:#fff;font-size:9pt;font-weight:bold;white-space:normal}.report td{font-size:10pt}.report tbody tr:nth-child(even) td{background:#f2f6fb}.report .number{text-align:right;mso-number-format:"0.00"}</style></head><body><table class="report"><colgroup><col><col><col><col><col><col><col><col><col><col><col><col></colgroup><thead><tr><td class="title" colspan="11">EUROTRUCK SRL</td></tr><tr><td class="subtitle" colspan="11">SISTEMA DE INVENTARIO</td></tr><tr><td class="note" colspan="3">REPORTE DE PRODUCTOS PARA CONTEO FÍSICO DE FECHA ${escapeExcelCell(dateText)}</td><td class="note" colspan="3">ESTA COLUMNA ES OBLIGATORIA</td><td class="note" colspan="5">ESTAS TRES COLUMNAS SON INFORMATIVAS, NO SE CARGAN</td></tr><tr>${header}</tr></thead><tbody>${body}</tbody></table></body></html>`;
}
