import { beforeEach, describe, expect, it, vi } from "vitest";
import { inventoryItems, inventoryScans } from "../drizzle/schema";

const { fakeDb, state } = vi.hoisted(() => {
  const state: { item: any; scans: any[]; insertCount: number; scanSelectCalls: number; targetScanId: number } = { item: undefined, scans: [], insertCount: 0, scanSelectCalls: 0, targetScanId: 0 };
  const tx = {
    select: () => ({
      from: (table: unknown) => {
        const result = {
          limit: async () => {
            if (table === inventoryItems) return state.item ? [state.item] : [];
            state.scanSelectCalls += 1;
            if (state.scanSelectCalls === 1) return state.scans.filter(scan => scan.id === state.targetScanId);
            return [...state.scans];
          },
          orderBy: async () => [...state.scans],
        };
        return { where: () => result, orderBy: async () => [...state.scans] };
      },
    }),
    insert: (table: unknown) => ({
      values: (payload: any) => ({
        execute: async () => {
          if (table === inventoryItems && state.insertCount === 0) {
            state.item = { id: 7, ...payload, createdAt: new Date(), updatedAt: new Date() };
            state.insertCount += 1;
            return [{ insertId: 7 }];
          }
          state.scans.push({ id: state.scans.length + 1, inventoryItemId: state.item?.id, ...payload });
          state.insertCount += 1;
          return [{ insertId: state.scans.at(-1)?.id }];
        },
      }),
    }),
    delete: (table: unknown) => ({
      where: async () => {
        if (table === inventoryScans) state.scans = state.scans.filter(scan => scan.id !== state.targetScanId);
        return { affectedRows: 1 };
      },
    }),
    update: () => ({
      set: (payload: any) => ({
        where: async () => {
          state.item = { ...state.item, ...payload, updatedAt: new Date() };
          return { affectedRows: 1 };
        },
      }),
    }),
  };
  const fakeDb = { transaction: async (callback: (transaction: typeof tx) => unknown) => callback(tx) };
  return { fakeDb, state };
});

vi.mock("drizzle-orm/mysql2", () => ({ drizzle: vi.fn(() => fakeDb) }));

import { deleteInventoryScan, recordInventoryCount } from "./db";

describe("inventory persistence", () => {
  beforeEach(() => {
    state.item = undefined;
    state.scans.length = 0;
    state.insertCount = 0;
    state.scanSelectCalls = 0;
    state.targetScanId = 0;
    process.env.DATABASE_URL = "mysql://inventory-test";
  });

  it("acumula un segundo conteo y conserva cada scan con su ubicación", async () => {
    const first = await recordInventoryCount({ productId: "p-1", sku: "SKU-1", name: "Filtro", internalCode: "00042", barcode: "1234567890123", quantity: 4, tramo: "A", gondola: "G1", countedBy: "admin1" });
    const second = await recordInventoryCount({ productId: "p-1", sku: "SKU-1", name: "Filtro", quantity: 3, tramo: "B", gondola: "G2", countedBy: "admin1" });

    expect(first.totalQuantity).toBe(4);
    expect(first.wasAlreadyCounted).toBe(false);
    expect(second.totalQuantity).toBe(7);
    expect(second.wasAlreadyCounted).toBe(true);
    expect(state.item.totalQuantity).toBe(7);
    expect(state.item.internalCode).toBe("00042");
    expect(state.item.barcode).toBe("1234567890123");
    expect(state.item.lastTramo).toBe("B");
    expect(state.item.lastGondola).toBe("G2");
    expect(state.scans).toHaveLength(2);
    expect(state.scans.map(scan => [scan.quantity, scan.tramo, scan.gondola])).toEqual([[4, "A", "G1"], [3, "B", "G2"]]);
  });

  it("suma una unidad por cada lectura automática repetida", async () => {
    const first = await recordInventoryCount({ productId: "p-scan", sku: "SCAN-1", name: "Filtro escaneado", quantity: 1, tramo: "GENERAL", gondola: "GENERAL", countedBy: "admin1" });
    const second = await recordInventoryCount({ productId: "p-scan", sku: "SCAN-1", name: "Filtro escaneado", quantity: 1, tramo: "GENERAL", gondola: "GENERAL", countedBy: "admin1" });

    expect(first.totalQuantity).toBe(1);
    expect(second.totalQuantity).toBe(2);
    expect(second.wasAlreadyCounted).toBe(true);
    expect(state.scans.map(scan => scan.quantity)).toEqual([1, 1]);
  });

  it("elimina la segunda lectura y restaura la última ubicación anterior", async () => {
    await recordInventoryCount({ productId: "p-delete", sku: "DELETE-1", name: "Filtro para corregir", quantity: 1, tramo: "GENERAL", gondola: "GENERAL", countedBy: "admin1" });
    await recordInventoryCount({ productId: "p-delete", sku: "DELETE-1", name: "Filtro para corregir", quantity: 1, tramo: "T-02", gondola: "G-04", countedBy: "admin1" });
    state.targetScanId = 2;
    state.scanSelectCalls = 0;

    const result = await deleteInventoryScan(2);

    expect(result).toMatchObject({ found: true, removedQuantity: 1, totalQuantity: 1, lastTramo: "GENERAL", lastGondola: "GENERAL" });
    expect(state.scans).toHaveLength(1);
    expect(state.item.totalQuantity).toBe(1);
    expect(state.item.lastTramo).toBe("GENERAL");
    expect(state.item.lastGondola).toBe("GENERAL");
  });
});
