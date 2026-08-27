import PDFDocument from "pdfkit";
import type { OrderWithItems } from "./db";

export const COMPANY_PHONE = "8094130846";

export function buildOrderPdf(data: OrderWithItems): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", chunk => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fillColor("#12336d").fontSize(22).font("Helvetica-Bold").text("EUROTRUCK");
    doc.fillColor("#5e6f88").fontSize(9).font("Helvetica").text("REPUESTOS / SERVICIOS");
    doc.moveDown(1.4);
    doc.fillColor("#111827").fontSize(18).font("Helvetica-Bold").text("ORDEN DE COMPRA");
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#2563eb").text(data.order.orderNumber);
    doc.moveDown(.7);
    doc.fontSize(9).font("Helvetica").fillColor("#374151").text(`Fecha: ${new Date(data.order.createdAt).toLocaleString("es-DO")}`);
    doc.text(`Estado: ${data.order.status === "new" ? "Solicitud abierta" : data.order.status === "taken" ? "En atención" : "Cerrada"}`);
    doc.moveDown(1);
    doc.fillColor("#12336d").font("Helvetica-Bold").text("DATOS DEL CLIENTE");
    doc.fillColor("#374151").font("Helvetica").text(`Empresa / Flota: ${data.order.company}`);
    doc.text(`Correo: ${data.order.email}`);
    doc.text(`Teléfono / WhatsApp: ${data.order.phone}`);
    doc.text(`Contacto Eurotruck: ${COMPANY_PHONE}`);
    if (data.order.rnc) doc.text(`RNC: ${data.order.rnc}`);
    if (data.order.truckBrand) doc.text(`Marca principal: ${data.order.truckBrand}`);
    doc.moveDown(1);
    doc.fillColor("#12336d").font("Helvetica-Bold").text("ARTÍCULOS SOLICITADOS");
    doc.moveDown(.4);
    data.items.forEach((item, index) => {
      doc.fillColor("#111827").font("Helvetica-Bold").text(`${index + 1}. ${item.name} · Cantidad: ${item.quantity || 1}`);
      doc.fillColor("#4b5563").font("Helvetica").text(`Referencia: ${item.sku} · Marca: ${item.brand || "—"} · Aplicación: ${item.application || "—"}`);
      doc.moveDown(.35);
    });
    if (data.order.partsNote) {
      doc.moveDown(.5).fillColor("#12336d").font("Helvetica-Bold").text("NOTAS DEL CLIENTE");
      doc.fillColor("#374151").font("Helvetica").text(data.order.partsNote);
    }
    doc.moveDown(2);
    doc.fillColor("#6b7280").fontSize(8).text("Solicitud recibida. Un asesor Eurotruck contactará al cliente por teléfono o WhatsApp para confirmar disponibilidad, precio y despacho.");
    doc.end();
  });
}
