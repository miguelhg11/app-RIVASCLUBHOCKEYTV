# DATABASE_SCHEMA

## 1. Principios

- PostgreSQL en Supabase.
- IDs UUID.
- Timestamps con zona horaria.
- Soft delete donde proceda.
- Logs separados de broadcasts.
- No guardar access tokens temporales.
- No guardar secretos innecesarios si pueden vivir en env.

## 2. Tablas principales

- `users`
- `categories`
- `teams`
- `stream_keys`
- `playlists`
- `thumbnail_backgrounds`
- `user_teams`
- `user_stream_keys`
- `user_playlists`
- `broadcasts`
- `operation_logs`
- `app_settings`

## 3. Campos sensibles

`stream_keys.stream_key` es sensible. Solo debe mostrarse a:

- Admin.
- Usuario autorizado en pantalla de éxito o detalle operativo necesario.

No debe aparecer en logs, errores, respuestas genéricas ni consola.

## 4. Migración

La migración inicial está en:

```text
supabase/migrations/001_initial_schema.sql
```

El agente puede ajustarla si el proyecto usa Supabase Auth en vez de auth propia, pero debe registrar la decisión en `DECISION_LOG.md`.

## 5. Nota sobre auth

La especificación inicial propone tabla `users` con `password_hash`. Alternativa aceptable: Supabase Auth + tabla `profiles`. Si el agente cambia a Supabase Auth, debe:

- justificarlo;
- actualizar Server Actions;
- mantener roles y permisos;
- actualizar migración;
- actualizar documentación.
