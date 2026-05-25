# INSTRUCCIONES PARA ANTIGRAVITY / OPENCODE — MÓDULO GENERADOR DE MINIATURAS RIVAS HOCKEY TV

## 1. Objetivo exacto

Implementar o reajustar el módulo generador de miniaturas para que la app pueda crear miniaturas de YouTube visualmente equivalentes al ejemplo real del canal, usando:

```txt
plantilla.png
ejemplo-relleno.jpg
ESCUDOS PARA STREAM/
```

La app debe tomar un partido seleccionado desde FMP, RFEP/FEP o modo manual, resolver los escudos correctos desde el catálogo local y volcar los datos sobre la plantilla con la misma lógica visual del ejemplo:

- misma composición;
- misma jerarquía visual;
- misma colocación de textos;
- misma colocación de escudos;
- mismo uso de colores;
- mismo comportamiento de local/visitante;
- misma protección del símbolo del canal;
- misma salida 16:9 final para YouTube.

El módulo no debe “diseñar una miniatura nueva”. Debe **replicar la plantilla visual existente** y automatizar el volcado de datos.

---

## 2. Archivos reales que debe usar el agente

El usuario colocará estos archivos en la carpeta del proyecto:

```txt
plantilla.png
ejemplo-relleno.jpg
```

Y la carpeta:

```txt
ESCUDOS PARA STREAM/
```

Dentro de `ESCUDOS PARA STREAM/` estarán:

```txt
escudos originales del usuario
zip auditado/descomprimido con escudos
badges/
club_badges_seed.json
escudos_inventory.csv
AUDITORIA_ESCUDOS_STREAM.md
contact_sheet_*.jpg
instrucciones previas si existen
```

El agente debe tratar estos archivos como **fuentes visuales reales** del módulo.

No debe sustituirlos por plantillas inventadas.

---

## 3. Interpretación de los archivos

## 3.1 `plantilla.png`

Es la plantilla base vacía.

Debe usarse como fondo fijo de la miniatura.

Contiene:

- fondo 16:9;
- identidad del canal Rivas Hockey TV;
- símbolo/logo del canal;
- estética rojo + azul oscuro;
- elementos gráficos de hockey;
- `VS` central;
- zonas vacías donde se deben insertar escudos y datos del partido.

Regla crítica:

```txt
El símbolo del canal Rivas Hockey TV no debe cambiar de color, forma, tamaño ni posición.
```

No recolorear el logo del canal.

No tapar el logo.

No deformar la plantilla.

---

## 3.2 `ejemplo-relleno.jpg`

Es el ejemplo visual de salida correcta.

Debe usarse como referencia de calibración para:

- tipografía;
- tamaño de fuente;
- color de textos;
- sombra/borde del texto;
- colocación del título de categoría;
- colocación de la línea de competición;
- colocación de escudos;
- tamaño de escudos;
- colocación de nombres de equipos;
- colocación de la línea inferior;
- márgenes;
- alineación;
- jerarquía visual.

El objetivo es que, con los mismos datos del ejemplo, la app pueda generar una imagen lo más parecida posible a `ejemplo-relleno.jpg`.

---

## 3.3 `ESCUDOS PARA STREAM/`

Esta carpeta contiene los escudos que debe usar la app.

Debe usarse como fuente local principal de escudos.

Dentro debe existir o generarse un catálogo de escudos con:

```txt
nombre canónico del club
aliases
normalizedAliases
archivo png
sourceScope
hash
estado de revisión
```

El módulo debe resolver el escudo por alias, no por coincidencia manual improvisada.

---

## 4. Trabajo previo obligatorio del agente

Antes de programar el render final, el agente debe analizar los assets reales.

## 4.1 Analizar `plantilla.png`

Detectar y documentar:

```txt
ancho
alto
ratio
zonas protegidas
zona logo canal
zona VS
zona escudo local
zona escudo visitante
zona título corto
zona competición/jornada
zona nombre local
zona nombre visitante
zona línea inferior
```

Crear un archivo de calibración:

