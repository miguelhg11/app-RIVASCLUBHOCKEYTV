import { NextResponse } from "next/server";
import { getSession } from "@/src/lib/auth/session";
import { ROLES } from "@/src/lib/auth/roles";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";
import { getYouTubeLiveConcurrentViewers } from "@/src/lib/youtube/service";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

import { getYouTubeLiveConcurrentViewers, getYouTubeVideoAnalytics } from "@/src/lib/youtube/service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.role !== ROLES.admin) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const { id: videoId } = await params;
  if (!videoId) {
    return NextResponse.json({ error: "ID de vídeo no especificado" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServerClient();

    // 1. Fetch broadcast title from DB
    let title = "Partido de YouTube";
    let dateStr = "-";

    const [appBc, extBc] = await Promise.all([
      supabase.from("broadcasts").select("title, scheduled_start").eq("youtube_broadcast_id", videoId).maybeSingle(),
      supabase.from("youtube_external_broadcasts").select("title, scheduled_start").like("youtube_watch_url", `%${videoId}%`).maybeSingle()
    ]);

    if (appBc.data) {
      title = appBc.data.title;
      dateStr = appBc.data.scheduled_start ? new Date(appBc.data.scheduled_start).toLocaleDateString("es-ES") : "-";
    } else if (extBc.data) {
      title = extBc.data.title;
      dateStr = extBc.data.scheduled_start ? new Date(extBc.data.scheduled_start).toLocaleDateString("es-ES") : "-";
    }

    // 2. Fetch geolocated analytics
    const [dbRes, concurrentViewers, ytAnalytics] = await Promise.all([
      supabase
        .from("broadcast_analytics")
        .select("city, region, country, device_type")
        .eq("broadcast_id", videoId),
      getYouTubeLiveConcurrentViewers(videoId),
      getYouTubeVideoAnalytics(videoId).catch((err) => {
        console.error(`Error fetching YouTube Analytics API for PDF ${videoId}:`, err);
        return null;
      })
    ]);

    if (dbRes.error) {
      throw dbRes.error;
    }

    const records = dbRes.data || [];
    const totalLocalViews = records.length;
    const estimatedLocalMinutes = totalLocalViews * 12;

    // Group and aggregate by City
    const cityCounts: Record<string, { count: number; region: string }> = {};
    const deviceCounts: Record<string, number> = {};

    // Populate with local records
    for (const r of records) {
      const cityName = r.city || "Desconocido";
      if (!cityCounts[cityName]) {
        cityCounts[cityName] = { count: 0, region: r.region || "" };
      }
      cityCounts[cityName].count++;

      const devName = r.device_type || "ORDENADOR";
      deviceCounts[devName] = (deviceCounts[devName] || 0) + 1;
    }

    // Aggregate YouTube Analytics API data if available
    if (ytAnalytics) {
      for (const p of ytAnalytics.provincias) {
        const cityName = p.name || "Desconocido";
        if (!cityCounts[cityName]) {
          cityCounts[cityName] = { count: 0, region: p.code };
        }
        cityCounts[cityName].count += p.views;
      }
      for (const d of ytAnalytics.devices) {
        const devName = d.type || "ORDENADOR";
        deviceCounts[devName] = (deviceCounts[devName] || 0) + d.views;
      }
    }

    const totalAggregatedViewsForProvinces = Object.values(cityCounts).reduce((acc, c) => acc + c.count, 0);
    const totalAggregatedViewsForDevices = Object.values(deviceCounts).reduce((acc, c) => acc + c, 0);

    const provincias = Object.entries(cityCounts).map(([name, val]) => ({
      name,
      views: val.count,
      percentage: totalAggregatedViewsForProvinces > 0 ? Math.round((val.count / totalAggregatedViewsForProvinces) * 100) : 0
    })).sort((a, b) => b.views - a.views);

    const devices = Object.entries(deviceCounts).map(([type, count]) => ({
      type,
      views: count,
      percentage: totalAggregatedViewsForDevices > 0 ? Math.round((count / totalAggregatedViewsForDevices) * 100) : 0
    })).sort((a, b) => b.views - a.views);

    const finalViews = Math.max(ytAnalytics?.views || 0, totalLocalViews);
    const finalMinutes = Math.max(ytAnalytics?.estimatedMinutesWatched || 0, estimatedLocalMinutes);

    // 3. Create PDF layout
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    // Draw logos if they exist
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
      console.error("Error loading images in analytics PDF:", err);
    }

    // Title Block
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 26, 26); // Rivas red
    doc.text("INFORME DE AUDITORÍA Y ESTADÍSTICAS", 421, 30, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 90);
    doc.text("Métricas geográficas y técnicas obtenidas en tiempo real", 421, 48, { align: "center" });

    // Event Info (aligned to the right)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(`EVENTO: ${title.toUpperCase()}`, 802, 70, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(`ID del vídeo: ${videoId} | Fecha del partido: ${dateStr}`, 802, 85, { align: "right" });

    // Summary Cards (3 columns)
    const cardY = 100;
    const cardW = 230;
    const cardH = 45;

    // Card 1: Views
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(255, 255, 255);
    doc.rect(40, cardY, cardW, cardH, "D");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text(String(finalViews), 55, cardY + 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 130);
    doc.text("VISUALIZACIONES (CLICS EN ENLACE)", 55, cardY + 35);

    // Card 2: Estimated time
    doc.rect(290, cardY, cardW, cardH, "D");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text(`${finalMinutes} min`, 305, cardY + 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 130);
    doc.text("TIEMPO ESTIMADO REPRODUCIDO", 305, cardY + 35);

    // Card 3: Concurrent viewers
    doc.rect(540, cardY, cardW, cardH, "D");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(concurrentViewers !== null ? 255 : 30, concurrentViewers !== null ? 26 : 30, concurrentViewers !== null ? 26 : 30);
    doc.text(concurrentViewers !== null ? String(concurrentViewers) : "-", 555, cardY + 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 130);
    doc.text(concurrentViewers !== null ? "ESPECTADORES EN VIVO AHORA" : "ESPECTADORES CONCURRENTES (VIVO)", 555, cardY + 35);

    // Table 1: Geolocation Cities (Ordered de mayor a menor)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 26, 26);
    doc.text("DESGLOSE DE VISITAS POR LOCALIDAD / MUNICIPIO", 40, cardY + 70);

    autoTable(doc, {
      startY: cardY + 80,
      margin: { left: 40, right: 40 },
      theme: "grid",
      head: [["LOCALIDAD / CIUDAD", "VISITAS (CLICS)", "PORCENTAJE DEL TOTAL"]],
      body: provincias.map((p) => [p.name, p.views, `${p.percentage}%`]),
      styles: { 
        fontSize: 9, 
        cellPadding: 5, 
        font: "helvetica",
        fillColor: false,
        textColor: [30, 30, 30],
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: false,
        textColor: [255, 26, 26],
        fontStyle: "bold",
        lineColor: [0, 0, 0],
        lineWidth: 1,
      },
      columnStyles: {
        0: { cellWidth: 362 },
        1: { cellWidth: 200, halign: "center" },
        2: { cellWidth: 200, halign: "center" },
      }
    });

    // Page 2: Devices and Suspicious sharing alert
    const lastY = (doc as any).lastAutoTable.finalY ?? cardY + 180;
    let nextBlockY = lastY + 30;

    if (nextBlockY + 180 > 550) {
      doc.addPage();
      nextBlockY = 45;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 26, 26);
    doc.text("DISTRIBUCIÓN POR TIPO DE DISPOSITIVO", 40, nextBlockY);

    autoTable(doc, {
      startY: nextBlockY + 10,
      margin: { left: 40, right: 40 },
      theme: "grid",
      head: [["TIPO DE DISPOSITIVO", "VISITAS (CLICS)", "PORCENTAJE"]],
      body: devices.map((d) => [d.type, d.views, `${d.percentage}%`]),
      styles: { 
        fontSize: 9, 
        cellPadding: 5, 
        font: "helvetica",
        fillColor: false,
        textColor: [30, 30, 30],
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: false,
        textColor: [255, 26, 26],
        fontStyle: "bold",
        lineColor: [0, 0, 0],
        lineWidth: 1,
      },
      columnStyles: {
        0: { cellWidth: 362 },
        1: { cellWidth: 200, halign: "center" },
        2: { cellWidth: 200, halign: "center" },
      }
    });
    // 4. Merge watermark background PDF using pdf-lib
    const jsPdfBytes = doc.output("arraybuffer");
    const baseDoc = await PDFDocument.load(jsPdfBytes);

    const watermarkPath = path.join(process.cwd(), "docs", "marca agua.pdf");
    let finalPdfBytes: any = new Uint8Array(jsPdfBytes);

    if (fs.existsSync(watermarkPath)) {
      const watermarkBytes = fs.readFileSync(watermarkPath);
      const watermarkDoc = await PDFDocument.load(watermarkBytes);

      const finalDoc = await PDFDocument.create();

      const [embeddedWatermark] = await finalDoc.embedPdf(watermarkDoc, [0]);
      const embeddedPages = await finalDoc.embedPages(baseDoc.getPages());

      for (let i = 0; i < embeddedPages.length; i++) {
        const newPage = finalDoc.addPage([841.92, 595.32]);

        // Background
        newPage.drawPage(embeddedWatermark, {
          x: 0,
          y: 0,
          width: 841.92,
          height: 595.32,
        });

        // Content
        newPage.drawPage(embeddedPages[i], {
          x: 0,
          y: 0,
          width: 841.92,
          height: 595.32,
        });
      }

      finalPdfBytes = await finalDoc.save();
    }

    const fileName = `estadisticas-${videoId}.pdf`;

    return new NextResponse(finalPdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error(`Error generating event stats PDF for ${videoId}:`, error);
    return NextResponse.json({ error: "Error al generar el informe de estadísticas" }, { status: 500 });
  }
}
