import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { getWeeklyBroadcastRows } from "./weekly";
import { getYouTubeUrl } from "@/src/lib/youtube/url";

export async function generateWeeklyReportPdf(from: string, to: string): Promise<Buffer> {
  const fromIso = `${from}T00:00:00.000Z`;
  const toIso = `${to}T23:59:59.999Z`;
  const rows = await getWeeklyBroadcastRows({ fromIso, toIso });

  // 1. Create base PDF using jsPDF (Landscape A4: 842 x 595 points)
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  // Document title and subtitles (Title centered, subtitles on the right to clear logo)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 26, 26); // Rivas red
  doc.text("RIVAS HOCKEY TV", 421, 35, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 90);
  doc.text("PARTIDOS DE LA SEMANA", 802, 53, { align: "right" });

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 130);
  doc.text(`Rango: ${from} a ${to}`, 802, 69, { align: "right" });

  // 2. Generate Autotable with columns matching the DOCX template (transparent style with grid lines)
  autoTable(doc, {
    startY: 90,
    margin: { left: 40, right: 40 },
    theme: "grid",
    head: [["PARTIDO", "FECHA", "HORA", "LINK YOUTUBE"]],
    body: rows.map((row) => {
      const displayUrl = row.watchUrl
        ? getYouTubeUrl(row.watchUrl)
        : row.youtubeBroadcastId
          ? getYouTubeUrl(row.youtubeBroadcastId)
          : "-";

      return {
        partido: row.title,
        fecha: row.dateLabel,
        hora: row.timeLabel,
        url: displayUrl,
      };
    }),
    columns: [
      { header: "PARTIDO", dataKey: "partido" },
      { header: "FECHA", dataKey: "fecha" },
      { header: "HORA", dataKey: "hora" },
      { header: "LINK YOUTUBE", dataKey: "url" },
    ],
    styles: { 
      fontSize: 9.5, 
      cellPadding: 6, 
      font: "helvetica",
      fillColor: false, // Transparent cells
      textColor: [0, 0, 0], // Dark text
      lineColor: [0, 0, 0], // Dark black lines
      lineWidth: 0.5,
    },
    headStyles: { 
      fillColor: false, // Transparent header background
      textColor: [255, 26, 26], // Red header text
      fontStyle: "bold",
      lineColor: [0, 0, 0], // Dark black lines for header too
      lineWidth: 1,
    },
    columnStyles: {
      partido: { cellWidth: 320 },
      fecha: { cellWidth: 100, halign: "center" },
      hora: { cellWidth: 80, halign: "center" },
      url: { cellWidth: 262, textColor: [0, 102, 204] }, // Blue color for URLs
    },
    didDrawCell: (data) => {
      // Add active link regions on the PDF for the URL column
      if (data.section !== "body" || data.column.dataKey !== "url") return;
      const raw = data.row.raw as { url?: string };
      if (!raw?.url || raw.url === "-") return;
      doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: raw.url });
    },
  });

  // 3. Add NOTAS disclaimer box below the table (transparent outline box)
  const lastY = (doc as any).lastAutoTable.finalY ?? 90;
  let notesY = lastY + 30;
  if (notesY + 60 > 550) {
    doc.addPage();
    notesY = 45;
  }

  doc.setDrawColor(255, 26, 26); // Rivas red border
  doc.rect(40, notesY, 762, 45, "D"); // Outline-only (no background fill)

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 26, 26);
  doc.text("NOTAS:", 50, notesY + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text(
    "Puede que por motivos técnicos u otros las programaciones finalmente no puedan emitirse. Disculpen las molestias.",
    50,
    notesY + 30
  );

  // 4. Load watermark PDF and merge with pdf-lib
  const jsPdfBytes = doc.output("arraybuffer");
  const baseDoc = await PDFDocument.load(jsPdfBytes);
  
  const watermarkPath = path.join(process.cwd(), "docs", "marca agua.pdf");
  
  if (fs.existsSync(watermarkPath)) {
    const watermarkBytes = fs.readFileSync(watermarkPath);
    const watermarkDoc = await PDFDocument.load(watermarkBytes);
    
    const finalDoc = await PDFDocument.create();
    
    // Embed the watermark page and all base pages
    const [embeddedWatermark] = await finalDoc.embedPdf(watermarkDoc, [0]);
    const embeddedPages = await finalDoc.embedPages(baseDoc.getPages());
    
    for (let i = 0; i < embeddedPages.length; i++) {
      // Add a landscape A4 page (841.92 x 595.32)
      const newPage = finalDoc.addPage([841.92, 595.32]);
      
      // Draw watermark as background
      newPage.drawPage(embeddedWatermark, {
        x: 0,
        y: 0,
        width: 841.92,
        height: 595.32,
      });
      
      // Draw the text content page on top
      newPage.drawPage(embeddedPages[i], {
        x: 0,
        y: 0,
        width: 841.92,
        height: 595.32,
      });
    }
    
    const finalPdfBytes = await finalDoc.save();
    return Buffer.from(finalPdfBytes);
  }

  // Fallback: If watermark file doesn't exist, return base PDF
  return Buffer.from(jsPdfBytes);
}

function toDateInput(value: Date) {
  const y = value.getUTCFullYear();
  const m = String(value.getUTCMonth() + 1).padStart(2, "0");
  const d = String(value.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
