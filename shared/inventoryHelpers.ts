export function isInventoryAdmin(username?: string | null) {
  return username?.trim().toLowerCase() === "admin1";
}

export function buildInventoryNotice(wasAlreadyCounted: boolean, addedQuantity: number, totalQuantity: number) {
  return wasAlreadyCounted
    ? `Artículo ya contado: se sumaron ${addedQuantity} unidades. Total acumulado: ${totalQuantity}.`
    : `Artículo contado correctamente: ${totalQuantity} unidad(es).`;
}
