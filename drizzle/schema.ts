import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: varchar("productId", { length: 180 }).notNull(),
  sku: varchar("sku", { length: 100 }).notNull(),
  name: text("name").notNull(),
  brand: varchar("brand", { length: 120 }),
  application: varchar("application", { length: 120 }),
  category: varchar("category", { length: 160 }),
  image: text("image"),
  sourceUrl: text("sourceUrl"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type LocalAdmin = typeof localAdmins.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;
