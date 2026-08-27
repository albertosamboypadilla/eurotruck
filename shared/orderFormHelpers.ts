export type OrderFormDraft = {
  company: string;
  email: string;
  phone: string;
  itemCount: number;
};

export function getOrderFormValidationError(draft: OrderFormDraft): string | null {
  if (!draft.company.trim()) return "Escribe el nombre de la empresa o flota.";
  if (!draft.email.trim()) return "Escribe el correo electrónico del cliente.";
  if (!/^\S+@\S+\.\S+$/.test(draft.email.trim())) return "Ingresa un correo electrónico válido.";
  if (!draft.phone.trim()) return "Escribe el teléfono o WhatsApp del cliente.";
  if (draft.itemCount < 1) return "Agrega al menos una pieza al carrito antes de generar la orden.";
  return null;
}