```txt
src/lib/thumbnails/rivas-thumbnail-template-calibration.json
```

o equivalente.

Debe contener coordenadas relativas o absolutas.

---

## 4.2 Analizar `ejemplo-relleno.jpg`

Comparar contra `plantilla.png` para detectar qué elementos son dinámicos.

El agente debe identificar:

```txt
texto de categoría
línea de competición
escudo local
escudo visitante
nombre local
nombre visitante
fecha/hora/pista
```

Debe crear o ajustar un perfil visual:

```txt
src/lib/thumbnails/rivas-thumbnail-style.ts
```

con:

```ts
export const RIVAS_THUMBNAIL_STYLE = {
  canvas: {
    width: 1280,
    height: 720
  },
  protectedAreas: {
    channelLogo: { ... },
    centerVs: { ... }
  },
  textBoxes: {
    shortTitle: { ... },
    competitionLine: { ... },
    localName: { ... },
    visitorName: { ... },
    bottomLine: { ... }
  },
  badgeBoxes: {
    local: { ... },
    visitor: { ... }
  },
  fonts: {
    title: { ... },
    competition: { ... },
    teamName: { ... },
    bottomLine: { ... }
  },
  colors: {
    title: "...",
    competition: "...",
    teamName: "...",
    bottomLine: "..."
  },
  shadows: {
    title: { ... },
    text: { ... }
  }
};
```

Si no se puede identificar la fuente exacta, usar una fuente disponible visualmente equivalente y documentarlo.

---

## 5. Regla de fidelidad visual

La salida debe reproducir el ejemplo, no reinterpretarlo.

Por tanto:

```txt
No cambiar la composición.
No cambiar la posición del logo del canal.
No cambiar la posición del VS.
No cambiar el estilo general.
No cambiar el criterio de local/visitante.
No aplicar un diseño nuevo.
No usar otra plantilla salvo que el usuario la configure.
```

La app debe permitir añadir otras plantillas en el futuro, pero esta tarea se centra en la plantilla real:

```txt
plantilla.png
```

---

## 6. Modelo de datos de entrada

El módulo debe recibir un partido normalizado procedente de FMP, RFEP o entrada manual.

```ts
export type ThumbnailMatchPayload = {
  source: "fmp" | "rfep" | "manual";

  categoryKey: string | null;
  categoryLabel: string | null;
  rivasTeamKey: string | null;
  rivasTeamLabel: string | null;
  rivasTeamLetter: "A" | "B" | "C" | "D" | null;

  competitionName: string | null;
  roundLabel: string | null;
  phase: string | null;
  group: string | null;

  fecha: string | null; // DD/MM/YYYY
  hora: string | null;  // HH:mm

  local: string;
  visitante: string;

  pista: string | null;

  localLogoUrl: string | null;
  visitanteLogoUrl: string | null;

  localDisplayName: string;
  visitanteDisplayName: string;

  thumbnailOverrides?: ThumbnailOverrides;
};
```

Overrides editables:

```ts
export type ThumbnailOverrides = {
  shortTitle?: string;
  competitionLine?: string;
  localDisplayName?: string;
  visitanteDisplayName?: string;
  localLogoUrl?: string;
  visitanteLogoUrl?: string;
  fecha?: string;
  hora?: string;
  pista?: string;
};
```

---

## 7. Datos que deben volcarse sobre la plantilla

## 7.1 Título corto / categoría

Debe aparecer donde lo muestra `ejemplo-relleno.jpg`.

Ejemplos:

```txt
1ª AUT MASC
1ª AUT FEM
INFANTIL B
BENJAMÍN C
JUNIOR
OK LIGA
OK PLATA SUR
OK PLATA FEM
OK BRONCE SUR
```

Mapa base:

```ts
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
  OK_LIGA_BRONCE_MASCULINA_SUR: "OK BRONCE SUR"
};
```

Construcción:

