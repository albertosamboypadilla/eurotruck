import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const localAdmins = mysqlTable("local_admins", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 40 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 128 }).notNull(),
  passwordSalt: varchar("passwordSalt", { length: 64 }).notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const inventoryItems = mysqlTable("inventory_items", {
  id: int("id").autoincrement().primaryKey(),
  productId: varchar("productId", { length: 180 }).notNull().unique(),
  sku: varchar("sku", { length: 100 }).notNull(),
  internalCode: varchar("internalCode", { length: 20 }),
  barcode: varchar("barcode", { length: 40 }),
  name: text("name").notNull(),
  description: text("description"),
  brand: varchar("brand", { length: 120 }),
  application: varchar("application", { length: 120 }),
  image: text("image"),
  costPrice: decimal("costPrice", { precision: 12, scale: 2 }).notNull().default("0.00"),
  salePrice: decimal("salePrice", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalQuantity: int("totalQuantity").notNull().default(0),
  lastTramo: varchar("lastTramo", { length: 80 }),
  lastGondola: varchar("lastGondola", { length: 80 }),
  countedBy: varchar("countedBy", { length: 40 }).notNull(),
  lastCountedAt: timestamp("lastCountedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const inventoryScans = mysqlTable("inventory_scans", {
  id: int("id").autoincrement().primaryKey(),
  inventoryItemId: int("inventoryItemId").notNull(),
  quantity: int("quantity").notNull(),
  tramo: varchar("tramo", { length: 80 }).notNull(),
  gondola: varchar("gondola", { length: 80 }).notNull(),
  countedBy: varchar("countedBy", { length: 40 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const inventoryMovements = mysqlTable("inventory_movements", {
  id: int("id").autoincrement().primaryKey(),
  inventoryItemId: int("inventoryItemId").notNull(),
  productId: varchar("productId", { length: 180 }).notNull(),
  sku: varchar("sku", { length: 100 }).notNull(),
  name: text("name").notNull(),
  movementType: mysqlEnum("movementType", ["sale"]).default("sale").notNull(),
  quantity: int("quantity").notNull(),
  source: varchar("source", { length: 40 }).notNull().default("manual"),
  orderId: int("orderId"),
  movedBy: varchar("movedBy", { length: 40 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 32 }).notNull().unique(),
  company: varchar("company", { length: 180 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  rnc: varchar("rnc", { length: 40 }),
  truckBrand: varchar("truckBrand", { length: 80 }),
  partsNote: text("partsNote"),
  notificationRecipients: varchar("notificationRecipients", { length: 640 }).notNull().default("eurotruckcxa@yahoo.com,albertosamboy@gmail.com"),
  afterHours: int("afterHours").notNull().default(0),
  status: mysqlEnum("status", ["new", "taken", "closed"]).default("new").notNull(),
  assignedAdmin: varchar("assignedAdmin", { length: 40 }),
  assignedAt: timestamp("assignedAt"),
  deletedAt: timestamp("deletedAt"),
  deletedBy: varchar("deletedBy", { length: 40 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  quantity: int("quantity").notNull().default(1),
  productId: varchar("productId", { length: 180 }).notNull(),
  sku: varchar("sku", { length: 100 }).notNull(),
  name: text("name").notNull(),
  brand: varchar("brand", { length: 120 }),
  application: varchar("application", { length: 120 }),
  category: varchar("category", { length: 160 }),
  image: text("image"),
  sourceUrl: text("sourceUrl"),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull().default("0.00"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type LocalAdmin = typeof localAdmins.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;
