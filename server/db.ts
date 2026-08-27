import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertOrder, InsertOrderItem, Order, OrderItem, InsertUser, localAdmins, orderItems, orders, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { formatOrderNumber } from "@shared/orderHelpers";

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

export async function listOrders(): Promise<OrderWithItems[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
  return Promise.all(rows.map(async order => ({ order, items: await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)) })));
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
