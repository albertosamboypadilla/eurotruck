export type ZebraLabelInput = { internalCode: string; sku: string; name: string };
export type ZebraLabelFields = { internalCode: boolean; barcode: boolean; sku: boolean; name: boolean };
export const defaultZebraLabelFields: ZebraLabelFields = { internalCode: true, barcode: true, sku: true, name: true };

function zplText(value: string, maxLength: number) {
  return value.replace(/[^\x20-\x7EÁÉÍÓÚáéíóúÑñÜü¡¿.-]/g, " ").slice(0, maxLength).replace(/\^/g, " ").replace(/~/g, " ");
}

export function normalizeInternalLabelCode(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 5) return digits.padStart(5, "0");
  return digits.slice(-12);
}

export function buildZebraLabelZpl(input: ZebraLabelInput, fields: ZebraLabelFields = defaultZebraLabelFields) {
  const internalCode = normalizeInternalLabelCode(input.internalCode);
  const sku = zplText(input.sku, 30);
  const name = zplText(input.name, 38);
  const lines = ["^XA", "^CI28", "^PW600", "^LL320", "^LH0,0"];
  if (fields.internalCode) lines.push(`^FO35,25^A0N,34,34^FD${internalCode}^FS`);
  if (fields.barcode) lines.push(`^FO35,72^BY2,3,72^BCN,72,Y,N,N^FD${internalCode}^FS`);
  if (fields.sku) lines.push(`^FO35,175^A0N,26,26^FDSKU: ${sku}^FS`);
  if (fields.name) lines.push(`^FO35,215^A0N,25,25^FD${name}^FS`);
  lines.push("^XZ");
  return lines.join("\n");
}

export function buildZebraLabelSequence(startCode: string, quantity: number, sku: string, name: string, fields: ZebraLabelFields = defaultZebraLabelFields) {
  const start = Number(normalizeInternalLabelCode(startCode));
  if (!Number.isInteger(start) || start < 0) throw new Error("Código inicial inválido");
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) throw new Error("Cantidad de etiquetas inválida");
  return Array.from({ length: quantity }, (_, index) => buildZebraLabelZpl({ internalCode: String(start + index).padStart(5, "0"), sku, name }, fields)).join("\n");
}
