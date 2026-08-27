export function isInventoryAdmin(username?: string | null) {
  return username?.trim().toLowerCase() === "admin1";
}

export function isInventoryItemCounted(totalQuantity: number) {
  return totalQuantity > 0;
}

export function buildInventoryNotice(wasAlreadyCounted: boolean, addedQuantity: number, totalQuantity: number) {
  const addedLabel = addedQuantity === 1 ? "unidad" : "unidades";
  const totalLabel = totalQuantity === 1 ? "unidad" : "unidades";
  return wasAlreadyCounted
    ? `Artículo ya contado: se sumaron ${addedQuantity} ${addedLabel}. Total acumulado: ${totalQuantity} ${totalLabel}.`
    : `Artículo contado correctamente: ${totalQuantity} ${totalLabel}.`;
}

export function getInventoryScanLocation(tramo?: string | null, gondola?: string | null) {
  return {
    tramo: tramo?.trim() || "GENERAL",
    gondola: gondola?.trim() || "GENERAL",
  };
}