```ts
export function buildThumbnailShortTitle(match: ThumbnailMatchPayload): string {
  if (match.thumbnailOverrides?.shortTitle) {
    return match.thumbnailOverrides.shortTitle;
  }

  const base =
    match.categoryKey && THUMBNAIL_CATEGORY_SHORT_LABELS[match.categoryKey]
      ? THUMBNAIL_CATEGORY_SHORT_LABELS[match.categoryKey]
      : match.categoryLabel ?? match.rivasTeamLabel ?? "PARTIDO";

  if (match.rivasTeamLetter && shouldAppendTeamLetter(match.categoryKey)) {
    return `${base} ${match.rivasTeamLetter}`;
  }

  return base;
}
```

Reglas:

- La letra solo se añade si procede.
- La letra debe venir ya detectada como `rivasTeamLetter`.
- No extraer letras desde `GRUPO B`.
- No confundir competición/fase/grupo con categoría.

---

## 7.2 Línea de competición / jornada

Debe aparecer debajo del título corto, igual que en `ejemplo-relleno.jpg`.

Ejemplo:

```txt
1ª AUTONÓMICA MASCULINA - JORNADA 23
```

Construcción:

```ts
export function buildCompetitionLine(match: ThumbnailMatchPayload): string {
  if (match.thumbnailOverrides?.competitionLine) {
    return match.thumbnailOverrides.competitionLine;
  }

  return [
    match.competitionName,
    match.roundLabel
  ].filter(Boolean).join(" - ");
}
```

Reglas:

- Si existe `competitionName`, mostrarlo.
- Si existe `roundLabel`, añadirlo.
- Si no existe jornada, no inventarla.
- Si FMP no devuelve jornada, permitir edición manual.
- Si RFEP devuelve jornada/partido/fase, usarlo si está normalizado.
- No inventar `JORNADA XX`.

---

## 7.3 Escudo local

Debe ir en la posición izquierda del ejemplo.

```ts
leftLogo = match.thumbnailOverrides?.localLogoUrl ?? match.localLogoUrl;
leftName = match.thumbnailOverrides?.localDisplayName ?? match.localDisplayName ?? match.local;
```

Reglas:

- El local siempre va a la izquierda.
- No mover Rivas automáticamente a la derecha.
- Si Rivas es local, Rivas aparece a la izquierda.
- Si el escudo local no existe, usar placeholder.

---

## 7.4 Escudo visitante

Debe ir en la posición derecha del ejemplo.

```ts
rightLogo = match.thumbnailOverrides?.visitanteLogoUrl ?? match.visitanteLogoUrl;
rightName = match.thumbnailOverrides?.visitanteDisplayName ?? match.visitanteDisplayName ?? match.visitante;
```

Reglas:

- El visitante siempre va a la derecha.
- Si Rivas es visitante, Rivas aparece a la derecha.
- Si el escudo visitante no existe, usar placeholder.

---

## 7.5 Línea inferior

Debe aparecer en la misma posición y estilo que en el ejemplo.

Formato:

```txt
FECHA · HORA · PISTA
```

Ejemplo:

```txt
25/05/2026 · 21:15 · COLEGIO ALAMEDA DE OSUNA-PABELLON
```

Construcción:

```ts
export function buildBottomLine(match: ThumbnailMatchPayload): string {
  const fecha = match.thumbnailOverrides?.fecha ?? match.fecha;
  const hora = match.thumbnailOverrides?.hora ?? match.hora;
  const pista = match.thumbnailOverrides?.pista ?? match.pista;

  return [fecha, hora, pista].filter(Boolean).join(" · ");
}
```

Reglas:

- No inventar horas.
- No usar `2:00:00`.
- Si no hay hora, mostrar `Hora no informada` o dejar vacío según configuración.
- Si FMP no informa pista, usar `Ubicación no informada`.
- Si RFEP no informa pista, usar `Ubicación no informada por RFEP`.
- No inventar ubicación.

---

## 8. Resolución de escudos desde `ESCUDOS PARA STREAM/`

La app debe usar la carpeta:

```txt
ESCUDOS PARA STREAM/
```

