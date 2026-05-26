import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { RIVAS_THUMBNAIL_STYLE } from "@/src/lib/thumbnails/rivas-thumbnail-style";
import { createClient } from "@supabase/supabase-js";

async function getBackgroundBase64(id: string): Promise<string | null> {
  if (!id) return null;
  console.log("[getBackgroundBase64] Fetching background ID:", id);
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!supabaseUrl || !supabaseKey) {
      console.error("[getBackgroundBase64] Missing Supabase env variables!", { supabaseUrl, hasKey: !!supabaseKey });
      return null;
    }
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("thumbnail_backgrounds")
      .select("name, base64_data, url_path")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[getBackgroundBase64] Supabase database error:", error);
      return null;
    }
    if (!data) {
      console.warn("[getBackgroundBase64] No row found for ID:", id);
      return null;
    }

    console.log("[getBackgroundBase64] Background row found:", { name: data.name, hasBase64: !!data.base64_data, urlPath: data.url_path });

    if (data.base64_data) {
      return data.base64_data;
    }

    if (data.url_path) {
      let cleanPath = data.url_path;
      if (cleanPath.startsWith("/")) {
        cleanPath = cleanPath.slice(1);
      }
      const fullPath = path.join(process.cwd(), cleanPath);
      console.log("[getBackgroundBase64] Resolving local disk path:", fullPath);
      if (fs.existsSync(fullPath)) {
        const buffer = fs.readFileSync(fullPath);
        const ext = path.extname(cleanPath).toLowerCase().replace(".", "");
        const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
        return `data:${mime};base64,${buffer.toString("base64")}`;
      } else {
        console.warn("[getBackgroundBase64] Local disk path does not exist:", fullPath);
      }

      const publicPath = path.join(process.cwd(), "public", cleanPath);
      console.log("[getBackgroundBase64] Resolving public path fallback:", publicPath);
      if (fs.existsSync(publicPath)) {
        const buffer = fs.readFileSync(publicPath);
        const ext = path.extname(cleanPath).toLowerCase().replace(".", "");
        const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
        return `data:${mime};base64,${buffer.toString("base64")}`;
      } else {
        console.warn("[getBackgroundBase64] Public fallback path does not exist:", publicPath);
      }
    }
  } catch (err) {
    console.error("[getBackgroundBase64] Critical exception:", err);
  }
  return null;
}


export const runtime = "nodejs"; // Asegura entorno Node.js para poder leer archivos locales con fs

// Cache en memoria para fuentes
let fontBold: ArrayBuffer | null = null;
let fontRegular: ArrayBuffer | null = null;

async function loadFonts() {
  try {
    if (!fontBold) {
      // Descargamos Outfit Bold
      fontBold = await fetch(
        "https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-700-normal.ttf"
      ).then((res) => res.arrayBuffer());
    }
    if (!fontRegular) {
      // Descargamos Outfit Regular/Medium
      fontRegular = await fetch(
        "https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-500-normal.ttf"
      ).then((res) => res.arrayBuffer());
    }
  } catch (err) {
    console.error("Error cargando fuentes remotas, se usará fuente por defecto:", err);
  }
}

// Helper para convertir imagen a Base64 Data URL (para uso local)
function getLocalImageBase64(relativePath: string): string | null {
  try {
    const fullPath = path.join(process.cwd(), "public", relativePath);
    if (fs.existsSync(fullPath)) {
      const buffer = fs.readFileSync(fullPath);
      const ext = path.extname(relativePath).toLowerCase().replace(".", "");
      const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
      return `data:${mime};base64,${buffer.toString("base64")}`;
    }
  } catch (err) {
    console.error(`Error al convertir imagen local ${relativePath}:`, err);
  }
  return null;
}

// Helper para descargar imagen externa y convertirla a base64
async function getExternalImageBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = res.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch (err) {
    console.error(`Error al descargar imagen externa ${url}:`, err);
  }
  return null;
}

export async function GET(req: NextRequest) {
  return handleRender(req);
}

export async function POST(req: NextRequest) {
  return handleRender(req);
}

