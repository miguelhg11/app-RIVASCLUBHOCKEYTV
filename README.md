# Rivas YouTube Live Manager — paquete de handoff

Aplicación web mobile-first para programar, editar y gestionar emisiones en directo de YouTube de un club de hockey sobre patines sin entregar acceso directo a YouTube Studio a delegados, padres o usuarios autorizados.

Este paquete está pensado para colocarse en la raíz del repositorio y servir como guía de ejecución para Antigravity, OpenCode u otro agente de código.

## Archivos principales

- `PROMPT_ANTIGRAVITY_OPENCODE.md`: prompt principal para pegar al agente de código.
- `SPEC.md`: especificación funcional completa.
- `ARCHITECTURE.md`: arquitectura técnica y estructura esperada.
- `DATABASE_SCHEMA.md`: modelo de datos y reglas de persistencia.
- `SECURITY_AND_SECRETS.md`: seguridad, secretos, OAuth, permisos y protección de datos.
- `YOUTUBE_INTEGRATION.md`: contrato técnico con YouTube Data API v3.
- `FEDERATION_SCRAPING.md`: scraping FMP/RFEP con adaptadores y fallback manual.
- `UI_UX_ROUTES.md`: rutas, pantallas, navegación y estados UX.
- `TASKS_FOR_AGENT.md`: tareas ordenadas por fases.
- `QA_CHECKLIST.md`: pruebas mínimas y criterios de aceptación.
- `PROJECT_STATE.md`: estado inicial del proyecto.
- `DECISION_LOG.md`: decisiones técnicas vigentes.
- `QA_STATUS.md`: estado de validación.
- `SKILL_USAGE_LOG.md`: registro de uso de skills/agentes para OpenCode.
- `.env.example`: plantilla segura sin secretos reales.
- `.gitignore`: reglas para no versionar secretos ni artefactos locales.
- `scripts/setup-env-local.mjs`: asistente interactivo local para crear `.env.local`.
- `scripts/check-env.mjs`: validador local de variables y chequeo opcional del refresh token.
- `supabase/migrations/001_initial_schema.sql`: esquema inicial propuesto.

## Uso recomendado

1. Copia todos estos archivos a la raíz del repositorio.
2. Ejecuta localmente:

```bash
node scripts/setup-env-local.mjs
node scripts/check-env.mjs
```

3. No pegues claves reales en el chat, en commits ni en documentación.
4. Pega `PROMPT_ANTIGRAVITY_OPENCODE.md` en Antigravity/OpenCode.
5. Pide al agente que implemente por fases, empezando por la Fase 1 y sin tocar scraping/PDF hasta que el flujo manual de YouTube funcione.

## Nota importante sobre OAuth

Tener `client_id`, `client_secret` y un token OAuth/refresh token es necesario para la integración con YouTube, pero no deben escribirse en el repositorio. Se introducirán localmente en `.env.local` y en producción como variables de entorno de Vercel.

Si lo que tienes es la URL `https://oauth2.googleapis.com/token`, eso no es el refresh token: es el endpoint fijo de Google. El refresh token es una cadena larga devuelta por el flujo OAuth y normalmente empieza por formatos similares a `1//...`.

## Orden de implementación obligatorio

1. Base segura, auth, roles, rutas protegidas y base de datos.
2. Creación manual de directos YouTube.
3. Edición y sincronización YouTube/Supabase.
4. Miniaturas dinámicas.
5. Scraping FMP/RFEP con fallback manual.
6. Reportes PDF.
7. Hardening, logs, QA y despliegue.