como fuente principal de escudos.

Debe leer preferentemente:

```txt
club_badges_seed.json
escudos_inventory.csv
badges/
```

Si existen.

Si no existen, debe analizar los PNG de la carpeta y preparar un catálogo inicial.

Tipo recomendado:

```ts
export type ClubBadge = {
  id: string;
  displayName: string;
  aliases: string[];
  normalizedAliases: string[];
  logoUrl: string;
  sourceScope: "fmp" | "rfep" | "both" | "manual";
  assetPath: string;
  isActive: boolean;
  verificationStatus: "verified" | "probable" | "manual_review";
};
```

Resolución:

1. Normalizar nombre del equipo.
2. Buscar coincidencia exacta en `normalizedAliases`.
3. Si no existe, buscar coincidencia parcial segura.
4. Si el equipo contiene `RIVAS`, usar el escudo oficial de Rivas.
5. Si hay varias coincidencias, pedir confirmación al admin.
6. Si no hay coincidencia, usar placeholder y registrar pendiente.

---

## 9. Caso especial Rivas

Para cualquier nombre que contenga `RIVAS`, usar siempre el escudo oficial de Rivas configurado en el catálogo.

Debe funcionar con:

```txt
CP RIVAS LAS LAGUNAS
CP RIVAS LAS LAGUNAS A
CP RIVAS LAS LAGUNAS B
ADISS HOCKEY RIVAS
RIVAS HOCKEY
HOCKEY RIVAS
RIVAS
RIVAS A
RIVAS B
RIVAS C
```

Usar la lógica flexible ya definida:

```ts
export function normalizeTeamName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/\./g, " ")
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isRivasTeam(teamName: string): boolean {
  const normalized = normalizeTeamName(teamName);
  return /\bRIVAS\b/.test(normalized);
}
```

---

## 10. Preview editable

Antes de generar la imagen final, mostrar una preview editable.

Campos editables:

```txt
Título corto
Línea de competición
Nombre equipo local
Escudo equipo local
Nombre equipo visitante
Escudo equipo visitante
Fecha
Hora
Pista
```

Reglas:

- Los cambios no deben alterar el dato federativo original.
- Los cambios se guardan como `thumbnailOverrides`.
- La miniatura puede regenerarse con los mismos overrides.
- Debe existir botón `Regenerar preview`.
- Debe existir botón `Confirmar miniatura`.

---

## 11. Render final

La imagen final debe generarse en servidor.

Opciones aceptables:

```txt
satori + sharp
SVG server-side + sharp
node-canvas
@vercel/og
```

Requisitos:

```txt
Formato 16:9
PNG o JPEG
Calidad suficiente para YouTube
Menor de 2 MB si se va a subir directamente como thumbnail
```

La preview puede existir en frontend, pero la imagen final debe generarse en backend.

---

## 12. Persistencia

Guardar en `broadcasts` o tabla relacionada:

```ts
thumbnail_template_id
thumbnail_payload
thumbnail_overrides
thumbnail_url
thumbnail_status
thumbnail_error
```

Estados:

```txt
pending
generated
failed
uploaded_to_youtube
```

---

## 13. Validaciones

No permitir generar miniatura si faltan:

```txt
local
visitante
fecha
competitionName o categoryLabel
```

Permitir generar con advertencia si faltan:

```txt
hora
pista
jornada
escudo local
escudo visitante
```

Si falta escudo, usar placeholder.

Si falla generación, no bloquear la creación del directo.

---

## 14. Test visual obligatorio

Crear un test/fixture de calibración.

Objetivo:

```txt
Con los datos del ejemplo-relleno.jpg, la app debe generar una miniatura visualmente equivalente al ejemplo.
```

Crear fixture:

```txt
tests/fixtures/thumbnail-example-payload.json
```

con los datos observados del ejemplo.

El test debe:

1. Cargar `plantilla.png`.
2. Cargar los escudos necesarios desde `ESCUDOS PARA STREAM/`.
3. Renderizar la miniatura.
4. Compararla visualmente con `ejemplo-relleno.jpg`.
5. Reportar diferencias.

