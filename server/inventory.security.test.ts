import { describe, expect, it, vi } from "vitest";

const { addInventoryGtin, createInventoryItem, deleteInventoryArticle, deleteInventoryScan, listDailyInventorySales, listInventory, listInventoryGtins, listPublicInventoryGtins, listPublicInventoryLocations, listTopSoldInventory, recordInventoryCount, recordInventorySale, updateInventoryPricing } = vi.hoisted(() => ({
  addInventoryGtin: vi.fn(async (input: any) => ({ id: 4, ...input })),
  createInventoryItem: vi.fn(async (input: any, countedBy: string) => ({ id: 1, productId: "custom-1", ...input, totalQuantity: 0, countedBy })),
  deleteInventoryArticle: vi.fn(async (productId: string) => ({ productId, sku: "SKU-1", name: "Filtro", removedQuantity: 2 })),
  deleteInventoryScan: vi.fn(async (scanId: number) => ({ found: true, scanId, removedQuantity: 1, totalQuantity: 1, lastTramo: "GENERAL", lastGondola: "GENERAL" })),
  listDailyInventorySales: vi.fn(async () => [{ id: 1, productId: "p-1", sku: "SKU-1", name: "Filtro", quantity: 2, dailyNumber: 1, unitPrice: 1450, finalCost: 2900, source: "scan", createdAt: new Date() }]),
  listInventory: vi.fn(async () => []),
  listInventoryGtins: vi.fn(async () => [{ id: 4, productId: "p-1", sku: "SKU-1", gtin: "1234567890123", addedBy: "admin1", createdAt: new Date() }]),
  listPublicInventoryGtins: vi.fn(async () => [{ productId: "p-1", sku: "SKU-1", gtin: "1234567890123" }]),
  listPublicInventoryLocations: vi.fn(async () => [{ productId: "p-public", totalQuantity: 8, lastTramo: "T-01", lastGondola: "G-02", salePrice: "1450.00" }]),
  recordInventoryCount: vi.fn(async (input: any) => ({ ...input, totalQuantity: input.quantity, wasAlreadyCounted: false })),
  recordInventorySale: vi.fn(async (input: any) => ({ sku: input.sku, totalQuantity: 4, soldQuantity: input.quantity })),
  listTopSoldInventory: vi.fn(async () => [{ productId: "p-1", sku: "SKU-1", name: "Filtro", soldQuantity: 5 }]),
  updateInventoryPricing: vi.fn(async (input: any) => ({ id: 1, ...input, totalQuantity: 0 })),
}));

vi.mock("./db", () => ({
  addInventoryGtin,
  createInventoryItem,
  deleteInventoryArticle,
  deleteInventoryScan,
  listDailyInventorySales,
  listInventory,
  listInventoryGtins,
  listPublicInventoryGtins,
  listPublicInventoryLocations,
  listTopSoldInventory,
  recordInventoryCount,
  recordInventorySale,
  updateInventoryPricing,
  updateQuoteItems: vi.fn(),
  claimOrder: vi.fn(),
  createOrder: vi.fn(),
  archiveOrder: vi.fn(),
  purgeDeletedOrder: vi.fn(),
  listDeletedOrders: vi.fn(),
  getLocalAdminByUsername: vi.fn(),
  getOrderWithItems: vi.fn(),
  listOrders: vi.fn(),
}));
vi.mock("./orderService", () => ({ buildOrderPdf: vi.fn(async () => Buffer.from("%PDF-test")) }));

import { appRouter } from "./routers";

