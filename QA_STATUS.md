# QA_STATUS

## Estado

Estado casi cerrado:

- App funcional en UI/flujo principal.
- Schema Supabase alineado y fallbacks de compatibilidad retirados.

## Pruebas realizadas

- `npm run lint` OK.
- `npm run typecheck` OK.
- `npm run build` OK.
- `npm run check:supabase-schema` OK.
- `npm run test:federations` OK (3/3).

Pendientes de Fase 1:

- Login real contra base de datos.
- Matriz de permisos por recurso (equipos/stream keys/playlists por usuario).
- CRUD admin funcional en tablas base.

Actualizacion 2026-05-23:

- Login real contra BD completado (tabla `users`).
- Guardas de sesion y admin completadas.
- CRUD inicial completado para `categories` y `teams`.
- Validacion repetida tras cambios: `lint`, `typecheck`, `build` en verde.

Pendiente:

- CRUD para `users`, `stream_keys`, `playlists`, `thumbnail_backgrounds` (alta/listado) completado.
- Permisos finos por recurso asignado para dashboard de usuario.

Actualizacion adicional 2026-05-23:

- Nuevas paginas admin operativas para altas y listados base de usuarios, stream keys, playlists y fondos.
- Validacion en verde tras ampliacion: `npm run lint`, `npm run typecheck`, `npm run build`.

Actualizacion 2026-05-24:

- Separacion de `Admin > Federaciones` (config) y `Agenda competiciones` (operacion).
- Navegacion simplificada y flujo de programacion por tarjeta (`Programar emision`).
- CRUD admin ampliado (telefono usuario, password inicial aleatoria, cambio de password en perfil).
- Modelo de equipos por categoria + letra y stream keys por equipo implementado en codigo.
- Diagnostico schema drift incorporado (script + avisos en admin).

## Pruebas obligatorias por fase

### Fase 1

- Auth.
- Permisos.
- CRUD admin.
- Migración.

### Fase 2

- Creación YouTube mock.
- Creación YouTube real si hay credenciales.
- Bind stream.
- Playlist insert.
- Logs.

### Fase 3

- Edición segura.
- Sync failed/synced.

### Fase 4

- Miniatura con escudos.
- Miniatura sin escudos.
- Miniatura menor de 2 MB.

### Fase 5

- FMP ok/fail.
- RFEP ok/fail.
- Fallback manual.

### Fase 6

- PDF con enlaces clicables.

## Riesgos pendientes

- Estado real del OAuth consent screen.
- Validez real del refresh token.
- HTML real de FMP/RFEP.
- Cuota YouTube.
- Confirmación legal de emisiones con menores.
- No hay drift de schema en el entorno validado localmente.
- Falta confirmacion E2E manual en entorno real para flujo completo de agenda/programacion/permisos.

## Siguiente validacion obligatoria

1. QA funcional end-to-end manual en entorno con datos reales:
   - crear/editar/borrar categoria
   - crear/editar/borrar equipo con letra persistente
   - asignar/desasignar stream key a equipo
   - asignar/desasignar usuario a equipo
   - programar desde agenda y desde formulario manual
2. Verificar `Mis programaciones` con usuario no admin y permisos limitados.
3. Registrar evidencias (capturas o checklist firmado) antes de despliegue final.

## Estado de ejecucion actual (2026-05-25)

- `npm run lint`: OK.
- `npm run typecheck`: OK.
- `npm run build`: OK.
- `npm run check:supabase-schema`: OK.
- `npm run test:federations`: OK (3 passed).
- Fallbacks retirados en admin para `categories.sort_order` y `teams.letter/active`.
