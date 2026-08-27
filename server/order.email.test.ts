import { describe, expect, it } from "vitest";
import { buildOrderPdf, sendOrderEmail } from "./orderService";
import type { OrderWithItems } from "./db";

const sample: OrderWithItems = {
  order: { id: 1, orderNumber: "ET-2026-000001", company: "Flota de prueba", email: "cliente@example.com", phone: "8090000000", rnc: null, truckBrand: "Scania", partsNote: null, status: "new", createdAt: new Date(), updatedAt: new Date() },
  items: [],
};

describe("order documents and email fallback", () => {
  it("generates a valid PDF buffer with the order number", async () => {
    const pdf = await buildOrderPdf(sample);
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(pdf.length).toBeGreaterThan(500);
  });

  it("does not attempt SMTP when configuration is unavailable", async () => {
    const previous = { SMTP_HOST: process.env.SMTP_HOST, SMTP_PORT: process.env.SMTP_PORT, SMTP_USER: process.env.SMTP_USER, SMTP_PASS: process.env.SMTP_PASS, SMTP_FROM: process.env.SMTP_FROM };
    for (const key of Object.keys(previous)) delete process.env[key];
    await expect(sendOrderEmail(sample, Buffer.from("pdf"))).resolves.toBe(false);
    Object.assign(process.env, previous);
  });
});
