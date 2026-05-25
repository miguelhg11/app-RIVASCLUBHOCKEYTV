# INSTRUCCIONES PARA AGENTE DE CÓDIGO

## Objetivo

Construir una aplicación web mobile-first para un club de hockey sobre patines que permita a usuarios autorizados programar, editar y gestionar emisiones en directo de YouTube sin acceder a YouTube Studio, y permita al administrador controlar usuarios, equipos, claves de emisión, playlists, fondos de miniatura, logs y reportes.

## Contexto

El usuario dispone ya de credenciales OAuth de Google/YouTube:

- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REFRESH_TOKEN` o token equivalente obtenido por OAuth 2.0

No pedir esos secretos en el código ni imprimirlos. Deben introducirse solo en `.env.local` mediante script local o en variables de entorno de Vercel.

La app debe usar la cuenta/canal del club como único emisor técnico. Los usuarios finales no hacen OAuth contra Google ni reciben acceso a YouTube Studio.

## Stack obligatorio

- Next.js con App Router.
- TypeScript.
- TailwindCSS.
- Supabase PostgreSQL.
- `@supabase/supabase-js` solo en servidor cuando se use `SUPABASE_SERVICE_ROLE_KEY`.
- `googleapis` para YouTube Data API v3.
- `zod` para validación.
- `bcrypt` o `argon2` para hashes de contraseña si se implementa auth propia.
- `jspdf` y `jspdf-autotable` para PDF.
- Librería de parsing HTML para scraping si hace falta, preferentemente `cheerio`.
- `server-only` en módulos que accedan a secretos.

## Restricciones críticas

1. No hardcodear secretos.
2. No exponer `SUPABASE_SERVICE_ROLE_KEY`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`, claves de emisión ni stream keys al cliente salvo en la pantalla de éxito y solo a usuarios autorizados para esa clave.
3. No usar `youtube.liveThumbnails.set`; usar `youtube.thumbnails.set`.
4. No usar `YoutubelistItems.insert`; usar `youtube.playlistItems.insert`.
5. No asumir que el refresh token es permanente si el OAuth consent screen está en Testing. Gestionar `invalid_grant` con mensaje claro al admin.
6. No implementar scraping como dependencia obligatoria del flujo principal. El usuario siempre debe poder crear el directo manualmente.
7. No empezar PDF ni scraping hasta que funcione el flujo manual completo de YouTube.
8. No hacer refactor amplio no pedido. Implementar por fases.
9. No declarar que algo funciona sin ejecutar pruebas o sin dejar claro que queda pendiente.

## Arquitectura esperada

```text
app/
  (auth)/login/page.tsx
  dashboard/page.tsx
  dashboard/new/page.tsx
  dashboard/broadcasts/page.tsx
  dashboard/broadcasts/[id]/edit/page.tsx
  dashboard/broadcasts/[id]/success/page.tsx
  admin/page.tsx
  admin/users/page.tsx
  admin/categories/page.tsx
  admin/teams/page.tsx
  admin/stream-keys/page.tsx
  admin/playlists/page.tsx
  admin/thumbnail-backgrounds/page.tsx
  admin/broadcasts/page.tsx
  admin/reports/page.tsx
  admin/logs/page.tsx
src/
  actions/
    auth.actions.ts
    broadcast.actions.ts
    admin.actions.ts
    report.actions.ts
  lib/
    auth/
    supabase/
    youtube/
    federations/
    thumbnails/
    pdf/
    validation/
    logging/
  components/
    ui/
    forms/
    broadcast/
    admin/
scripts/
  setup-env-local.mjs
  check-env.mjs
supabase/
  migrations/
    001_initial_schema.sql
```

## Fase 1 — Base segura

Implementar:

- Proyecto Next.js App Router con TypeScript y TailwindCSS.
- Tema oscuro Slate/Zinc, mobile-first.
- Login seguro por email/contraseña.
- Roles `admin` y `user`.
- Middleware/rutas protegidas.
- Server Actions con verificación interna de sesión, rol y permiso concreto.
- Esquema Supabase según `supabase/migrations/001_initial_schema.sql`.
- CRUD admin básico para usuarios, categorías, equipos, stream keys, playlists y fondos.
- Logs de operaciones.

Criterio de aceptación:

- Un usuario no admin no puede entrar en `/admin`.
- Un usuario solo ve equipos, playlists y stream keys asignados.
- Ninguna Server Action confía solo en el frontend.

## Fase 2 — Creación manual de directos YouTube

Implementar flujo:

1. Usuario abre `/dashboard/new`.
2. Selecciona equipo, playlist, stream key, fecha/hora, local, visitante, competición, pista y fondo.
3. Marca checkbox legal obligatorio: confirma que el club dispone de autorización/base jurídica suficiente para emitir el encuentro, especialmente si participan menores.
4. Server Action valida sesión, permiso e input.
5. Crea `liveBroadcast` en YouTube con:
   - `status.privacyStatus = 'unlisted'`
   - `contentDetails.latencyPreference = 'normal'`
   - `contentDetails.enableAutoStart = true`
   - `contentDetails.enableAutoStop = false`
