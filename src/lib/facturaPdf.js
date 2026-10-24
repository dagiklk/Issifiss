import { jsPDF } from "jspdf";

// Datos fijos del emisor (el fisio de la clínica). Si algún día hay más de
// un fisio emitiendo facturas, esto tendría que salir de una tabla en vez
// de ser una constante — por ahora issifiss es un único profesional.
const EMISOR = {
  nombre: "Isaac Rodríguez Sánchez",
  profesion: "Fisioterapeuta",
  nif: "49142026-L",
  colegiado: "18371",
  direccion: "C/PALENCIA 8 3ªD",
};

const FORMA_PAGO_LABEL = { bizum: "BIZUM", transferencia: "TRANSFERENCIA", efectivo: "EFECTIVO" };

const TEAL_DARK = [20, 106, 93];
const TEAL = [30, 130, 113];
const BG_LIGHT = [234, 241, 239];
const INK = [29, 29, 31];
const INK_MUTED = [110, 110, 115];
const LINE = [222, 222, 224];

function formatFecha(fechaISO) {
  const [y, m, d] = fechaISO.split("-");
  return `${Number(d)}-${Number(m)}-${y}`;
}

function formatImporte(n) {
  return `${Number(n).toFixed(2).replace(".", ",")}€`;
}

// factura: { numero, fecha, concepto, importe, formaPago, nombreCliente, dniCliente }
export function generarFacturaPdf(factura) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 20;
  const rightColX = pageWidth / 2 + 5;
  let y = 28;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEAL_DARK);
  doc.setFontSize(30);
  doc.text("FACTURA", pageWidth - marginX, y, { align: "right" });

  y += 5;
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.7);
  doc.line(pageWidth - 82, y, pageWidth - marginX, y);

  y += 9;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...INK_MUTED);
  doc.text("Nº FACTURA:", pageWidth - 82, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...INK);
  doc.text(factura.numero, pageWidth - marginX, y, { align: "right" });

  y += 6.5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...INK_MUTED);
  doc.text("FECHA:", pageWidth - 82, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...INK);
  doc.text(formatFecha(factura.fecha), pageWidth - marginX, y, { align: "right" });

  // EMISOR / CLIENTE
  y = 62;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...TEAL_DARK);
  doc.text("EMISOR", marginX, y);
  doc.text("CLIENTE", rightColX, y);

  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.4);
  doc.line(marginX, y + 2, marginX + 78, y + 2);
  doc.line(rightColX, y + 2, rightColX + 78, y + 2);

  y += 9;
  doc.setFontSize(10);
  doc.setTextColor(...INK);

  let yEmisor = y;
  doc.setFont("helvetica", "bold");
  doc.text(EMISOR.nombre, marginX, yEmisor);
  yEmisor += 6;
  doc.setFont("helvetica", "normal");
  [EMISOR.profesion, `NIF: ${EMISOR.nif}`, `Nº Colegiado: ${EMISOR.colegiado}`, `Dirección: ${EMISOR.direccion}`].forEach(
    (line) => {
      doc.text(line, marginX, yEmisor);
      yEmisor += 6;
    }
  );

  let yCliente = y;
  doc.setFont("helvetica", "normal");
  doc.text(`Nombre: ${factura.nombreCliente}`, rightColX, yCliente);
  yCliente += 6;
  doc.text(`DNI/NIF: ${factura.dniCliente}`, rightColX, yCliente);

  // Tabla concepto / importe
  y = Math.max(yEmisor, yCliente) + 10;
  const tableWidth = pageWidth - marginX * 2;
  doc.setFillColor(...BG_LIGHT);
  doc.rect(marginX, y, tableWidth, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEAL_DARK);
  doc.text("CONCEPTO", marginX + 3, y + 6);
  doc.text("IMPORTE", pageWidth - marginX - 3, y + 6, { align: "right" });

  y += 9;
  doc.setDrawColor(...LINE);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 9;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text(factura.concepto, marginX + 3, y);
  doc.text(formatImporte(factura.importe), pageWidth - marginX - 3, y, { align: "right" });

  y += 6;
  doc.setDrawColor(...LINE);
  doc.line(marginX, y, pageWidth - marginX, y);

  // IVA exento (caja a la izquierda, a la altura del TOTAL)
  const ivaText = "IVA: EXENTO-ART.20.1.3ªLEY 37/1992";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...INK_MUTED);
  doc.setDrawColor(...INK_MUTED);
  const ivaWidth = doc.getTextWidth(ivaText) + 6;
  doc.rect(marginX, y + 7, ivaWidth, 7);
  doc.text(ivaText, marginX + 3, y + 11.8);

  // TOTAL (caja a la derecha)
  doc.setFillColor(...BG_LIGHT);
  doc.rect(pageWidth - marginX - 60, y + 6, 60, 11, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEAL_DARK);
  doc.text("TOTAL", pageWidth - marginX - 55, y + 13.2);
  doc.setFontSize(12.5);
  doc.text(formatImporte(factura.importe), pageWidth - marginX - 3, y + 13.2, { align: "right" });

  // Forma de pago
  y += 32;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...TEAL_DARK);
  doc.text("FORMA DE PAGO:", marginX, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...INK);
  doc.text(FORMA_PAGO_LABEL[factura.formaPago] || String(factura.formaPago).toUpperCase(), marginX + 38, y);

  y += 4;
  doc.setDrawColor(...LINE);
  doc.line(marginX, y, pageWidth - marginX, y);

  // Pie
  const footerY = 268;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...INK_MUTED);
  doc.text("Servicio de fisioterapia.", marginX, footerY);
  doc.text("Gracias por confiar en ISSIFISS.", marginX, footerY + 5);

  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.4);
  doc.line(marginX, footerY + 12, pageWidth - marginX, footerY + 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEAL_DARK);
  doc.text("ISSIFISS · Fisioterapia Avanzada", pageWidth / 2, footerY + 20, { align: "center" });

  doc.save(`Factura_${factura.numero}.pdf`);
}
