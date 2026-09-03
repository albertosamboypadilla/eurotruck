export type InventoryCatalogProduct = {
  id: string;
  sku: string;
  name: string;
  description?: string;
  brand?: string;
  application?: string;
  image?: string;
  url?: string;
  gtins?: string[];
  internalCode?: string | null;
  barcode?: string | null;
  [key: string]: unknown;
};

export const inventoryCatalogShardKeys = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "s"] as const;

export function getInventorySearchShardKeys(query: string): string[] {
  const normalized = query.trim().toLowerCase();
  const first = normalized.slice(0, 1);
  if (/^[a-z0-9.-]+$/i.test(normalized) && inventoryCatalogShardKeys.includes(first as (typeof inventoryCatalogShardKeys)[number])) {
    return [first];
  }
  return [...inventoryCatalogShardKeys];
}

export function findInventoryCatalogProduct(items: InventoryCatalogProduct[], query: string): InventoryCatalogProduct | undefined {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return undefined;
  return items.find(item => {
    const identifiers = [item.sku, item.id, item.internalCode, item.barcode, ...(Array.isArray(item.gtins) ? item.gtins : [])].map(value => String(value ?? "").trim().toLowerCase());
    return identifiers.includes(normalized) || [item.name, item.description, item.brand, item.application].some(value => String(value ?? "").toLowerCase().includes(normalized));
  });
}
