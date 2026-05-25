// Estilo y calibración para miniaturas de Rivas Hockey TV (1280x720)
// Basado en la plantilla plantilla.png y el ejemplo ejemplo-relleno.jpg (1920x1080)

// Estilo y calibración para miniaturas de Rivas Hockey TV (1280x720)
// Basado en la plantilla plantilla.png y el ejemplo ejemplo-relleno.jpg (1920x1080)

export const RIVAS_THUMBNAIL_STYLE = {
  canvas: {
    width: 1280,
    height: 720,
  },
  // Áreas protegidas y fijas del canal
  protectedAreas: {
    channelLogo: {
      left: 1040,
      top: 30,
      width: 210,
      height: 70,
    },
    centerVs: {
      left: 590, // centrado (1280/2 - 100/2)
      top: 300,
      width: 100,
      height: 80,
    },
  },
  // Cajas para texto y renderizado
  textBoxes: {
    // Categoría / Título Corto (ej. 1ª AUT MASC)
    shortTitle: {
      left: 600, // Desplazado a la derecha para no pisar el logo "RIVAS" de la izquierda
      top: 25,
      width: 630, // Limitado a la mitad derecha del canvas (1280 - 600 - margen)
      height: 90,
      fontFamily: "Outfit",
      fontSize: 66,
      fontWeight: "bold",
      color: "#C2272D", // Rojo vibrante del ejemplo
      textAlign: "right", // Alineado a la derecha en su contenedor
      textTransform: "uppercase",
      shadow: "0px 3px 6px rgba(0, 0, 0, 0.9), 0px 0px 30px rgba(0, 0, 0, 0.4)",
    },
    // Línea de Competición (ej. 1ª AUTONÓMICA MASCULINA - JORNADA 23)
    competitionLine: {
      left: 550,
      top: 115,
      width: 680,
      height: 40,
      fontFamily: "Outfit",
      fontSize: 23,
      fontWeight: "600",
      color: "#FFFFFF", // En el ejemplo es blanco con fondo oscuro
      textAlign: "right",
      shadow: "0px 2px 4px rgba(0, 0, 0, 0.9)",
    },
    // Nombres de los equipos (debajo de cada escudo)
    localName: {
      left: 100,
      top: 480,
      width: 450,
      height: 80,
      fontFamily: "Outfit",
      fontSize: 32,
      fontWeight: "bold",
      color: "#FFFFFF",
      textAlign: "center",
      shadow: "0px 3px 6px rgba(0, 0, 0, 0.6)",
    },
    visitorName: {
      left: 730,
      top: 480,
      width: 450,
      height: 80,
      fontFamily: "Outfit",
      fontSize: 32,
      fontWeight: "bold",
      color: "#FFFFFF",
      textAlign: "center",
      shadow: "0px 3px 6px rgba(0, 0, 0, 0.6)",
    },
    // Línea inferior (FECHA · HORA · PISTA)
    bottomLine: {
      left: 50,
      top: 615,
      width: 1180,
      height: 40,
      fontFamily: "Outfit",
      fontSize: 22,
      fontWeight: "600",
      color: "#FFFFFF",
      textAlign: "center",
      shadow: "0px 3px 6px rgba(0, 0, 0, 0.7)",
    },
  },
  // Posición de los escudos
  badgeBoxes: {
    local: {
      left: 200,
      top: 220,
      width: 250,
      height: 250,
    },
    visitor: {
      left: 830,
      top: 220,
      width: 250,
      height: 250,
    },
  },
};

// Mapa base de abreviaciones de categorías para Título Corto
export const THUMBNAIL_CATEGORY_SHORT_LABELS: Record<string, string> = {
  MICRO_XS: "MICRO XS",
  PREBENJAMIN_XS: "PREB XS",
  PREBENJAMIN: "PREB",
  BENJAMIN: "BENJAMÍN",
  ALEVIN: "ALEVÍN",
  INFANTIL: "INFANTIL",
  JUVENIL: "JUVENIL",
  JUNIOR: "JUNIOR",
  SUB15_FEMENINO: "SUB15 FEM",
  SUB17_FEMENINO: "SUB17 FEM",
  PRIMERA_AUTONOMICA_MASCULINA: "1ª AUT MASC",
  PRIMERA_AUTONOMICA_FEMENINA: "1ª AUT FEM",
  OK_LIGA_MASCULINA: "OK LIGA",
  OK_LIGA_PLATA_MASCULINA_SUR: "OK PLATA SUR",
  OK_LIGA_PLATA_FEMENINA: "OK PLATA FEM",
  OK_LIGA_BRONCE_MASCULINA_SUR: "OK BRONCE SUR",
};

/**
 * Normaliza y abrevia textos largos para el título corto de la miniatura.
 * Asegura que quepa en el espacio asignado (mitad derecha, máx ~15 caracteres).
 */
export function abbreviateCategoryName(name: string): string {
  if (!name) return "";
  
  // Normalizar acentos y pasar a mayúsculas
  let res = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();

  // Reemplazos de palabras clave completas o abreviaciones
  const replacements: [RegExp, string][] = [
    [/\bPRIMERA\b/g, "1ª"],
    [/\bSEGUNDA\b/g, "2ª"],
    [/\bTERCERA\b/g, "3ª"],
    [/\bAUTONOMICA\b/g, "AUT"],
    [/\bAUTONOMICO\b/g, "AUT"],
    [/\bMASCULINA\b/g, "MASC"],
    [/\bMASCULINO\b/g, "MASC"],
    [/\bFEMENINA\b/g, "FEM"],
    [/\bFEMENINO\b/g, "FEM"],
    [/\bPREBENJAMIN\b/g, "PREB"],
    [/\bBENJAMIN\b/g, "BENJ"],
    [/\bALEVIN\b/g, "ALEV"],
    [/\bINFANTIL\b/g, "INF"],
    [/\bJUVENIL\b/g, "JUV"],
    [/\bJUNIOR\b/g, "JUN"],
    [/\bSELECCION\b/g, "SEL"],
    [/\bAUTONOMICA\b/g, "AUT"],
    [/\bNACIONAL\b/g, "NAC"],
    [/\bCOMPETICION\b/g, "COMP"],
    [/\bCAMPEONATO\b/g, "CAMP"],
  ];

  for (const [regex, replacement] of replacements) {
    res = res.replace(regex, replacement);
  }

  // Quitar conectores comunes para ahorrar espacio
  res = res
    .replace(/\bDE\b/g, "")
    .replace(/\bY\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Si sigue superando los 15 caracteres, acortar drásticamente quitando vocales o truncando con punto
  if (res.length > 15) {
    // Si contiene subcategorías como "AUT MASC", reducir términos secundarios
    res = res
      .replace(/\bINFANTIL\b/g, "INF")
      .replace(/\bBENJAMIN\b/g, "BENJ")
      .replace(/\bPREBENJAMIN\b/g, "PREB");

    if (res.length > 15) {
      res = res.substring(0, 14) + ".";
    }
  }

  return res;
}


