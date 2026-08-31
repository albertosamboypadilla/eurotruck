import { describe, expect, it } from "vitest";
import { buildZebraLabelSequence, buildZebraLabelZpl, normalizeInternalLabelCode } from "./zebraLabel";

describe("zebra labels", () => {
  it("normalizes internal codes to at least five digits", () => {
    expect(normalizeInternalLabelCode("42")).toBe("00042");
    expect(normalizeInternalLabelCode("abc123")).toBe("00123");
  });

  it("includes only internal code, SKU and article name in ZPL", () => {
    const zpl = buildZebraLabelZpl({ internalCode: "42", sku: "1.00739", name: "Junta tórica" });
    expect(zpl).toContain("^FD00042^FS");
    expect(zpl).toContain("SKU: 1.00739");
    expect(zpl).toContain("Junta tórica");
    expect(zpl).toContain("^XA");
    expect(zpl).toContain("^XZ");
  });

  it("builds a sequential label batch", () => {
    const batch = buildZebraLabelSequence("99", 3, "SKU-1", "Filtro");
    expect(batch.match(/\^FD\d{5}\^FS/g)).toEqual(["^FD00099^FS", "^FD00100^FS", "^FD00101^FS"]);
  });
});