No es necesario exigir coincidencia píxel perfecta, porque puede variar el antialiasing, pero sí debe comprobar:

```txt
mismo tamaño de canvas
mismas zonas ocupadas
textos en zonas correctas
escudos en zonas correctas
línea inferior en zona correcta
logo canal no alterado
VS no tapado
```

---

## 15. Pantallas necesarias

## 15.1 Pantalla o paso de miniatura dentro del flujo de broadcast

Debe incluir:

```txt
preview
campos editables
selector/corrector de escudo local
selector/corrector de escudo visitante
botón regenerar preview
botón confirmar miniatura
botón continuar sin miniatura
mensajes de advertencia
```

## 15.2 Admin · Escudos / Clubes

Si no existe, dejar preparado o implementar una pantalla para:

```txt
ver clubes
ver escudos
ver alias
subir/cambiar escudo
añadir alias
marcar revisión manual
ver equipos detectados sin escudo
```

---

## 16. Integración con YouTube

Este módulo debe generar la imagen y dejarla asociada al broadcast.

La subida a YouTube debe usar el método correcto ya definido en el proyecto:

```txt
youtube.thumbnails.set
```

No usar:

```txt
youtube.liveThumbnails.set
```

No tocar OAuth ni credenciales en esta tarea.

---

## 17. Qué no debe hacer

No rediseñar la plantilla.

No cambiar el símbolo Rivas Hockey TV.

No recolorear el símbolo del canal.

No poner siempre Rivas a la derecha.

No usar FMP/RFEP como fuente obligatoria de escudos.

No inventar jornada.

No inventar pista.

No inventar hora.

No renderizar la imagen final solo en frontend.

No bloquear la creación del directo si falla la miniatura.

No modificar OAuth.

No cambiar secretos.

No hacer refactor global.

---

## 18. Criterios de aceptación

La implementación será correcta si:

- Usa `plantilla.png` como fondo real.
- Usa `ejemplo-relleno.jpg` como referencia de calibración.
- Usa `ESCUDOS PARA STREAM/` como fuente de escudos.
- Mantiene intacto el símbolo Rivas Hockey TV.
- Coloca local siempre a la izquierda.
- Coloca visitante siempre a la derecha.
- No fuerza Rivas a un lado.
- Coloca escudos con tamaño y posición equivalentes al ejemplo.
- Coloca textos con tipografía/tamaño/color/sombra equivalentes al ejemplo.
- La línea inferior queda en la misma zona que el ejemplo.
- Los textos largos se ajustan sin salirse.
- Existe preview editable.
- El render final se genera en servidor.
- Se guardan payload y overrides.
- Puede asociarse al broadcast.
- Se puede subir posteriormente a YouTube con `youtube.thumbnails.set`.
- La creación manual sigue funcionando.
- Hay test/fixture visual de comparación con el ejemplo.

---

## 19. Resultado esperado de Antigravity/OpenCode

Al finalizar, devolver:

1. Archivos creados.
2. Archivos modificados.
3. Dónde se leen `plantilla.png` y `ejemplo-relleno.jpg`.
4. Cómo se analiza `ESCUDOS PARA STREAM/`.
5. Estrategia de render usada.
6. Configuración visual/calibración generada.
7. Payload final.
8. Vista previa editable.
9. Sistema de resolución de escudos.
10. Tests añadidos.
11. Tests ejecutados.
12. Riesgos pendientes.
13. Confirmación de que no se ha tocado OAuth ni credenciales.

---

## 20. Resumen operativo

El módulo debe comportarse así:

```txt
Partido FMP/RFEP/manual
+ plantilla.png
+ escudos de ESCUDOS PARA STREAM
+ reglas de estilo calibradas desde ejemplo-relleno.jpg
+ overrides editables
= miniatura final idéntica en estructura al ejemplo
```

La prioridad no es creatividad visual. La prioridad es fidelidad, automatización y ausencia de errores de escudo o datos.
