import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { TRPCError } from "@trpc/server";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { archiveOrder, claimOrder, createInventoryItem, createOrder, deleteInventoryScan, getLocalAdminByUsername, getOrderWithItems, listDeletedOrders, listInventory, listInventoryScans, listOrders, listPublicInventoryLocations, listTopSoldInventory, purgeDeletedOrder, recordInventoryCount, recordInventorySale } from "./db";
import { buildOrderPdf } from "./orderService";
import { COOKIE_NAME } from "@shared/const";
import { createAdminSession, SESSION_COOKIE, SESSION_TTL_SECONDS, verifyPassword } from "./localAuth";
import { isEurotruckAfterHours } from "@shared/orderHelpers";
import { isInventoryAdmin } from "@shared/inventoryHelpers";

const orderItemInput = z.object({
  productId: z.string().max(180), quantity: z.number().int().min(1).max(99).default(1), sku: z.string().max(100), name: z.string().max(500), brand: z.string().max(120).optional(), application: z.string().max(120).optional(), category: z.string().max(160).optional(), image: z.string().max(2000).optional(), sourceUrl: z.string().max(2000).optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    localLogin: publicProcedure.input(z.object({ username: z.string().min(1).max(40), password: z.string().min(1).max(100) })).mutation(async ({ ctx, input }) => {
      const admin = await getLocalAdminByUsername(input.username.trim().toLowerCase());
      if (!admin?.active || !(await verifyPassword(input.password, admin.passwordSalt, admin.passwordHash))) throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuario o contraseña incorrectos" });
      const token = await createAdminSession(admin.username);
      ctx.res.cookie(SESSION_COOKIE, token, { ...getSessionCookieOptions(ctx.req), maxAge: SESSION_TTL_SECONDS * 1000 });
      return { success: true, username: admin.username } as const;
    }),
    localLogout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(SESSION_COOKIE, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  orders: router({
    create: publicProcedure.input(z.object({
      company: z.string().min(2).max(180), email: z.string().email().max(320), phone: z.string().min(7).max(40), rnc: z.string().max(40).optional(), truckBrand: z.string().max(80).optional(), partsNote: z.string().max(2000).optional(), items: z.array(orderItemInput).min(1).max(100),
    })).mutation(async ({ input }) => {
      const afterHours = isEurotruckAfterHours(new Date());
      const created = await createOrder({ company: input.company, email: input.email, phone: input.phone, rnc: input.rnc, truckBrand: input.truckBrand, partsNote: input.partsNote, notificationRecipients: "", afterHours: afterHours ? 1 : 0, status: "new" }, input.items);
      const pdf = await buildOrderPdf(created);
      return { orderNumber: created.order.orderNumber, pdfBase64: pdf.toString("base64"), afterHours, afterHoursMessage: afterHours ? "Buenas tardes. Recibimos tu solicitud; mañana será atendida por nuestro equipo Eurotruck." : null, afterHoursMessageEn: afterHours ? "Good afternoon. We received your request; our Eurotruck team will attend to it tomorrow." : null };
    }),
    list: adminProcedure.query(async () => listOrders()),
    deleted: adminProcedure.query(async () => listDeletedOrders()),
    pdf: adminProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
      const order = await getOrderWithItems(input.id);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Orden no encontrada" });
      const pdf = await buildOrderPdf(order);
      return { orderNumber: order.order.orderNumber, pdfBase64: pdf.toString("base64") };
    }),
    take: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const claimed = await claimOrder(input.id, ctx.user.name || ctx.user.email || "admin");
      if (!claimed) throw new TRPCError({ code: "CONFLICT", message: "Esta orden ya fue tomada por otro usuario" });
      return { success: true } as const;
    }),
    remove: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => ({ success: await archiveOrder(input.id, ctx.user.name || ctx.user.email || "admin") })),
    purge: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => ({ success: await purgeDeletedOrder(input.id) })),
  }),
  inventory: router({
    publicLocations: publicProcedure.query(() => listPublicInventoryLocations()),
    list: adminProcedure.query(async ({ ctx }) => {
      if (!isInventoryAdmin(ctx.user.name)) throw new TRPCError({ code: "FORBIDDEN", message: "Solo admin1 puede acceder al inventario" });
      return listInventory();
    }),
    record: adminProcedure.input(z.object({ productId: z.string().max(180), sku: z.string().max(100), name: z.string().max(500), description: z.string().max(2000).optional(), brand: z.string().max(120).optional(), application: z.string().max(120).optional(), image: z.string().max(2000).optional(), quantity: z.number().int().min(1).max(9999), tramo: z.string().trim().min(1).max(80), gondola: z.string().trim().min(1).max(80) })).mutation(async ({ ctx, input }) => {
      if (!isInventoryAdmin(ctx.user.name)) throw new TRPCError({ code: "FORBIDDEN", message: "Solo admin1 puede registrar inventario" });
      return recordInventoryCount({ ...input, countedBy: "admin1" });
    }),
    create: adminProcedure.input(z.object({ sku: z.string().trim().min(1).max(100), name: z.string().trim().min(1).max(500), description: z.string().max(2000).optional(), brand: z.string().max(120).optional(), application: z.string().max(120).optional(), image: z.string().max(2000).optional() })).mutation(async ({ ctx, input }) => {
      if (!isInventoryAdmin(ctx.user.name)) throw new TRPCError({ code: "FORBIDDEN", message: "Solo admin1 puede agregar artículos" });
      return createInventoryItem(input, "admin1");
    }),
    history: adminProcedure.input(z.object({ inventoryItemId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      if (!isInventoryAdmin(ctx.user.name)) throw new TRPCError({ code: "FORBIDDEN", message: "Solo admin1 puede consultar el historial" });
      return listInventoryScans(input.inventoryItemId);
    }),
    deleteScan: adminProcedure.input(z.object({ scanId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      if (!isInventoryAdmin(ctx.user.name)) throw new TRPCError({ code: "FORBIDDEN", message: "Solo admin1 puede eliminar conteos" });
      const result = await deleteInventoryScan(input.scanId);
      if (!result.found) throw new TRPCError({ code: "NOT_FOUND", message: "La lectura ya no existe" });
      return result;
    }),
    recordSale: adminProcedure.input(z.object({ productId: z.string().max(180).optional(), sku: z.string().trim().min(1).max(100), quantity: z.number().int().min(1).max(9999), source: z.enum(["manual", "scan", "cart"]).default("manual"), orderId: z.number().int().positive().optional() })).mutation(async ({ ctx, input }) => {
      if (!isInventoryAdmin(ctx.user.name)) throw new TRPCError({ code: "FORBIDDEN", message: "Solo admin1 puede descontar inventario" });
      try {
        return await recordInventorySale({ ...input, movedBy: "admin1" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo descontar el inventario";
        throw new TRPCError({ code: message.includes("not found") ? "NOT_FOUND" : "BAD_REQUEST", message });
      }
    }),
    topSold: adminProcedure.input(z.object({ month: z.number().int().min(1).max(12), year: z.number().int().min(2000).max(2200) })).query(async ({ ctx, input }) => {
      if (!isInventoryAdmin(ctx.user.name)) throw new TRPCError({ code: "FORBIDDEN", message: "Solo admin1 puede consultar reportes de inventario" });
      return listTopSoldInventory(input.month, input.year);
    }),
  }),
});

export type AppRouter = typeof appRouter;
