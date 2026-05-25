import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "node:fs";
import path from "node:path";
import { ROLES } from "@/src/lib/auth/roles";
import { getSession } from "@/src/lib/auth/session";
import { getWeeklyBroadcastRows } from "@/src/lib/reports/weekly";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.role !== ROLES.admin) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? toDateInput(new Date());
  const to = searchParams.get("to") ?? toDateInput(addDays(new Date(), 7));

  const fromIso = `${from}T00:00:00.000Z`;
  const toIso = `${to}T23:59:59.999Z`;
  const rows = await getWeeklyBroadcastRows({ fromIso, toIso });

  // 1. Create jsPDF in landscape layout (A4: 842 x 595 points)
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  // 2. Load and add logos if they exist
  try {
    const rivasPath = path.join(process.cwd(), "imagenes", "Rivas.png");
    if (fs.existsSync(rivasPath)) {
      const rivasBase64 = fs.readFileSync(rivasPath).toString("base64");
      doc.addImage(`data:image/png;base64,${rivasBase64}`, "PNG", 40, 20, 100, 40);
    }
    const hockeyPath = path.join(process.cwd(), "imagenes", "hockey tv.png");
    if (fs.existsSync(hockeyPath)) {
      const hockeyBase64 = fs.readFileSync(hockeyPath).toString("base64");
      doc.addImage(`data:image/png;base64,${hockeyBase64}`, "PNG", 588, 22, 214, 35);
    }
  } catch (err) {
    console.error("Error loading images in PDF generation:", err);
  }

  // 3. Document headers styled in center
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 26, 26); // Rivas red
  doc.text("RIVAS HOCKEY TV", 421, 30, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 90);
  doc.text("PARTIDOS DE LA SEMANA", 421, 48, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 130);
  doc.text(`Rango: ${from} a ${to}`, 421, 64, { align: "center" });

  // 4. Generate Autotable with columns matching the DOCX template
  autoTable(doc, {
    startY: 85,
    margin: { left: 40, right: 40 },
    head: [["PARTIDO", "FECHA", "HORA", "LINK YOUTUBE"]],
    body: rows.map((row) => ({
      partido: row.title,
      fecha: row.dateLabel,
      hora: row.timeLabel,
      url: row.watchUrl || "-",
    })),
    columns: [
      { header: "PARTIDO", dataKey: "partido" },
      { header: "FECHA", dataKey: "fecha" },
      { header: "HORA", dataKey: "hora" },
      { header: "LINK YOUTUBE", dataKey: "url" },
    ],
    styles: { fontSize: 9.5, cellPadding: 6, font: "helvetica" },
    headStyles: { fillColor: [255, 26, 26], textColor: [255, 255, 255], fontStyle: "bold" },
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

  // 5. Add NOTAS disclaimer box below the table
  const lastY = (doc as any).lastAutoTable.finalY ?? 85;
  let notesY = lastY + 30;
  if (notesY + 60 > 550) {
    doc.addPage();
    notesY = 40;
  }

  doc.setDrawColor(255, 26, 26); // Rivas red border
  doc.setFillColor(255, 250, 250); // Light red background tint
  doc.rect(40, notesY, 762, 45, "FD");

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

  const pdfBytes = doc.output("arraybuffer");
  const fileName = `programaciones-${from}-a-${to}.pdf`;

  return new NextResponse(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}

function addDays(value: Date, days: number) {
  const out = new Date(value);
  out.setDate(out.getDate() + days);
  return out;
}

function toDateInput(value: Date) {
  const y = value.getUTCFullYear();
  const m = String(value.getUTCMonth() + 1).padStart(2, "0");
  const d = String(value.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
