export type InventoryIngressScan = {
  id: number;
  inventoryItemId: number;
  quantity: number;
  tramo: string;
  gondola: string;
  countedBy: string;
  createdAt: string | Date;
};

export type InventoryIngressItem = {
  id: number;
  sku: string;
  name: string;
  internalCode?: string | null;
  barcode?: string | null;
};

export function normalizeIngressLimit(limit?: number) {
  return Math.min(Math.max(Math.trunc(limit ?? 50), 1), 200);
}

export function buildRecentIngressRow(scan: InventoryIngressScan, item?: InventoryIngressItem) {
  return {
    ...scan,
    sku: item?.sku || "—",
    name: item?.name || "Artículo no disponible",
    internalCode: item?.internalCode || null,
    barcode: item?.barcode || null,
  };
}