6. Vincula con `youtube.liveBroadcasts.bind` usando `youtube_live_stream_id` de la stream key seleccionada.
7. Añade a playlist con `youtube.playlistItems.insert`.
8. Guarda en `broadcasts` y `operation_logs`.
9. Muestra pantalla de éxito con enlace de YouTube, RTMP URL y stream key solo al usuario autorizado.

Criterio de aceptación:

- Se crea un broadcast real o, en modo mock, queda preparado con interfaz equivalente.
- Supabase y YouTube quedan sincronizados.
- Si falla YouTube, no queda un estado falso de éxito.

## Fase 3 — Edición y sincronización

Implementar edición de eventos programados:

- Cambiar título, descripción, fecha/hora, equipo, playlist, stream key y datos de partido.
- Sincronizar con `youtube.liveBroadcasts.update`.
- No enviar partes `status` o `contentDetails` incompletas.
- Preservar siempre valores obligatorios: unlisted, normal latency, autoStart true, autoStop false.
- Registrar `youtube_sync_status`, `last_youtube_sync_at` y `youtube_last_error`.

Criterio de aceptación:

- Un usuario no puede editar broadcasts ajenos o no asignados.
- Si falla YouTube, Supabase refleja `failed` y muestra mensaje claro.

## Fase 4 — Miniaturas dinámicas

Implementar generación de miniaturas 16:9:

- Fondo seleccionado por admin.
- Competición arriba.
- Escudo local y visitante con `VS` central.
- Nombres de equipos.
- Fecha, hora y pista abajo.
- Fallback si falta escudo o fondo.
- Validación de peso menor de 2 MB.
- Subida con `youtube.thumbnails.set` usando `videoId`.

Criterio de aceptación:

- La creación del directo no queda bloqueada si falla la miniatura.
- Queda log de éxito o fallo.

## Fase 5 — Scraping FMP/RFEP

Implementar adaptadores aislados:

```text
src/lib/federations/
  types.ts
  normalizer.ts
  fmp-adapter.ts
  rfep-adapter.ts
  federation-service.ts
```

Cada adaptador debe devolver:

```ts
export type FederationMatch = {
  source: 'fmp' | 'rfep';
  competitionName: string;
  date: string;
  time: string;
  venue: string | null;
  homeTeamName: string;
  awayTeamName: string;
  homeCrestUrl: string | null;
  awayCrestUrl: string | null;
  rawUrl: string;
  confidence: number;
};
```

Reglas:

- FMP: club autonómico `CP RIVAS LAS LAGUNAS` salvo configuración distinta.
- RFEP: club nacional `ADISS HOCKEY RIVAS` salvo configuración distinta.
- Cachear resultados.
- Mostrar selector de partido encontrado.
- Permitir edición manual completa.
- No bloquear si cambia el HTML.

Criterio de aceptación:

- Si la federación falla, el formulario manual sigue operativo.

## Fase 6 — Reportes PDF admin

Implementar `/admin/reports`:

- Rango de fechas.
- Tabla con Local vs Visitante, fecha, hora y enlace de YouTube.
- PDF corporativo.
- Enlaces clicables en el PDF.
- Solo admin.

## Fase 7 — Hardening, QA y despliegue

Implementar:

- `node scripts/check-env.mjs`.
- Tests mínimos de validación, permisos, acciones críticas y servicios YouTube mockeados.
- README actualizado.
- Logs sanitizados.
- Manejo de cuota YouTube: `quotaExceeded`, `rateLimitExceeded`, `userRequestsExceedRateLimit`.
- Mensaje claro para `invalid_grant`.

## Modelo de datos obligatorio

Usar como base `supabase/migrations/001_initial_schema.sql`. Añadir campos solo si están justificados. No eliminar campos sin registrar decisión en `DECISION_LOG.md`.

## Variables de entorno

Usar `.env.example` como plantilla. No crear `.env.local` con secretos ficticios. El usuario usará `node scripts/setup-env-local.mjs`.

Variables mínimas:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REFRESH_TOKEN`
- `YOUTUBE_TOKEN_URI=https://oauth2.googleapis.com/token`
- `SESSION_SECRET`

## Pruebas mínimas

Antes de cerrar cada fase, ejecutar o documentar:

```bash
npm run lint
npm run typecheck
npm run build
node scripts/check-env.mjs
```

Si no existen esos scripts, crearlos o documentar alternativa.

## Resultado esperado

Una aplicación funcional por fases, segura, desplegable en Vercel, con Supabase como base de datos, integración YouTube robusta, scraping no bloqueante y panel admin operativo.

## Qué no debe modificar

- No cambiar el objetivo del producto.
- No exponer secretos.
- No sustituir el flujo por OAuth de usuarios finales.
- No quitar el modo manual aunque exista scraping.
- No convertir la app en un sistema generalista de streaming ajeno al club.

## Revisión final obligatoria

Al terminar cada fase, responder con:

- Archivos creados/modificados.
- Qué funciona con evidencia.
- Qué no se ha implementado aún.
- Pruebas ejecutadas.
- Riesgos pendientes.
- Decisiones que deben registrarse.