const context = (user: any) => ({ req: {} as never, res: {} as never, user });
const admin1 = { id: -1, openId: "local:admin1", name: "admin1", email: null, loginMethod: "local", role: "admin" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const admin2 = { ...admin1, id: -2, openId: "local:admin2", name: "admin2" };
const input = { productId: "p-1", sku: "SKU-1", name: "Filtro", quantity: 2, tramo: "A", gondola: "G1" };

describe("inventory procedures", () => {
  it("expone al catálogo público existencia, ubicación y venta final", async () => {
    await expect(appRouter.createCaller(context(undefined)).inventory.publicLocations()).resolves.toEqual([{ productId: "p-public", totalQuantity: 8, lastTramo: "T-01", lastGondola: "G-02", salePrice: "1450.00" }]);
    expect(listPublicInventoryLocations).toHaveBeenCalledTimes(1);
  });

  it("expone alias GTIN mínimos al catálogo público", async () => {
    await expect(appRouter.createCaller(context(undefined)).inventory.publicGtins()).resolves.toEqual([{ productId: "p-1", sku: "SKU-1", gtin: "1234567890123" }]);
    expect(listPublicInventoryGtins).toHaveBeenCalledTimes(1);
  });

  it("permite listar a admin1 y rechaza admin2", async () => {
    await expect(appRouter.createCaller(context(admin1)).inventory.list()).resolves.toEqual([]);
    await expect(appRouter.createCaller(context(admin2)).inventory.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(listInventory).toHaveBeenCalledTimes(1);
  });

  it("permite consultar y agregar GTIN a admin1 y rechaza admin2", async () => {
    await expect(appRouter.createCaller(context(admin1)).inventory.gtins()).resolves.toHaveLength(1);
    const gtinInput = { productId: "p-1", sku: "SKU-1", gtin: "1234567890123" };
    await expect(appRouter.createCaller(context(admin1)).inventory.addGtin(gtinInput)).resolves.toMatchObject({ gtin: gtinInput.gtin, addedBy: "admin1" });
    expect(addInventoryGtin).toHaveBeenCalledWith({ ...gtinInput, addedBy: "admin1" });
    await expect(appRouter.createCaller(context(admin2)).inventory.gtins()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context(admin2)).inventory.addGtin(gtinInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("permite agregar un artículo a admin1 e inyecta su identidad", async () => {
    const newArticle = { sku: "NUEVO-1", name: "Artículo nuevo", description: "Descripción nueva", brand: "Eurotruck", application: "Iveco" };
    await expect(appRouter.createCaller(context(admin1)).inventory.create(newArticle)).resolves.toMatchObject({ productId: "custom-1", countedBy: "admin1" });
    expect(createInventoryItem).toHaveBeenCalledWith({ ...newArticle, costPrice: "0", salePrice: "0" }, "admin1");
    await expect(appRouter.createCaller(context(admin2)).inventory.create(newArticle)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("permite registrar a admin1, inyecta su identidad y rechaza admin2", async () => {
    await expect(appRouter.createCaller(context(admin1)).inventory.record(input)).resolves.toMatchObject({ totalQuantity: 2 });
    expect(recordInventoryCount).toHaveBeenCalledWith({ ...input, countedBy: "admin1" });
    await expect(appRouter.createCaller(context(admin2)).inventory.record(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(recordInventoryCount).toHaveBeenCalledTimes(1);
  });

  it("permite guardar costo y venta a admin1 y rechaza admin2", async () => {
    const pricing = { productId: "p-1", sku: "SKU-1", name: "Filtro", costPrice: 900, salePrice: 1450 };
    await expect(appRouter.createCaller(context(admin1)).inventory.updatePricing(pricing)).resolves.toMatchObject({ costPrice: "900.00", salePrice: "1450.00" });
    expect(updateInventoryPricing).toHaveBeenCalledWith({ ...pricing, costPrice: "900.00", salePrice: "1450.00" });
    await expect(appRouter.createCaller(context(admin2)).inventory.updatePricing(pricing)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("permite registrar una salida a admin1 y rechaza admin2", async () => {
    await expect(appRouter.createCaller(context(admin1)).inventory.recordSale({ sku: "SKU-1", quantity: 1, confirmationKey: "1989", source: "scan" })).resolves.toMatchObject({ sku: "SKU-1", totalQuantity: 4 });
    expect(recordInventorySale).toHaveBeenCalledWith({ sku: "SKU-1", quantity: 1, confirmationKey: "1989", source: "scan", movedBy: "admin1" });
    await expect(appRouter.createCaller(context(admin2)).inventory.recordSale({ sku: "SKU-1", quantity: 1, confirmationKey: "1989", source: "scan" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("permite consultar Venta del día a admin1 y rechaza admin2", async () => {
    await expect(appRouter.createCaller(context(admin1)).inventory.dailySales({ date: "2026-09-04" })).resolves.toMatchObject([{ sku: "SKU-1", dailyNumber: 1, finalCost: 2900 }]);
    expect(listDailyInventorySales).toHaveBeenCalledWith("2026-09-04");
    await expect(appRouter.createCaller(context(admin2)).inventory.dailySales({ date: "2026-09-04" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("permite retirar el artículo completo a admin1 con confirmación y rechaza admin2", async () => {
    await expect(appRouter.createCaller(context(admin1)).inventory.deleteArticle({ productId: "p-1", confirmation: "ELIMINAR" })).resolves.toMatchObject({ sku: "SKU-1" });
    expect(deleteInventoryArticle).toHaveBeenCalledWith("p-1");
    await expect(appRouter.createCaller(context(admin2)).inventory.deleteArticle({ productId: "p-1", confirmation: "ELIMINAR" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context(admin1)).inventory.deleteArticle({ productId: "p-1", confirmation: "BORRAR" as "ELIMINAR" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("permite consultar más vendidos a admin1 y rechaza admin2", async () => {
    await expect(appRouter.createCaller(context(admin1)).inventory.topSold({ month: 8, year: 2026 })).resolves.toEqual([{ productId: "p-1", sku: "SKU-1", name: "Filtro", soldQuantity: 5 }]);
    await expect(appRouter.createCaller(context(admin2)).inventory.topSold({ month: 8, year: 2026 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("permite eliminar una lectura a admin1 y rechaza admin2", async () => {
    await expect(appRouter.createCaller(context(admin1)).inventory.deleteScan({ scanId: 7 })).resolves.toMatchObject({ found: true, scanId: 7 });
    expect(deleteInventoryScan).toHaveBeenCalledWith(7);
    await expect(appRouter.createCaller(context(admin2)).inventory.deleteScan({ scanId: 7 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(deleteInventoryScan).toHaveBeenCalledTimes(1);
  });
});
