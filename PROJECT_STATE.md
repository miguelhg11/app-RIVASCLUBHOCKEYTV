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
- **Nuevo**: Casilla única vacía de hora (`HH:MM`) en programación manual que permite borrar y editar con libertad, normalizándose en el `onBlur`.
- **Nuevo**: Corrección en el envío de emails de bienvenida y restablecimiento de contraseña en Vercel al incluir las variables de Gmail en el script de entorno.
- **Nuevo**: Redirección unificada para que todos los usuarios (incluido el administrador) inicien en el panel principal (`/dashboard`).
- **Nuevo**: Menú desplegable en móvil se cierra automáticamente al pulsar sobre cualquiera de sus enlaces o botones de navegación.

## Punto exacto actual

- El esquema de Supabase está **100% alineado** y validado con `check:supabase-schema` en verde.
- No hay warnings ni errores de compilación (`npm run build`), tipado (`typecheck`) ni formateo (`lint`).
- La aplicación se encuentra desplegada y funcionando en producción en Vercel con todos los cambios y variables de Gmail configuradas correctamente.
- Se ha limpiado el módulo experimental de manuales a petición del usuario, dejando la aplicación en su estado óptimo de producción.

## Objetivo vigente

Monitorear el uso de producción del sistema con retransmisiones en vivo reales, y dar soporte de uso técnico al administrador y emisores.

## Lo ya implementado

- Auth propia por cookie y roles (`admin`/`user`).
- Asignación de permisos por recurso (equipos, stream keys y playlists asignados a delegados).
- Generador de miniaturas dinámicas con escudos y fondo.
- Integración de Scraping FMP con POST a Sidgad (evitando Playwright) y persistencia en caché en Supabase (`app_settings`).
- Módulo de reportes PDF descargables para administradores.
- **Asignador de Directos Externos**: Flujo completo de asignación manual de directos creados en YouTube Studio.
- **Reloj Manual HH:MM**: Input libre y sin bloqueos de hora en la creación y edición.
- **Emails SMTP Gmail**: Integración de credenciales Gmail en el entorno de Vercel y validación local de envíos.
- **Usabilidad Móvil**: Autocierre del menú de navegación móvil al pulsar cualquier opción.

## Siguiente paso (inmediato)

1. Verificar que los delegados de pista estén recibiendo correctamente los emails de bienvenida con sus contraseñas temporales al ser creados desde el panel de Admin en producción.
2. Hacer una prueba de retransmisión completa de un partido usando OBS/Larix Broadcaster para comprobar el flujo de inicio, visualización y detención del directo desde la app móvil.
3. Monitorear los logs en el panel de administración ante cualquier comportamiento inesperado.

## Comandos útiles

- `npm run check:supabase-schema` (Verifica compatibilidad de BD)
- `npm run dev` (Inicia servidor local)
- `npm run build` (Compila para producción)
- `npm run lint` (Valida código)
- `npm run typecheck` (Valida TypeScript)
