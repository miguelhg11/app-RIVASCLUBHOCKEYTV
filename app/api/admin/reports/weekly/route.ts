import { NextResponse } from "next/server";
import { ROLES } from "@/src/lib/auth/roles";
import { getSession } from "@/src/lib/auth/session";
import { generateWeeklyReportPdf } from "@/src/lib/reports/weekly-pdf";

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

  try {
    const pdfBuffer = await generateWeeklyReportPdf(from, to);
    const fileName = `programaciones-${from}-a-${to}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generating weekly report PDF:", error);
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
