# DECISION_LOG

| Fecha | Decisión | Motivo | Alternativas descartadas | Consecuencia |
|---|---|---|---|---|
| 2026-05-22 | Implementar por fases | Reduce riesgo y permite validar YouTube antes de scraping/PDF | Construir todo de golpe | Menos bloqueo y mejor QA |
| 2026-05-22 | Mantener flujo manual aunque haya scraping | FMP/RFEP pueden cambiar HTML | Hacer scraping obligatorio | La app sigue funcionando si falla scraping |
| 2026-05-22 | Secretos fuera del repo | Seguridad | Pegar secretos en prompt o código | Uso de `.env.local` y Vercel env |
| 2026-05-22 | Usar `youtube.thumbnails.set` | Es el método correcto para miniaturas | `youtube.liveThumbnails.set` | Evita implementación rota |
| 2026-05-22 | Usar `youtube.playlistItems.insert` | Método correcto para añadir a playlist | `YoutubelistItems.insert` | Evita error de API |
| 2026-05-22 | No crear `liveStreams` en MVP | El admin puede registrar stream keys ya existentes | Automatizar creación de streams | MVP más simple |
| 2026-05-23 | Inicializar base Next.js dentro de `rivas_youtube_live_handoff` | La carpeta existente era handoff sin app | Crear repo/app en otra carpeta separada | Se conserva documentación y se habilita ejecución por fases |
| 2026-05-23 | Preparar auth por arquitectura con cookie firmada y guardas de rol | Permite proteger rutas en Fase 1 sin saltar a Fase 2 | Implementar OAuth o scraping temprano | Seguridad base activa; falta conectar login real a tabla `users` |
| 2026-05-23 | Mantener auth propia sobre tabla `users` para Fase 1 | La migración inicial ya define `password_hash` y roles | Migrar inmediatamente a Supabase Auth | Menor fricción para cerrar base segura y permisos internos |
| 2026-05-23 | Empezar CRUD admin por `categories` y `teams` | Son dependencias base para programación posterior de directos | Implementar primero entidades sensibles (stream keys) | Permite validar patrón de Server Actions + Zod + logs sanitizados |
| 2026-05-24 | Usar POST directo a Sidgad para FMP | La web de competiciones FMP descarga la agenda completa por POST y filtra en cliente | Usar Playwright o Puppeteer | Scraping muy rápido, ligero (sin navegador headless) y 100% compatible con Vercel |
| 2026-05-24 | Almacenar caché en la tabla `app_settings` de Supabase | Evita consultas continuas a FMP y persiste de forma fiable entre ejecuciones serverless | Guardar en memoria del servidor | Alta disponibilidad de la caché en entornos serverless distribuídos |
| 2026-05-24 | Separar `Admin > Federaciones` de `Agenda competiciones` | Evita mezclar configuracion tecnica con uso diario | Mantener ambos en la misma pantalla | UX mas simple y flujo operativo claro |
| 2026-05-24 | Estandarizar navegacion en `Agenda competiciones`, `Programar manual`, `Mis programaciones`, `Admin` | Jerarquia funcional solicitada por usuario | Menu extenso con submenus tecnicos en header | Menor friccion para usuarios no tecnicos |
| 2026-05-24 | Mover asignacion de stream key desde usuario hacia equipo | Modelo operativo real: stream key por equipo | Asignar stream key directa a usuario | Permisos mas consistentes por estructura deportiva |
| 2026-05-24 | Implementar fallbacks de esquema en runtime | Supabase en produccion no tenia migraciones nuevas aplicadas | Bloquear app hasta migrar | Continuidad operativa temporal con riesgo controlado |
| 2026-05-24 | Crear diagnostico de schema drift (`check:supabase-schema`) | Identificar rapidamente mismatch app/DB | Diagnostico manual ad-hoc | Trazabilidad y accion inmediata antes de QA final |
| 2026-05-25 | Bloquear cierre tecnico hasta aplicar migraciones reales en Supabase | Sin `SUPABASE_ACCESS_TOKEN` no se puede usar `supabase link/db push`; el esquema sigue incompleto | Seguir parcheando fallbacks indefinidamente | Se exige migracion en SQL Editor o acceso CLI para cerrar coherencia de datos |
| 2026-05-25 | Asignación de directos externos e indicadores visuales | Vincular eventos creados directamente en YouTube Studio a equipos locales de la app y alertar visualmente al admin | Dejar directos externos huérfanos o ignorarlos | Mayor flexibilidad operativa, mejor control de directos externos y avisos en tiempo real |
