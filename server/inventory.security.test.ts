import { describe, expect, it, vi } from "vitest";

const { createInventoryItem, listInventory, recordInventoryCount } = vi.hoisted(() => ({
  createInventoryItem: vi.fn(async (input: any, countedBy: string) => ({ id: 1, productId: "custom-1", ...input, totalQuantity: 0, countedBy })),
  listInventory: vi.fn(async () => []),
  recordInventoryCount: vi.fn(async (input: any) => ({ ...input, totalQuantity: input.quantity, wasAlreadyCounted: false })),
}));

vi.mock("./db", () => ({
  createInventoryItem,
  listInventory,
  recordInventoryCount,
  claimOrder: vi.fn(),
  createOrder: vi.fn(),
  deleteOrder: vi.fn(),
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
  it("permite listar a admin1 y rechaza admin2", async () => {
    await expect(appRouter.createCaller(context(admin1)).inventory.list()).resolves.toEqual([]);
    await expect(appRouter.createCaller(context(admin2)).inventory.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(listInventory).toHaveBeenCalledTimes(1);
  });

  it("permite agregar un artículo a admin1 e inyecta su identidad", async () => {
    const newArticle = { sku: "NUEVO-1", name: "Artículo nuevo", description: "Descripción nueva", brand: "Eurotruck", application: "Iveco" };
    await expect(appRouter.createCaller(context(admin1)).inventory.create(newArticle)).resolves.toMatchObject({ productId: "custom-1", countedBy: "admin1" });
    expect(createInventoryItem).toHaveBeenCalledWith(newArticle, "admin1");
    await expect(appRouter.createCaller(context(admin2)).inventory.create(newArticle)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("permite registrar a admin1, inyecta su identidad y rechaza admin2", async () => {
    await expect(appRouter.createCaller(context(admin1)).inventory.record(input)).resolves.toMatchObject({ totalQuantity: 2 });
    expect(recordInventoryCount).toHaveBeenCalledWith({ ...input, countedBy: "admin1" });
    await expect(appRouter.createCaller(context(admin2)).inventory.record(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(recordInventoryCount).toHaveBeenCalledTimes(1);
  });
});
