import { NextResponse } from "next/server";
import { generateWeeklyReportPdf } from "@/src/lib/reports/weekly-pdf";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Calculate Friday to Thursday for the current week by default
  const now = new Date();
  const currentDay = now.getUTCDay(); 
  let offsetToFriday = currentDay - 5;
  if (offsetToFriday < 0) {
    offsetToFriday = 7 + offsetToFriday;
  }
  
  const friday = new Date(now);
  friday.setUTCDate(now.getUTCDate() - offsetToFriday);
  
  const thursday = new Date(friday);
  thursday.setUTCDate(friday.getUTCDate() + 6);

  const from = searchParams.get("from") ?? toDateInput(friday);
  const to = searchParams.get("to") ?? toDateInput(thursday);

  try {
    const pdfBuffer = await generateWeeklyReportPdf(from, to);
    const fileName = `programaciones-${from}-a-${to}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error) {
    console.error("Error generating public weekly report PDF:", error);
    return NextResponse.json({ error: "Error al generar el PDF" }, { status: 500 });
  }
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
