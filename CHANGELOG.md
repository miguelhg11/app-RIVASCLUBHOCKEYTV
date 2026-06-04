# CHANGELOG

## 0.1.1 — 2026-06-04

### Corregido

- Hotfix en la lógica de obtención de recursos asignados a usuarios estándar ([queries.ts](file:///e:/--PROYECTOS%20DEVELOPER---/WEB%20PROGRAMA%20DIRECTOS%20RIVAS%20TV/rivas_youtube_live_handoff/src/lib/user/queries.ts#L81-L160)). Se corrigió el mapeo de `record.teams` de objeto a array usando `normalizeRelation`, solucionando el problema donde los delegados/usuarios con equipos asignados (ej. Infantil C) veían la lista de stream keys y playlists vacías en el planificador de la agenda.

## 0.1.0 — 2026-05-22

### Añadido

- Prompt principal para Antigravity/OpenCode.
- Especificación funcional.
- Arquitectura.
- Modelo de datos.
- Migración SQL inicial.
- Seguridad y secretos.
- Integración YouTube.
- Scraping FMP/RFEP.
- UI/UX y rutas.
- Tareas por fases.
- QA checklist.
- Estado/decisiones/QA/skills.
- Scripts locales para `.env.local`.