async function handleRender(req: NextRequest) {
  // Cargar fuentes
  await loadFonts();

  // Obtener parámetros
  let shortTitle = "1ª AUT MASC";
  let competitionLine = "1ª AUTONÓMICA MASCULINA - JORNADA 23";
  let localName = "CP RIVAS LAS LAGUNAS A";
  let visitorName = "CHP ALUCHE";
  let bottomLine = "25/05/2026 · 21:15 · POL. CERRO DEL TELÉGRAFO";
  let localLogo = "/badges/fmp/rivas.png";
  let visitorLogo = "/badges/fmp/aluche.png";
  let backgroundId = "";

  if (req.method === "POST") {
    try {
      const body = await req.json();
      if (body.shortTitle) shortTitle = body.shortTitle;
      if (body.competitionLine) competitionLine = body.competitionLine;
      if (body.localName) localName = body.localName;
      if (body.visitorName) visitorName = body.visitorName;
      if (body.bottomLine) bottomLine = body.bottomLine;
      if (body.localLogo) localLogo = body.localLogo;
      if (body.visitorLogo) visitorLogo = body.visitorLogo;
      if (body.backgroundId) backgroundId = body.backgroundId;
    } catch (e) {
      console.warn("No se pudo parsear el body JSON, usando defaults");
    }
  } else {
    const { searchParams } = new URL(req.url);
    shortTitle = searchParams.get("shortTitle") || shortTitle;
    competitionLine = searchParams.get("competitionLine") || competitionLine;
    localName = searchParams.get("localName") || localName;
    visitorName = searchParams.get("visitorName") || visitorName;
    bottomLine = searchParams.get("bottomLine") || bottomLine;
    localLogo = searchParams.get("localLogo") || localLogo;
    visitorLogo = searchParams.get("visitorLogo") || visitorLogo;
    backgroundId = searchParams.get("backgroundId") || "";
  }

  // Cargar plantilla overlay (siempre es plantilla.png)
  const overlayBase64 = getLocalImageBase64("thumbnails/plantilla.png");
  if (!overlayBase64) {
    return new Response("Error: No se pudo cargar la plantilla base de miniaturas.", { status: 500 });
  }

  // Cargar fondo seleccionado si existe
  let backgroundBase64: string | null = null;
  if (backgroundId) {
    backgroundBase64 = await getBackgroundBase64(backgroundId);
  }

  // Cargar escudos base64
  let localLogoData: string | null = null;
  if (localLogo) {
    if (localLogo.startsWith("/")) {
      localLogoData = getLocalImageBase64(localLogo);
    } else {
      localLogoData = await getExternalImageBase64(localLogo);
    }
  }
  // Fallback si falla
  if (!localLogoData) {
    localLogoData = getLocalImageBase64("badges/fmp/rivas.png");
  }

  let visitorLogoData: string | null = null;
  if (visitorLogo) {
    if (visitorLogo.startsWith("/")) {
      visitorLogoData = getLocalImageBase64(visitorLogo);
    } else {
      visitorLogoData = await getExternalImageBase64(visitorLogo);
    }
  }
  // Fallback si falla
  if (!visitorLogoData) {
    visitorLogoData = getLocalImageBase64("badges/fmp/rivas.png");
  }

  const style = RIVAS_THUMBNAIL_STYLE;

  // AUTOAJUSTE DE TAMAÑO DE FUENTE BASADO EN CARACTERES
  // El espacio asignado al título es de 630px.
  // Con un fontSize de 66px, caben unos ~10 caracteres sin problemas.
  // Si supera esa longitud, reducimos dinámicamente el tamaño de la fuente para evitar saltos de línea.
  let dynamicTitleFontSize = style.textBoxes.shortTitle.fontSize;
  const titleLen = shortTitle.length;
  if (titleLen > 18) {
    dynamicTitleFontSize = 36;
  } else if (titleLen > 15) {
    dynamicTitleFontSize = 42;
  } else if (titleLen > 12) {
    dynamicTitleFontSize = 48;
  } else if (titleLen > 9) {
    dynamicTitleFontSize = 56;
  }

  // Autoajuste para la línea de competición (ancho ~680px)
  let dynamicCompetitionFontSize = style.textBoxes.competitionLine.fontSize;
  const compLen = competitionLine.length;
  if (compLen > 40) {
    dynamicCompetitionFontSize = 16;
  } else if (compLen > 30) {
    dynamicCompetitionFontSize = 18;
  } else if (compLen > 24) {
    dynamicCompetitionFontSize = 20;
  }

  // Renderizar usando JSX + next/og
  const response = new ImageResponse(
    (
      <div
        style={{
          width: "1280px",
          height: "720px",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          backgroundColor: "#0d0e15",
          fontFamily: "Outfit",
          overflow: "hidden",
        }}
      >
        {/* Selected background image (rendered behind the overlay) */}
        {backgroundBase64 && (
          <img
            src={backgroundBase64}
            alt="Fondo"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "1280px",
              height: "720px",
              objectFit: "cover",
            }}
          />
        )}

        {/* Plantilla overlay (siempre visible sobre el fondo seleccionado) */}
        <img
          src={overlayBase64}
          alt="Overlay"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "1280px",
            height: "720px",
            objectFit: "fill",
          }}
        />
        {/* Título de Categoría / Título Corto */}
        <div
          style={{
            position: "absolute",
            left: `${style.textBoxes.shortTitle.left}px`,
            top: `${style.textBoxes.shortTitle.top}px`,
            width: `${style.textBoxes.shortTitle.width}px`,
            height: `${style.textBoxes.shortTitle.height}px`,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            fontSize: `${dynamicTitleFontSize}px`,
            fontWeight: "bold",
            color: style.textBoxes.shortTitle.color,
            textShadow: style.textBoxes.shortTitle.shadow,
            textTransform: "uppercase",
            textAlign: "right",
          }}
        >
          {shortTitle}
        </div>

        {/* Línea de Competición */}
        <div
          style={{
            position: "absolute",
            left: `${style.textBoxes.competitionLine.left}px`,
            top: `${style.textBoxes.competitionLine.top}px`,
            width: `${style.textBoxes.competitionLine.width}px`,
            height: `${style.textBoxes.competitionLine.height}px`,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            fontSize: `${dynamicCompetitionFontSize}px`,
            fontWeight: 600,
            color: style.textBoxes.competitionLine.color,
            textShadow: style.textBoxes.competitionLine.shadow,
            textAlign: "right",
          }}
        >
          {competitionLine}
        </div>

        {/* Escudo Local */}
        {localLogoData && (
          <img
            src={localLogoData}
            alt="Local Logo"
            style={{
              position: "absolute",
              left: `${style.badgeBoxes.local.left}px`,
              top: `${style.badgeBoxes.local.top}px`,
              width: `${style.badgeBoxes.local.width}px`,
              height: `${style.badgeBoxes.local.height}px`,
              objectFit: "contain",
            }}
          />
        )}

        {/* Escudo Visitante */}
        {visitorLogoData && (
          <img
            src={visitorLogoData}
            alt="Visitor Logo"
            style={{
              position: "absolute",
              left: `${style.badgeBoxes.visitor.left}px`,
              top: `${style.badgeBoxes.visitor.top}px`,
              width: `${style.badgeBoxes.visitor.width}px`,
              height: `${style.badgeBoxes.visitor.height}px`,
              objectFit: "contain",
            }}
          />
        )}

        {/* Nombre Local */}
        <div
          style={{
            position: "absolute",
            left: `${style.textBoxes.localName.left}px`,
            top: `${style.textBoxes.localName.top}px`,
            width: `${style.textBoxes.localName.width}px`,
            height: `${style.textBoxes.localName.height}px`,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            fontSize: `${style.textBoxes.localName.fontSize}px`,
            fontWeight: "bold",
            color: style.textBoxes.localName.color,
            textShadow: style.textBoxes.localName.shadow,
            textAlign: "center",
          }}
        >
          {localName}
        </div>

        {/* Nombre Visitante */}
        <div
          style={{
            position: "absolute",
            left: `${style.textBoxes.visitorName.left}px`,
            top: `${style.textBoxes.visitorName.top}px`,
            width: `${style.textBoxes.visitorName.width}px`,
            height: `${style.textBoxes.visitorName.height}px`,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            fontSize: `${style.textBoxes.visitorName.fontSize}px`,
            fontWeight: "bold",
            color: style.textBoxes.visitorName.color,
            textShadow: style.textBoxes.visitorName.shadow,
            textAlign: "center",
          }}
        >
          {visitorName}
        </div>

        {/* Línea Inferior */}
        <div
          style={{
            position: "absolute",
            left: `${style.textBoxes.bottomLine.left}px`,
            top: `${style.textBoxes.bottomLine.top}px`,
            width: `${style.textBoxes.bottomLine.width}px`,
            height: `${style.textBoxes.bottomLine.height}px`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: `${style.textBoxes.bottomLine.fontSize}px`,
            fontWeight: 600,
            color: style.textBoxes.bottomLine.color,
            textShadow: style.textBoxes.bottomLine.shadow,
            textAlign: "center",
          }}
        >
          {bottomLine}
        </div>
      </div>
    ),
    {
      width: 1280,
      height: 720,
      fonts:
        fontBold && fontRegular
          ? [
              {
                name: "Outfit",
                data: fontRegular,
                weight: 500,
                style: "normal",
              },
              {
                name: "Outfit",
                data: fontBold,
                weight: 700,
                style: "normal",
              },
            ]
          : [],
    }
  );

  return response;
}
