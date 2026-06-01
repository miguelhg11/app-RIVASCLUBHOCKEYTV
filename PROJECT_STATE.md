# PROJECT_STATE

## Proyecto

Rivas YouTube Live Manager.

## Estado actual

Aplicación funcional y robusta con todas las fases base completadas y optimizadas:
- Agenda de competiciones integrada.
- Programación manual y automática de directos.
- Edición y sincronización bidireccional con YouTube/Supabase.
- Generación de miniaturas dinámicas.
- Scraping de federaciones (FMP/RFEP).
- **Optimización de API de YouTube**:
  * Implementación de una caché en memoria (TTL de 60s) para espectadores concurrentes en tiempo real para evitar consumos duplicados por recargas del panel.
  * Sistema de registro de auditoría de cuota (`youtube_quota_usage_events`) para monitorizar de manera transparente el consumo real por cada endpoint/acción.
- **Calendario Semanal Persistido (Viernes a Jueves)**:
  * Generación bajo demanda y programada vía API (`/api/schedule/generate`) del cuadrante semanal, guardándose como caché estática (`weekly_schedules`) para descarga pública de "cuota cero" y enviando alertas automáticas por email (vía Resend) a los administradores.
- **Ajustes en el Panel de Administrador**:
  * Eliminación de la tarjeta inactiva de Logs.
  * Renombramiento de "Buscador de contenidos" por "Gestor de contenidos" y de "Reportes" por "Exportar programación".
  * Reordenación de los pasos de configuración del 1 al 14 en la página principal del administrador.
- **Auto-Sincronización en Entrada**: Toda la app ahora sincroniza automáticamente con YouTube Studio al entrar a los menús correspondientes (`broadcasts`, `stream-keys`, `playlists`, `event-links`).
- **Botón Atrás Físico/Gestos**: Corregido comportamiento del botón atrás del dispositivo (Android/iOS) para subir en la jerarquía de la app hasta el Dashboard.
- **Tarjetas de Programación en Móvil**: Rediseño completo para evitar que los nombres de los equipos se corten en vistas de pantalla pequeña.
- **Grants Explícitos Supabase**: Migración `014_explicit_grants.sql` aplicada que asegura compatibilidad con la nueva directiva de Data API de Supabase asignando privilegios explícitos a roles `anon`, `authenticated` y `service_role`.

## Punto exacto actual

- El esquema de Supabase está **100% alineado** y validado (incluyendo la tabla de auditoría de cuota `youtube_quota_usage_events` y la caché `weekly_schedules` de la migración `017`).
- La aplicación se encuentra desplegada y funcionando en producción en Vercel en la URL oficial: [https://rivasyoutubelivehandoff.vercel.app](https://rivasyoutubelivehandoff.vercel.app)
- No hay warnings ni errores de compilación, tipado (`typecheck`) ni formateo (`lint`).
- La estimación realista para un uso diario muy activo (20 usuarios y 5 administradores) con la cuota actual ampliada a 50,000 unidades es sumamente segura, permitiendo emitir más de 45 partidos simultáneos, realizar búsquedas y consultar estadísticas de manera segura gracias a los sistemas de caché incorporados.

## Siguiente paso

1. Supervisar el ledger de consumo de cuotas (`youtube_quota_usage_events`) directamente en Supabase tras los primeros fines de semana de uso en producción para validar el consumo real.
2. Comprobar el correcto funcionamiento de las notificaciones automáticas por correo de Resend al generar o regenerar el calendario semanal.

## Comandos útiles

- `npm run check:supabase-schema` (Verifica compatibilidad de BD)
- `npm run dev` (Inicia servidor local)
- `npm run build` (Compila para producción)
- `npm run lint` (Valida código)
- `npm run typecheck` (Valida TypeScript)
- `npm run test:federations` (Ejecuta tests de scraping de federación)
