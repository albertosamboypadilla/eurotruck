import { beforeEach, describe, expect, it, vi } from "vitest";
import { inventoryItems } from "../drizzle/schema";

const { fakeDb, state } = vi.hoisted(() => {
  const state: { item: any; scans: any[]; insertCount: number } = { item: undefined, scans: [], insertCount: 0 };
  const tx = {
    select: () => ({
      from: (table: unknown) => ({
        where: () => ({
          limit: async () => table === inventoryItems && state.item ? [state.item] : [],
        }),
      }),
    }),
    insert: (table: unknown) => ({
      values: (payload: any) => ({
        execute: async () => {
          if (table === inventoryItems && state.insertCount === 0) {
            state.item = { id: 7, ...payload, createdAt: new Date(), updatedAt: new Date() };
            state.insertCount += 1;
            return [{ insertId: 7 }];
          }
          state.scans.push(payload);
          state.insertCount += 1;
          return [{ insertId: state.scans.length }];
        },
      }),
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

import { recordInventoryCount } from "./db";

describe("recordInventoryCount", () => {
  beforeEach(() => {
    state.item = undefined;
    state.scans.length = 0;
    state.insertCount = 0;
    process.env.DATABASE_URL = "mysql://inventory-test";
  });

  it("acumula un segundo conteo y conserva cada scan con su ubicación", async () => {
    const first = await recordInventoryCount({ productId: "p-1", sku: "SKU-1", name: "Filtro", quantity: 4, tramo: "A", gondola: "G1", countedBy: "admin1" });
    const second = await recordInventoryCount({ productId: "p-1", sku: "SKU-1", name: "Filtro", quantity: 3, tramo: "B", gondola: "G2", countedBy: "admin1" });

    expect(first.totalQuantity).toBe(4);
    expect(first.wasAlreadyCounted).toBe(false);
    expect(second.totalQuantity).toBe(7);
    expect(second.wasAlreadyCounted).toBe(true);
    expect(state.item.totalQuantity).toBe(7);
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
});
