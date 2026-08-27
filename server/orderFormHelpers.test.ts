import { describe, expect, it } from "vitest";
import { getOrderFormValidationError } from "@shared/orderFormHelpers";

describe("order form validation", () => {
  it("requires a cart item before allowing an order", () => {
    expect(getOrderFormValidationError({ company: "Flota Caribe", email: "compras@example.com", phone: "8095551234", itemCount: 0 })).toBe("Agrega al menos una pieza al carrito antes de generar la orden.");
  });

  it("accepts complete customer data with at least one item", () => {
    expect(getOrderFormValidationError({ company: "Flota Caribe", email: "compras@example.com", phone: "8095551234", itemCount: 1 })).toBeNull();
  });

  it("reports invalid email and missing customer fields", () => {
    expect(getOrderFormValidationError({ company: "Flota Caribe", email: "no-es-correo", phone: "8095551234", itemCount: 1 })).toBe("Ingresa un correo electrónico válido.");
    expect(getOrderFormValidationError({ company: "", email: "compras@example.com", phone: "8095551234", itemCount: 1 })).toBe("Escribe el nombre de la empresa o flota.");
    expect(getOrderFormValidationError({ company: "Flota Caribe", email: "compras@example.com", phone: "", itemCount: 1 })).toBe("Escribe el teléfono o WhatsApp del cliente.");
  });
});
