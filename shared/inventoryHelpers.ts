export const INVENTORY_SALE_CONFIRMATION_KEY = "1989";

export function isInventoryAdmin(username?: string | null) {
  return username?.trim().toLowerCase() === "admin1";
}

export function isInventorySaleConfirmationKey(value: string) {
  return value === INVENTORY_SALE_CONFIRMATION_KEY;
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

export type InventoryScanSnapshot = {
  id: number;
  quantity: number;
  tramo: string;
  gondola: string;
  createdAt: Date | string;
};

export function rebuildInventoryAfterScanRemoval(scans: InventoryScanSnapshot[], scanId: number) {
  const ordered = [...scans].sort((left, right) => {
    const dateDifference = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    return dateDifference || right.id - left.id;
  });
  const removed = ordered.find(scan => scan.id === scanId);
  if (!removed) {
    return {
      found: false as const,
      removedQuantity: 0,
      totalQuantity: ordered.reduce((total, scan) => total + scan.quantity, 0),
      lastTramo: ordered[0]?.tramo ?? null,
      lastGondola: ordered[0]?.gondola ?? null,
    };
  }
  const remaining = ordered.filter(scan => scan.id !== scanId);
  const latest = remaining[0];
  return {
    found: true as const,
    removedQuantity: removed.quantity,
    totalQuantity: remaining.reduce((total, scan) => total + scan.quantity, 0),
    lastTramo: latest?.tramo ?? null,
    lastGondola: latest?.gondola ?? null,
  };
}
