import { describe, expect, it } from "vitest";
import { findInventoryCatalogProduct, getInventorySearchShardKeys, type InventoryCatalogProduct } from "@shared/inventoryCatalog";

describe("inventory catalog helpers", () => {
  it("selects only the numeric shard for a scannable reference", () => {
    expect(getInventorySearchShardKeys("1.00739")).toEqual(["1"]);
  });

  it("uses all catalog shards for description searches", () => {
    expect(getInventorySearchShardKeys("junta tórica")).toHaveLength(11);
  });

  it("matches the same sku or description fields used by the catalog", () => {
    const items: InventoryCatalogProduct[] = [
      { id: "55-1.00739", sku: "1.00739", name: "Junta tórica", description: "Junta tórica para aplicación Iveco", brand: "DT Spare Parts", application: "Iveco", image: "https://example.test/1.00739.jpg" },
    ];
    expect(findInventoryCatalogProduct(items, "1.00739")?.image).toContain("1.00739.jpg");
    expect(findInventoryCatalogProduct(items, "junta")?.brand).toBe("DT Spare Parts");
    expect(findInventoryCatalogProduct(items, "junta")?.description).toBe("Junta tórica para aplicación Iveco");
  });
});

  it("matches internal Zebra code and scanned barcode", () => {
    const items: InventoryCatalogProduct[] = [{ id: "55-1.00739", sku: "1.00739", internalCode: "00042", barcode: "4070174006982", name: "Junta tórica", brand: "DT Spare Parts" }];
    expect(findInventoryCatalogProduct(items, "00042")?.sku).toBe("1.00739");
    expect(findInventoryCatalogProduct(items, "4070174006982")?.sku).toBe("1.00739");
  });
