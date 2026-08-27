export type GtinMapEntry = {
  sku: string;
  gtins: string[];
};

export type GtinMap = Record<string, GtinMapEntry>;

export function normalizeCatalogIdentifier(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, "").toLowerCase();
}

export function normalizeGtins(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map(item => String(item).trim()).filter(Boolean)));
}

export function getGtinsForSku(sku: unknown, gtinMap: GtinMap): string[] {
  return normalizeGtins(gtinMap[normalizeCatalogIdentifier(sku)]?.gtins);
}

export function attachGtins<T extends { sku?: string; gtins?: string[] }>(product: T, gtinMap: GtinMap): T {
  const gtins = normalizeGtins([...(product.gtins ?? []), ...getGtinsForSku(product.sku, gtinMap)]);
  return gtins.length ? { ...product, gtins } : product;
}

export function productMatchesCatalogQuery(product: {
  id?: string;
  sku?: string;
  name?: string;
  description?: string;
  brand?: string;
  application?: string;
  gtins?: string[];
}, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  const exactIdentifiers = [product.sku, product.id, ...(product.gtins ?? [])].map(normalizeCatalogIdentifier);
  if (exactIdentifiers.includes(normalizeCatalogIdentifier(query))) return true;
  return [product.sku, product.id, product.name, product.description, product.brand, product.application, ...(product.gtins ?? [])]
    .some(value => String(value ?? "").toLowerCase().includes(normalizedQuery));
}
