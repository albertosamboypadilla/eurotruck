import { describe, expect, it } from "vitest";
import { attachGtins, getGtinsForSku, normalizeCatalogIdentifier, productMatchesCatalogQuery, type GtinMap } from "@shared/gtinHelpers";

const gtinMap: GtinMap = {
  "1.33171": { sku: "1.33171", gtins: ["4070174101335", "4070174101335"] },
};

const product = {
  id: "103-1.33171",
  sku: "1.33171",
  name: "Pistón con camisa",
  description: "DT Spare Parts 1.33171 Pistón con camisa",
  brand: "DT Spare Parts",
  application: "Scania",
};

describe("GTIN catalog helpers", () => {
  it("normalizes identifiers without changing meaningful punctuation", () => {
    expect(normalizeCatalogIdentifier(" 1.33171 ")).toBe("1.33171");
    expect(normalizeCatalogIdentifier(" 4070174101335 ")).toBe("4070174101335");
  });

  it("attaches and deduplicates all GTINs for a SKU", () => {
    expect(attachGtins(product, gtinMap).gtins).toEqual(["4070174101335"]);
    expect(getGtinsForSku("1.33171", gtinMap)).toEqual(["4070174101335"]);
  });

  it("matches a product by exact GTIN while preserving its original SKU", () => {
    const enriched = attachGtins(product, gtinMap);
    expect(productMatchesCatalogQuery(enriched, "4070174101335")).toBe(true);
    expect(enriched.sku).toBe("1.33171");
  });

  it("matches a product by a second GTIN and rejects an unrelated code", () => {
    const enriched = attachGtins(product, { "1.33171": { sku: "1.33171", gtins: ["4070174101335", "4070174101336"] } });
    expect(productMatchesCatalogQuery(enriched, "4070174101336")).toBe(true);
    expect(productMatchesCatalogQuery(enriched, "4070174101999")).toBe(false);
  });

  it("matches a partial reference and does not invent a GTIN when none is imported", () => {
    const withoutGtin = { ...product };
    expect(productMatchesCatalogQuery(withoutGtin, "1.331")).toBe(true);
    expect(productMatchesCatalogQuery(withoutGtin, "4070174101335")).toBe(false);
    expect(attachGtins(withoutGtin, {}).gtins).toBeUndefined();
  });
});
