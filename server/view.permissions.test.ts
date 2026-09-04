import { describe, expect, it } from "vitest";
import { canViewInternalCatalogData } from "@shared/viewPermissions";

describe("catalog view permissions", () => {
  it("allows internal catalog data only for admin", () => {
    expect(canViewInternalCatalogData("admin")).toBe(true);
    expect(canViewInternalCatalogData("user")).toBe(false);
    expect(canViewInternalCatalogData(undefined)).toBe(false);
    expect(canViewInternalCatalogData(null)).toBe(false);
  });
});
