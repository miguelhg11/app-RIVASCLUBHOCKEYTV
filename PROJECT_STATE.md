# PROJECT_STATE

## Proyecto

Rivas YouTube Live Manager.

## Estado actual

Aplicación funcional y robusta con todas las fases base completadas:
- Agenda de competiciones integrada.
- Programación manual y automática de directos.
- Edición y sincronización bidireccional con YouTube/Supabase.
- Generación de miniaturas dinámicas.
- Scraping de federaciones (FMP/RFEP).
- Generación de reportes PDF para administradores.
- **Nuevo**: Sincronización y asignación manual de emisiones externas creadas en YouTube Studio a equipos-usuarios locales.
- **Nuevo**: Alertas visuales con pulsadores animados (`live-dot`) en la cabecera y panel de administración cuando hay directos externos sin asignar.

## Punto exacto actual

- El esquema de Supabase está **100% alineado** y validado con `check:supabase-schema` en verde.
- No hay warnings ni errores de compilación (`npm run build`), tipado (`typecheck`) ni formateo (`lint`) tras resolver incompatibilidades de pureza con hooks de React 19 / Next.js 16.
- En modo Mock (`YOUTUBE_MOCK_MODE=true`), al hacer clic en "Sincronizar", se insertan automáticamente directos externos y claves de emisión simulados.
- Se ha probado y cerrado técnicamente el flujo de asignación del directo externo a un equipo, que crea el broadcast local y asocia los IDs de YouTube.

## Objetivo vigente

Mantener la sincronización con la API de YouTube y realizar pruebas de campo con datos reales de producción antes del despliegue final.

## Lo ya implementado

- Auth propia por cookie y roles (`admin`/`user`).
- Asignación de permisos por recurso (equipos, stream keys y playlists asignados a delegados).
- Generador de miniaturas dinámicas con escudos y fondo.
- Integración de Scraping FMP con POST a Sidgad (evitando Playwright) y persistencia en caché en Supabase (`app_settings`).
- Módulo de reportes PDF descargables para administradores.
- **Asignador de Directos Externos**: Flujo completo de autodetección de nombres de equipo, selección de stream keys coincidentes e inserción local vinculada a YouTube.
- **Alertas en Admin**: Indicadores de tipo pulse que advierten de directos sin asignar en la cabecera y el botón de programaciones del panel de control.

## Siguiente paso (inmediato)

1. Confirmar con el usuario el estado del OAuth Consent Screen en la consola de Google Developer (verificar si sigue en modo "Testing" o "Production" para asegurar la duración de los tokens).
2. Probar la aplicación con la API real de YouTube desactivando el modo Mock (`YOUTUBE_MOCK_MODE=false`) en un entorno de desarrollo.
3. Validación en vivo del flujo completo de asignación de directos con partidos reales en YouTube Studio.

## Comandos útiles

- `npm run check:supabase-schema` (Verifica compatibilidad de BD)
- `npm run dev` (Inicia servidor local)
- `npm run build` (Compila para producción)
- `npm run lint` (Valida código)
- `npm run typecheck` (Valida TypeScript)
