import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { TRPCError } from "@trpc/server";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { addInventoryGtin, archiveOrder, claimOrder, createInventoryItem, createOrder, deleteInventoryArticle, deleteInventoryScan, getLocalAdminByUsername, getOrderWithItems, listDailyInventorySales, listDeletedOrders, listInventory, listInventoryGtins, listInventoryScans, listRecentInventoryIngress, listOrders, listPublicInventoryGtins, listPublicInventoryLocations, listTopSoldInventory, purgeDeletedOrder, recordInventoryCount, recordInventorySale, updateInventoryPricing, updateQuoteItems } from "./db";
import { buildOrderPdf } from "./orderService";
import { storagePut } from "./storage";
import { COOKIE_NAME } from "@shared/const";
import { createAdminSession, SESSION_COOKIE, SESSION_TTL_SECONDS, verifyPassword } from "./localAuth";
import { isEurotruckAfterHours } from "@shared/orderHelpers";
import { isInventoryAdmin, isInventorySaleConfirmationKey } from "@shared/inventoryHelpers";

const orderItemInput = z.object({
  productId: z.string().max(180), quantity: z.number().int().min(1).max(9999).default(1), sku: z.string().max(100), name: z.string().max(500), brand: z.string().max(120).optional(), application: z.string().max(120).optional(), category: z.string().max(160).optional(), image: z.string().max(2000).optional(), sourceUrl: z.string().max(2000).optional(), unitPrice: z.number().min(0).max(100000000).optional(),
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
      const created = await createOrder({ company: input.company, email: input.email, phone: input.phone, rnc: input.rnc, truckBrand: input.truckBrand, partsNote: input.partsNote, notificationRecipients: "", afterHours: afterHours ? 1 : 0, status: "new" }, input.items.map(item => ({ ...item, unitPrice: String(item.unitPrice ?? 0) })));
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
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), items: z.array(orderItemInput).max(100) })).mutation(async ({ input }) => {
      try {
        return await updateQuoteItems(input.id, input.items.map(item => ({ ...item, unitPrice: String(item.unitPrice ?? 0) })));
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo actualizar la cotización";
        throw new TRPCError({ code: message.includes("not found") ? "NOT_FOUND" : "BAD_REQUEST", message });
      }
    }),
    remove: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => ({ success: await archiveOrder(input.id, ctx.user.name || ctx.user.email || "admin") })),
    purge: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => ({ success: await purgeDeletedOrder(input.id) })),
  }),
  inventory: router({
    publicLocations: publicProcedure.query(() => listPublicInventoryLocations()),
    publicGtins: publicProcedure.query(() => listPublicInventoryGtins()),
    gtins: adminProcedure.query(async ({ ctx }) => {
      if (!isInventoryAdmin(ctx.user.name)) throw new TRPCError({ code: "FORBIDDEN", message: "Solo admin1 puede consultar los GTIN del inventario" });
      return listInventoryGtins();
    }),
    list: adminProcedure.query(async ({ ctx }) => {
      if (!isInventoryAdmin(ctx.user.name)) throw new TRPCError({ code: "FORBIDDEN", message: "Solo admin1 puede acceder al inventario" });
      return listInventory();
    }),
    record: adminProcedure.input(z.object({ productId: z.string().max(180), sku: z.string().max(100), name: z.string().max(500), description: z.string().max(2000).optional(), brand: z.string().max(120).optional(), application: z.string().max(120).optional(), image: z.string().max(2000).optional(), internalCode: z.string().max(20).optional(), barcode: z.string().max(40).optional(), quantity: z.number().int().min(1).max(9999), tramo: z.string().trim().min(1).max(80), gondola: z.string().trim().min(1).max(80) })).mutation(async ({ ctx, input }) => {
      if (!isInventoryAdmin(ctx.user.name)) throw new TRPCError({ code: "FORBIDDEN", message: "Solo admin1 puede registrar inventario" });
      return recordInventoryCount({ ...input, countedBy: "admin1" });
    }),
    create: adminProcedure.input(z.object({ sku: z.string().trim().min(1).max(100), name: z.string().trim().min(1).max(500), description: z.string().max(2000).optional(), brand: z.string().max(120).optional(), application: z.string().max(120).optional(), image: z.string().max(2000).optional(), barcode: z.string().max(40).optional(), costPrice: z.number().min(0).max(100000000).optional(), salePrice: z.number().min(0).max(100000000).optional(), initialQuantity: z.number().int().min(0).max(9999).optional(), tramo: z.string().trim().max(80).optional(), gondola: z.string().trim().max(80).optional() })).mutation(async ({ ctx, input }) => {
      if (!isInventoryAdmin(ctx.user.name)) throw new TRPCError({ code: "FORBIDDEN", message: "Solo admin1 puede agregar artículos" });
      return createInventoryItem({ ...input, costPrice: String(input.costPrice ?? 0), salePrice: String(input.salePrice ?? 0) }, "admin1");
    }),
    addGtin: adminProcedure.input(z.object({ productId: z.string().max(180), sku: z.string().max(100), gtin: z.string().trim().min(8).max(14) })).mutation(async ({ ctx, input }) => {
      if (!isInventoryAdmin(ctx.user.name)) throw new TRPCError({ code: "FORBIDDEN", message: "Solo admin1 puede agregar GTIN" });
      try {
        return await addInventoryGtin({ ...input, addedBy: "admin1" });
      } catch (error) {
        throw new TRPCError({ code: error instanceof Error && error.message.includes("ya pertenece") ? "CONFLICT" : "BAD_REQUEST", message: error instanceof Error ? error.message : "No se pudo guardar el GTIN" });
      }
    }),
    updatePricing: adminProcedure.input(z.object({ productId: z.string().max(180), sku: z.string().max(100), name: z.string().max(500), description: z.string().max(2000).optional(), brand: z.string().max(120).optional(), application: z.string().max(120).optional(), image: z.string().max(2000).optional(), costPrice: z.number().min(0).max(100000000), salePrice: z.number().min(0).max(100000000) })).mutation(async ({ ctx, input }) => {
      if (!isInventoryAdmin(ctx.user.name)) throw new TRPCError({ code: "FORBIDDEN", message: "Solo admin1 puede modificar costos y precios" });
      if (input.salePrice > 0 && input.costPrice > input.salePrice) throw new TRPCError({ code: "BAD_REQUEST", message: "El precio de venta no puede ser menor que el costo" });
      try {
        return await updateInventoryPricing({ ...input, costPrice: input.costPrice.toFixed(2), salePrice: input.salePrice.toFixed(2) });
      } catch (error) {
        throw new TRPCError({ code: "NOT_FOUND", message: error instanceof Error ? error.message : "Artículo no encontrado" });
      }
    }),
    recentIngress: adminProcedure.input(z.object({ limit: z.number().int().min(1).max(200).default(50) }).optional()).query(async ({ ctx, input }) => {
      if (!isInventoryAdmin(ctx.user.name)) throw new TRPCError({ code: "FORBIDDEN", message: "Solo admin1 puede consultar los ingresos recientes" });
      return listRecentInventoryIngress(input?.limit ?? 50);
    }),
    uploadImage: adminProcedure.input(z.object({ fileName: z.string().trim().min(1).max(160), contentType: z.string().regex(/^image\/(jpeg|png|webp|gif)$/), dataBase64: z.string().min(20).max(8_000_000) })).mutation(async ({ ctx, input }) => {
      if (!isInventoryAdmin(ctx.user.name)) throw new TRPCError({ code: "FORBIDDEN", message: "Solo admin1 puede cargar fotos" });
      const bytes = Buffer.from(input.dataBase64.replace(/^data:[^;]+;base64,/, ""), "base64");
      if (!bytes.length || bytes.length > 6_000_000) throw new TRPCError({ code: "BAD_REQUEST", message: "La foto debe pesar menos de 6 MB" });
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      return storagePut(`inventory-images/${Date.now()}-${safeName}`, bytes, input.contentType);
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
    recordSale: adminProcedure.input(z.object({ productId: z.string().max(180).optional(), sku: z.string().trim().min(1).max(100), quantity: z.number().int().min(1).max(9999), confirmationKey: z.string().length(4), source: z.enum(["manual", "scan", "cart"]).default("manual"), orderId: z.number().int().positive().optional() })).mutation(async ({ ctx, input }) => {
      if (!isInventoryAdmin(ctx.user.name)) throw new TRPCError({ code: "FORBIDDEN", message: "Solo admin1 puede descontar inventario" });
      if (!isInventorySaleConfirmationKey(input.confirmationKey)) throw new TRPCError({ code: "BAD_REQUEST", message: "Clave de confirmación incorrecta" });
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
    dailySales: adminProcedure.input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })).query(async ({ ctx, input }) => {
      if (!isInventoryAdmin(ctx.user.name)) throw new TRPCError({ code: "FORBIDDEN", message: "Solo admin1 puede consultar ventas del día" });
      return listDailyInventorySales(input.date);
    }),
    deleteArticle: adminProcedure.input(z.object({ productId: z.string().max(180), confirmation: z.literal("ELIMINAR") })).mutation(async ({ ctx, input }) => {
      if (!isInventoryAdmin(ctx.user.name)) throw new TRPCError({ code: "FORBIDDEN", message: "Solo admin1 puede eliminar artículos" });
      try {
        return await deleteInventoryArticle(input.productId);
      } catch (error) {
        throw new TRPCError({ code: "NOT_FOUND", message: error instanceof Error ? error.message : "No se pudo eliminar el artículo" });
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
