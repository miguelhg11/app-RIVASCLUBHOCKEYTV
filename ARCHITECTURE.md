# ARCHITECTURE

## 1. Principio general

La app usa Next.js como frontend y backend. Las operaciones sensibles se ejecutan exclusivamente en servidor mediante Server Actions o route handlers server-only.

## 2. Capas

```text
UI / App Router
  ↓
Server Actions con validación y autorización
  ↓
Servicios internos
  - Auth service
  - Supabase service
  - YouTube service
  - Thumbnail service
  - Federation scraping service
  - PDF report service
  - Logging service
  ↓
Integraciones externas
  - Supabase PostgreSQL
  - YouTube Data API v3
  - FMP/RFEP públicas
```

## 3. Estructura recomendada

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
  components/
  lib/
    auth/
    supabase/
    youtube/
    federations/
    thumbnails/
    pdf/
    validation/
    logging/
```

## 4. Reglas Server Actions

Cada Server Action debe:

1. Ejecutarse en servidor.
2. Validar sesión.
3. Validar rol.
4. Validar permiso sobre el recurso concreto.
5. Validar input con Zod.
6. Ejecutar operación.
7. Registrar log sanitizado.
8. Devolver resultado sin secretos.

## 5. Patrón de servicios

### YouTube service

Responsabilidades:

- Crear OAuth2 client.
- Intercambiar refresh token por access token automáticamente vía `googleapis`.
- Crear broadcast.
- Actualizar broadcast.
- Bind a live stream.
- Añadir a playlist.
- Subir thumbnail.
- Manejar errores de cuota, token y permisos.

### Federation service

Responsabilidades:

- Consultar FMP/RFEP mediante adaptadores.
- Normalizar resultados.
- Calcular confianza.
- Cachear.
- Devolver fallback seguro.

### Logging service

Responsabilidades:

- Crear registros en `operation_logs`.
- Sanitizar mensajes.
- No guardar secretos.

## 6. Modo mock recomendado

Durante desarrollo, implementar bandera:

```env
YOUTUBE_MOCK_MODE=true
```

En modo mock:

- No llamar a Google.
- Simular IDs y URLs.
- Permitir probar UI, permisos y base de datos.

En producción:

- `YOUTUBE_MOCK_MODE=false`.
- Validar credenciales reales.
