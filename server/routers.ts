import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { TRPCError } from "@trpc/server";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { createOrder, deleteOrder, getLocalAdminByUsername, listOrders } from "./db";
import { buildOrderPdf, ORDER_RECIPIENTS, sendOrderEmail } from "./orderService";
import { COOKIE_NAME } from "@shared/const";
import { createAdminSession, SESSION_COOKIE, SESSION_TTL_SECONDS, verifyPassword } from "./localAuth";
import { isEurotruckAfterHours } from "@shared/orderHelpers";

const orderItemInput = z.object({
  productId: z.string().max(180), sku: z.string().max(100), name: z.string().max(500), brand: z.string().max(120).optional(), application: z.string().max(120).optional(), category: z.string().max(160).optional(), image: z.string().max(2000).optional(), sourceUrl: z.string().max(2000).optional(),
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
      const created = await createOrder({ company: input.company, email: input.email, phone: input.phone, rnc: input.rnc, truckBrand: input.truckBrand, partsNote: input.partsNote, notificationRecipients: ORDER_RECIPIENTS.join(","), afterHours: afterHours ? 1 : 0, status: "new" }, input.items);
      const pdf = await buildOrderPdf(created);
      let emailSent = false;
      try { emailSent = await sendOrderEmail(created, pdf); } catch (error) { console.error("[Orders] Email delivery failed:", error); }
      return { orderNumber: created.order.orderNumber, pdfBase64: pdf.toString("base64"), emailSent, afterHours, afterHoursMessage: afterHours ? "Buenas tardes. Recibimos tu solicitud; mañana será atendida por nuestro equipo Eurotruck." : null };
    }),
    list: adminProcedure.query(async () => listOrders()),
    remove: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => ({ success: await deleteOrder(input.id) })),
  }),
});

export type AppRouter = typeof appRouter;
