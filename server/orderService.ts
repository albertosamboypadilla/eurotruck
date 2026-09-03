import PDFDocument from "pdfkit";
import type { OrderWithItems } from "./db";

export const COMPANY_PHONE = "8094130846";

const BLUE = "#12336d";
const BLUE_BRIGHT = "#2563eb";
const NAVY = "#0b1730";
const TEXT = "#1f2937";
const MUTED = "#64748b";
const LINE = "#dbe4ef";

function money(value: number) {
  return `RD$ ${value.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function drawEurotruckLogo(doc: PDFKit.PDFDocument, x: number, y: number) {
  doc.save();
  doc.roundedRect(x, y, 82, 42, 8).fill(BLUE);
  doc.rect(x + 9, y + 17, 35, 13).fill("#60a5fa");
  doc.rect(x + 43, y + 11, 22, 19).fill(BLUE_BRIGHT);
  doc.polygon([x + 65, y + 18], [x + 74, y + 18], [x + 78, y + 30], [x + 65, y + 30]).fill(BLUE_BRIGHT);
  doc.circle(x + 25, y + 32, 5).fill(NAVY).circle(x + 62, y + 32, 5).fill(NAVY);
  doc.restore();
  doc.fillColor(BLUE).font("Helvetica-Bold").fontSize(18).text("EUROTRUCK", x + 94, y + 5, { characterSpacing: 1.1 });
  doc.fillColor(MUTED).font("Helvetica").fontSize(7).text("REPUESTOS / SERVICIOS", x + 95, y + 27, { characterSpacing: 1.4 });
}

function drawTableHeader(doc: PDFKit.PDFDocument, y: number) {
  const x = 48;
  doc.roundedRect(x, y, 516, 25, 5).fill(NAVY);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(7.3);
  doc.text("REFERENCIA", x + 8, y + 9, { width: 78 });
  doc.text("DESCRIPCIÓN", x + 90, y + 9, { width: 220 });
  doc.text("CANT.", x + 314, y + 9, { width: 44, align: "center" });
  doc.text("PRECIO", x + 362, y + 9, { width: 70, align: "right" });
  doc.text("TOTAL", x + 436, y + 9, { width: 72, align: "right" });
  return y + 29;
}

export function buildOrderPdf(data: OrderWithItems): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 48, info: { Title: `Cotización ${data.order.orderNumber}`, Author: "Eurotruck" } });
    const chunks: Buffer[] = [];
    doc.on("data", chunk => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    drawEurotruckLogo(doc, 48, 38);
    doc.fillColor(BLUE).font("Helvetica-Bold").fontSize(19).text("COTIZACIÓN", 360, 42, { width: 204, align: "right" });
    doc.fillColor(BLUE_BRIGHT).fontSize(10).text(data.order.orderNumber, 360, 66, { width: 204, align: "right" });
    doc.fillColor(MUTED).font("Helvetica").fontSize(7.5).text(new Date(data.order.createdAt).toLocaleString("es-DO"), 360, 82, { width: 204, align: "right" });

    doc.moveTo(48, 102).lineTo(564, 102).lineWidth(1.5).strokeColor(BLUE_BRIGHT).stroke();
    doc.roundedRect(48, 118, 516, 93, 8).fillAndStroke("#f5f8fc", LINE);
    doc.fillColor(BLUE).font("Helvetica-Bold").fontSize(8).text("DATOS DEL CLIENTE", 62, 132, { characterSpacing: .6 });
    doc.fillColor(TEXT).font("Helvetica-Bold").fontSize(10).text(data.order.company, 62, 151, { width: 235 });
    doc.fillColor(MUTED).font("Helvetica").fontSize(8).text(`Teléfono: ${data.order.phone}`, 62, 169).text(`Correo: ${data.order.email}`, 62, 182, { width: 235 });
    doc.fillColor(TEXT).font("Helvetica-Bold").fontSize(8).text("INFORMACIÓN DE LA SOLICITUD", 322, 132);
    doc.fillColor(MUTED).font("Helvetica").fontSize(8).text(`RNC: ${data.order.rnc || "—"}`, 322, 151).text(`Flota / marca: ${data.order.truckBrand || "—"}`, 322, 165).text(`Contacto Eurotruck: ${COMPANY_PHONE}`, 322, 179);

    let y = drawTableHeader(doc, 228);
    let subtotal = 0;
    let pendingPrices = 0;
    data.items.forEach(item => {
      const quantity = item.quantity || 1;
      const unitPrice = Number(item.unitPrice || 0);
      const lineTotal = quantity * unitPrice;
      subtotal += lineTotal;
      if (unitPrice <= 0) pendingPrices += 1;
      const description = `${item.name}${item.brand ? ` · ${item.brand}` : ""}${item.application ? ` · ${item.application}` : ""}`;
      const rowHeight = Math.max(34, doc.font("Helvetica").fontSize(8).heightOfString(description, { width: 218 }) + 14);
      if (y + rowHeight > 690) {
        doc.addPage();
        drawEurotruckLogo(doc, 48, 34);
        y = drawTableHeader(doc, 96);
      }
      doc.rect(48, y, 516, rowHeight).fillAndStroke("#ffffff", LINE);
      doc.fillColor(BLUE).font("Helvetica-Bold").fontSize(8).text(item.sku, 56, y + 10, { width: 76 });
      doc.fillColor(TEXT).font("Helvetica").fontSize(8).text(description, 138, y + 9, { width: 218 });
      doc.fillColor(TEXT).font("Helvetica-Bold").text(String(quantity), 362, y + 10, { width: 40, align: "center" });
      doc.fillColor(unitPrice > 0 ? TEXT : "#b7791f").font("Helvetica").text(unitPrice > 0 ? money(unitPrice).replace("RD$ ", "") : "Pendiente", 410, y + 10, { width: 70, align: "right" });
      doc.fillColor(TEXT).font("Helvetica-Bold").text(unitPrice > 0 ? money(lineTotal).replace("RD$ ", "") : "—", 484, y + 10, { width: 72, align: "right" });
      y += rowHeight;
    });

    if (!data.items.length) {
      doc.rect(48, y, 516, 48).fillAndStroke("#ffffff", LINE);
      doc.fillColor(MUTED).font("Helvetica-Oblique").fontSize(9).text("Cotización sin artículos. Requiere revisión administrativa.", 60, y + 18, { width: 492, align: "center" });
      y += 52;
    }

    if (y > 600) { doc.addPage(); drawEurotruckLogo(doc, 48, 34); y = 100; }
    doc.roundedRect(348, y + 18, 216, 70, 8).fill("#eef4ff");
    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8).text("SUBTOTAL", 364, y + 32, { width: 84 });
    doc.fillColor(TEXT).font("Helvetica-Bold").fontSize(9).text(money(subtotal), 448, y + 31, { width: 100, align: "right" });
    doc.fillColor(BLUE).fontSize(9).text("TOTAL COTIZADO", 364, y + 57, { width: 104 });
    doc.fillColor(BLUE_BRIGHT).fontSize(12).text(money(subtotal), 452, y + 54, { width: 96, align: "right" });

    if (data.order.partsNote) {
      doc.fillColor(BLUE).font("Helvetica-Bold").fontSize(8).text("NOTA DEL CLIENTE", 48, y + 22);
      doc.fillColor(TEXT).font("Helvetica").fontSize(8).text(data.order.partsNote, 48, y + 38, { width: 275, height: 48, ellipsis: true });
    }
    y += 110;
    if (pendingPrices) doc.roundedRect(48, y, 516, 31, 6).fill("#fff7df").fillColor("#8a5a00").font("Helvetica-Bold").fontSize(8).text(`${pendingPrices} referencia${pendingPrices === 1 ? "" : "s"} pendiente${pendingPrices === 1 ? "" : "s"} de precio. El total cambiará al completar la cotización.`, 60, y + 11, { width: 492 });
    y += pendingPrices ? 45 : 0;
    doc.fillColor(BLUE).font("Helvetica-Bold").fontSize(8).text("CONDICIONES", 48, y);
    doc.fillColor(MUTED).font("Helvetica").fontSize(7.5).text("Validez: 7 días. Precios y disponibilidad sujetos a confirmación final. Impuestos, instalación y entrega se aplican únicamente cuando estén indicados por el asesor.", 48, y + 15, { width: 516, lineGap: 2 });
    doc.moveTo(48, 744).lineTo(564, 744).strokeColor(LINE).stroke();
    doc.fillColor(MUTED).fontSize(7).text("EUROTRUCK · Repuestos y servicios para camiones europeos", 48, 753, { width: 516, align: "center" });
    doc.end();
  });
}
