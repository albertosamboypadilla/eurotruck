import { describe, expect, it } from "vitest";
import { buildWhatsAppOrderUrl, formatOrderNumber, isEurotruckAfterHours } from "./orderHelpers";

describe("Eurotruck order helpers", () => {
  it("formats the consecutive order number deterministically", () => {
    expect(formatOrderNumber(1, new Date("2026-01-02T00:00:00.000Z"))).toBe("ET-2026-000001");
    expect(formatOrderNumber(42, new Date("2026-01-02T00:00:00.000Z"))).toBe("ET-2026-000042");
  });
  it("identifies fixed weekday business hours in Santo Domingo", () => {
    expect(isEurotruckAfterHours(new Date("2026-08-26T14:00:00.000Z"))).toBe(false);
    expect(isEurotruckAfterHours(new Date("2026-08-26T22:30:00.000Z"))).toBe(true);
    expect(isEurotruckAfterHours(new Date("2026-08-29T15:00:00.000Z"))).toBe(true);
  });

  it("builds the exact WhatsApp URL used by the inbox", () => {
    const url = buildWhatsAppOrderUrl("(809) 555-1234", "ET-2026-000009", "Flota Caribe");
    expect(url).toBe(`https://wa.me/8095551234?text=${encodeURIComponent("Hola Eurotruck, damos seguimiento a la orden ET-2026-000009 de Flota Caribe.")}`);
  });
});
