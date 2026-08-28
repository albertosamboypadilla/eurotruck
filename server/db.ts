import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertOrder, InsertOrderItem, Order, OrderItem, InsertUser, inventoryItems, inventoryScans, localAdmins, orderItems, orders, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { formatOrderNumber } from "@shared/orderHelpers";
import { rebuildInventoryAfterScanRemoval } from "@shared/inventoryHelpers";

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
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
  return Promise.all(rows.map(async order => ({ order, items: await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)) })));
}

export async function claimOrder(orderId: number, adminUsername: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.update(orders).set({ status: "taken", assignedAdmin: adminUsername, assignedAt: new Date() }).where(and(eq(orders.id, orderId), eq(orders.status, "new"))).execute();
  const affectedRows = Number((result as unknown as { affectedRows?: number })?.affectedRows ?? (result as unknown as Array<{ affectedRows?: number }>)[0]?.affectedRows ?? 0);
  return affectedRows > 0;
}

export async function deleteOrder(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async tx => {
    await tx.delete(orderItems).where(eq(orderItems.orderId, orderId));
    await tx.delete(orders).where(eq(orders.id, orderId));
    return true;
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
      await tx.update(inventoryItems).set({ description: input.description ?? inventoryItem.description, totalQuantity: inventoryItem.totalQuantity + input.quantity, lastTramo: input.tramo, lastGondola: input.gondola, countedBy: input.countedBy, lastCountedAt: new Date() }).where(eq(inventoryItems.id, inventoryItem.id));
    } else {
      const inserted = await tx.insert(inventoryItems).values({ productId: input.productId, sku: input.sku, name: input.name, description: input.description, brand: input.brand, application: input.application, image: input.image, totalQuantity: input.quantity, lastTramo: input.tramo, lastGondola: input.gondola, countedBy: input.countedBy }).execute();
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
};

export async function createInventoryItem(input: NewInventoryItemInput, countedBy: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const productId = `custom-${crypto.randomUUID()}`;
  const inserted = await db.insert(inventoryItems).values({ productId, sku: input.sku, name: input.name, description: input.description, brand: input.brand, application: input.application, image: input.image, totalQuantity: 0, countedBy }).execute();
  const inventoryItemId = Number((inserted as unknown as Array<{ insertId: number }>)[0]?.insertId);
  const created = await db.select().from(inventoryItems).where(eq(inventoryItems.id, inventoryItemId)).limit(1);
  if (!created[0]) throw new Error("Unable to create inventory item");
  return created[0];
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
