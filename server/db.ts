import { eq, desc, and, gt, isNull, isNotNull, gte, lt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertOrder, InsertOrderItem, Order, OrderItem, InsertUser, inventoryGtins, inventoryItems, inventoryMovements, inventoryScans, localAdmins, orderItems, orders, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { formatOrderNumber } from "@shared/orderHelpers";
import { rebuildInventoryAfterScanRemoval } from "@shared/inventoryHelpers";
import { buildRecentIngressRow, normalizeIngressLimit } from "@shared/inventoryIngress";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  values.lastSignedIn ??= new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getLocalAdminByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(localAdmins).where(eq(localAdmins.username, username)).limit(1);
  return result[0];
}

export type OrderWithItems = { order: Order; items: OrderItem[] };

export async function createOrder(order: Omit<InsertOrder, "orderNumber">, items: Omit<InsertOrderItem, "orderId">[]) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async tx => {
    const pendingNumber = `PENDING-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const inserted = await tx.insert(orders).values({ ...order, orderNumber: pendingNumber }).execute();
    const orderId = Number((inserted as unknown as Array<{ insertId: number }>)[0]?.insertId);
    if (!orderId) throw new Error("Unable to allocate order number");
    const orderNumber = formatOrderNumber(orderId);
    await tx.update(orders).set({ orderNumber }).where(eq(orders.id, orderId));
    if (items.length) await tx.insert(orderItems).values(items.map(item => ({ ...item, orderId })));
    const created = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    const createdItems = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    return { order: created[0], items: createdItems } satisfies OrderWithItems;
  });
}

export async function getOrderWithItems(orderId: number): Promise<OrderWithItems | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!result[0]) return undefined;
  return { order: result[0], items: await db.select().from(orderItems).where(eq(orderItems.orderId, orderId)) };
}

export async function listOrders(): Promise<OrderWithItems[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(orders).where(isNull(orders.deletedAt)).orderBy(desc(orders.createdAt));
  return Promise.all(rows.map(async order => ({ order, items: await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)) })));
}

export async function listDeletedOrders(): Promise<OrderWithItems[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(orders).where(isNotNull(orders.deletedAt)).orderBy(desc(orders.deletedAt), desc(orders.createdAt));
  return Promise.all(rows.map(async order => ({ order, items: await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)) })));
}

export async function claimOrder(orderId: number, adminUsername: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.update(orders).set({ status: "taken", assignedAdmin: adminUsername, assignedAt: new Date() }).where(and(eq(orders.id, orderId), eq(orders.status, "new"))).execute();
  const affectedRows = Number((result as unknown as { affectedRows?: number })?.affectedRows ?? (result as unknown as Array<{ affectedRows?: number }>)[0]?.affectedRows ?? 0);
  return affectedRows > 0;
}

export async function archiveOrder(orderId: number, adminUsername: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.update(orders).set({ deletedAt: new Date(), deletedBy: adminUsername }).where(and(eq(orders.id, orderId), isNull(orders.deletedAt))).execute();
  const affectedRows = Number((result as unknown as { affectedRows?: number })?.affectedRows ?? (result as unknown as Array<{ affectedRows?: number }>)[0]?.affectedRows ?? 0);
  return affectedRows > 0;
}

export async function purgeDeletedOrder(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async tx => {
    const found = await tx.select({ id: orders.id }).from(orders).where(and(eq(orders.id, orderId), isNotNull(orders.deletedAt))).limit(1);
    if (!found[0]) return false;
    await tx.delete(orderItems).where(eq(orderItems.orderId, orderId));
    await tx.delete(orders).where(and(eq(orders.id, orderId), isNotNull(orders.deletedAt)));
    return true;
  });
}

export type QuoteItemUpdateInput = Omit<InsertOrderItem, "orderId">;

export async function updateQuoteItems(orderId: number, items: QuoteItemUpdateInput[]) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async tx => {
    const found = await tx.select().from(orders).where(and(eq(orders.id, orderId), isNull(orders.deletedAt))).limit(1);
    if (!found[0]) throw new Error("Quote not found");
    await tx.delete(orderItems).where(eq(orderItems.orderId, orderId));
    if (items.length) await tx.insert(orderItems).values(items.map(item => ({ ...item, orderId })));
    await tx.update(orders).set({ updatedAt: new Date() }).where(eq(orders.id, orderId));
    const updatedOrder = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    return { order: updatedOrder[0], items: await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId)) } satisfies OrderWithItems;
  });
}

export type InventoryCountInput = {
  productId: string;
  sku: string;
  name: string;
  description?: string;
  brand?: string;
  application?: string;
  image?: string;
  internalCode?: string;
  barcode?: string;
  quantity: number;
  tramo: string;
  gondola: string;
  countedBy: string;
};

export async function recordInventoryCount(input: InventoryCountInput) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async tx => {
    const existing = await tx.select().from(inventoryItems).where(eq(inventoryItems.productId, input.productId)).limit(1);
    let inventoryItem = existing[0];
    if (inventoryItem) {
      await tx.update(inventoryItems).set({ description: input.description ?? inventoryItem.description, internalCode: input.internalCode ?? inventoryItem.internalCode, barcode: input.barcode ?? inventoryItem.barcode, totalQuantity: inventoryItem.totalQuantity + input.quantity, lastTramo: input.tramo, lastGondola: input.gondola, countedBy: input.countedBy, lastCountedAt: new Date() }).where(eq(inventoryItems.id, inventoryItem.id));
    } else {
      const inserted = await tx.insert(inventoryItems).values({ productId: input.productId, sku: input.sku, name: input.name, description: input.description, brand: input.brand, application: input.application, image: input.image, internalCode: input.internalCode, barcode: input.barcode, totalQuantity: input.quantity, lastTramo: input.tramo, lastGondola: input.gondola, countedBy: input.countedBy }).execute();
      const inventoryItemId = Number((inserted as unknown as Array<{ insertId: number }>)[0]?.insertId);
      const created = await tx.select().from(inventoryItems).where(eq(inventoryItems.id, inventoryItemId)).limit(1);
      inventoryItem = created[0];
    }
    if (!inventoryItem) throw new Error("Unable to save inventory item");
    await tx.insert(inventoryScans).values({ inventoryItemId: inventoryItem.id, quantity: input.quantity, tramo: input.tramo, gondola: input.gondola, countedBy: input.countedBy }).execute();
    return { ...inventoryItem, totalQuantity: inventoryItem.totalQuantity + (existing[0] ? input.quantity : 0), wasAlreadyCounted: Boolean(existing[0]) };
  });
}

export async function listInventoryScans(inventoryItemId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inventoryScans).where(eq(inventoryScans.inventoryItemId, inventoryItemId)).orderBy(desc(inventoryScans.createdAt), desc(inventoryScans.id));
}

export async function deleteInventoryScan(scanId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async tx => {
    const found = await tx.select().from(inventoryScans).where(eq(inventoryScans.id, scanId)).limit(1);
    const scan = found[0];
    if (!scan) return { found: false as const, scanId };
    const history = await tx.select().from(inventoryScans).where(eq(inventoryScans.inventoryItemId, scan.inventoryItemId)).orderBy(desc(inventoryScans.createdAt), desc(inventoryScans.id));
    const summary = rebuildInventoryAfterScanRemoval(history, scanId);
    if (!summary.found) return { found: false as const, scanId };
    await tx.delete(inventoryScans).where(eq(inventoryScans.id, scanId));
    await tx.update(inventoryItems).set({ totalQuantity: summary.totalQuantity, lastTramo: summary.lastTramo, lastGondola: summary.lastGondola }).where(eq(inventoryItems.id, scan.inventoryItemId));
    return { found: true as const, scanId, inventoryItemId: scan.inventoryItemId, removedQuantity: summary.removedQuantity, totalQuantity: summary.totalQuantity, lastTramo: summary.lastTramo, lastGondola: summary.lastGondola };
  });
}

export type NewInventoryItemInput = {
  sku: string;
  name: string;
  description?: string;
  brand?: string;
  application?: string;
  image?: string;
  barcode?: string;
  costPrice?: string;
  salePrice?: string;
  initialQuantity?: number;
  tramo?: string;
  gondola?: string;
};

export async function createInventoryItem(input: NewInventoryItemInput, countedBy: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const productId = `custom-${crypto.randomUUID()}`;
  const inserted = await db.insert(inventoryItems).values({ productId, sku: input.sku, name: input.name, description: input.description, brand: input.brand, application: input.application, image: input.image, barcode: input.barcode, costPrice: input.costPrice ?? "0.00", salePrice: input.salePrice ?? "0.00", totalQuantity: input.initialQuantity ?? 0, lastTramo: input.initialQuantity ? input.tramo : undefined, lastGondola: input.initialQuantity ? input.gondola : undefined, countedBy }).execute();
  const inventoryItemId = Number((inserted as unknown as Array<{ insertId: number }>)[0]?.insertId);
  const internalCode = String(900000 + inventoryItemId).padStart(5, "0");
  await db.update(inventoryItems).set({ internalCode }).where(eq(inventoryItems.id, inventoryItemId));
  const created = await db.select().from(inventoryItems).where(eq(inventoryItems.id, inventoryItemId)).limit(1);
  if (!created[0]) throw new Error("Unable to create inventory item");
  return created[0];
}

export type InventoryPricingInput = {
  productId: string;
  sku: string;
  name: string;
  description?: string;
  brand?: string;
  application?: string;
  image?: string;
  costPrice: string;
  salePrice: string;
};

export async function updateInventoryPricing(input: InventoryPricingInput) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async tx => {
    const existing = await tx.select().from(inventoryItems).where(eq(inventoryItems.productId, input.productId)).limit(1);
    if (existing[0]) {
      await tx.update(inventoryItems).set({ costPrice: input.costPrice, salePrice: input.salePrice }).where(eq(inventoryItems.productId, input.productId));
    } else {
      await tx.insert(inventoryItems).values({ productId: input.productId, sku: input.sku, name: input.name, description: input.description, brand: input.brand, application: input.application, image: input.image, costPrice: input.costPrice, salePrice: input.salePrice, totalQuantity: 0, countedBy: "admin1" });
    }
    const updated = await tx.select().from(inventoryItems).where(eq(inventoryItems.productId, input.productId)).limit(1);
    if (!updated[0]) throw new Error("Inventory article not found");
    return updated[0];
  });
}

export type InventorySaleInput = {
  productId?: string;
  sku: string;
  quantity: number;
  movedBy: string;
  source?: string;
  orderId?: number;
};

export async function recordInventorySale(input: InventorySaleInput) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (!Number.isInteger(input.quantity) || input.quantity < 1) throw new Error("Sale quantity must be a positive integer");
  return db.transaction(async tx => {
    const candidates = await tx.select().from(inventoryItems).where(input.productId ? eq(inventoryItems.productId, input.productId) : eq(inventoryItems.sku, input.sku)).limit(2);
    if (!candidates[0]) throw new Error("Inventory article not found");
    if (!input.productId && candidates.length > 1) throw new Error("SKU matches multiple inventory articles; productId is required");
    const item = candidates[0];
    if (item.totalQuantity < input.quantity) throw new Error(`Insufficient stock for ${item.sku}`);
    const nextQuantity = item.totalQuantity - input.quantity;
    await tx.update(inventoryItems).set({ totalQuantity: nextQuantity }).where(and(eq(inventoryItems.id, item.id), gte(inventoryItems.totalQuantity, input.quantity)));
    await tx.insert(inventoryMovements).values({ inventoryItemId: item.id, productId: item.productId, sku: item.sku, name: item.name, movementType: "sale", quantity: input.quantity, source: input.source ?? "manual", orderId: input.orderId, movedBy: input.movedBy });
    return { ...item, totalQuantity: nextQuantity, soldQuantity: input.quantity };
  });
}

export async function listTopSoldInventory(month: number, year: number) {
  const db = await getDb();
  if (!db) return [];
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000 || year > 2200) throw new Error("Invalid report period");
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const soldTotal = sql<number>`SUM(${inventoryMovements.quantity})`;
  return db.select({ sku: inventoryMovements.sku, productId: inventoryMovements.productId, name: inventoryMovements.name, soldQuantity: soldTotal }).from(inventoryMovements).where(and(eq(inventoryMovements.movementType, "sale"), gte(inventoryMovements.createdAt, start), lt(inventoryMovements.createdAt, end))).groupBy(inventoryMovements.sku, inventoryMovements.productId, inventoryMovements.name).orderBy(desc(soldTotal)).limit(100);
}

export async function listDailyInventorySales(date: string) {
  const db = await getDb();
  if (!db) return [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Invalid sales date");
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const movements = await db.select().from(inventoryMovements).where(and(eq(inventoryMovements.movementType, "sale"), gte(inventoryMovements.createdAt, start), lt(inventoryMovements.createdAt, end))).orderBy(inventoryMovements.createdAt, inventoryMovements.id);
  if (!movements.length) return [];
  const items = await db.select().from(inventoryItems);
  const prices = new Map(items.map(item => [item.productId, Number(item.salePrice || 0)]));
  return movements.map((movement, index) => {
    const unitPrice = prices.get(movement.productId) ?? 0;
    return { ...movement, dailyNumber: index + 1, unitPrice, finalCost: unitPrice * movement.quantity };
  }).reverse();
}

export async function deleteInventoryArticle(productId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async tx => {
    const found = await tx.select().from(inventoryItems).where(eq(inventoryItems.productId, productId)).limit(1);
    const item = found[0];
    if (!item) throw new Error("Inventory article not found");
    await tx.delete(inventoryScans).where(eq(inventoryScans.inventoryItemId, item.id));
    await tx.delete(inventoryGtins).where(eq(inventoryGtins.productId, productId));
    await tx.delete(inventoryItems).where(eq(inventoryItems.productId, productId));
    return { productId, sku: item.sku, name: item.name, removedQuantity: item.totalQuantity };
  });
}

export async function listInventory() {
  const db = await getDb();
  if (!db) return [];
  const items = await db.select().from(inventoryItems).orderBy(desc(inventoryItems.updatedAt));
  if (!items.length) return [];
  const scans = await db.select().from(inventoryScans).orderBy(desc(inventoryScans.createdAt), desc(inventoryScans.id));
  const scansByItem = new Map<number, typeof scans>();
  scans.forEach(scan => {
    const history = scansByItem.get(scan.inventoryItemId) || [];
    history.push(scan);
    scansByItem.set(scan.inventoryItemId, history);
  });
  return items.map(item => ({ ...item, scanCount: scansByItem.get(item.id)?.length || 0, lastScanId: scansByItem.get(item.id)?.[0]?.id || null }));
}

export async function listInventoryGtins() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inventoryGtins).orderBy(desc(inventoryGtins.createdAt), desc(inventoryGtins.id));
}

export async function listPublicInventoryGtins() {
  const rows = await listInventoryGtins();
  return rows.map(({ productId, sku, gtin }) => ({ productId, sku, gtin }));
}

export type InventoryGtinInput = { productId: string; sku: string; gtin: string; addedBy: string };

export async function addInventoryGtin(input: InventoryGtinInput) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const gtin = input.gtin.replace(/\D/g, "");
  if (!/^\d{8,14}$/.test(gtin)) throw new Error("El GTIN debe contener entre 8 y 14 dígitos");
  const existing = await db.select().from(inventoryGtins).where(eq(inventoryGtins.gtin, gtin)).limit(1);
  if (existing[0]) {
    if (existing[0].productId !== input.productId) throw new Error(`Este GTIN ya pertenece a ${existing[0].sku}`);
    return existing[0];
  }
  await db.insert(inventoryGtins).values({ productId: input.productId, sku: input.sku, gtin, addedBy: input.addedBy });
  const created = await db.select().from(inventoryGtins).where(eq(inventoryGtins.gtin, gtin)).limit(1);
  if (!created[0]) throw new Error("No se pudo guardar el GTIN");
  return created[0];
}

export async function listRecentInventoryIngress(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const scans = await db.select().from(inventoryScans).orderBy(desc(inventoryScans.createdAt), desc(inventoryScans.id)).limit(normalizeIngressLimit(limit));
  if (!scans.length) return [];
  const items = await db.select().from(inventoryItems);
  const itemsById = new Map(items.map(item => [item.id, item]));
  return scans.map(scan => buildRecentIngressRow(scan, itemsById.get(scan.inventoryItemId)));
}

export async function listPublicInventoryLocations() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ productId: inventoryItems.productId, totalQuantity: inventoryItems.totalQuantity, lastTramo: inventoryItems.lastTramo, lastGondola: inventoryItems.lastGondola, salePrice: inventoryItems.salePrice })
    .from(inventoryItems);
}
