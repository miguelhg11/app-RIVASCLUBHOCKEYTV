# SPEC — Rivas YouTube Live Manager

## 1. Objetivo

Crear una aplicación web mobile-first para simplificar la programación y edición de directos de YouTube del club, evitando que usuarios no administradores accedan a YouTube Studio.

## 2. Usuarios previstos

### Admin

- Gestiona usuarios.
- Gestiona categorías y equipos.
- Asigna equipos, playlists y claves de emisión a usuarios.
- Carga fondos de miniatura.
- Consulta historial y logs.
- Exporta reportes PDF.

### Usuario autorizado

- Crea directos para equipos asignados.
- Edita directos propios/autorizados.
- Consulta sus programaciones.
- Copia enlace de YouTube, RTMP URL y stream key si tiene permiso.

## 3. Flujo principal MVP

1. Usuario inicia sesión.
2. Accede a `/dashboard/new`.
3. Introduce datos manuales del partido.
4. Selecciona equipo, playlist y stream key asignados.
5. Confirma base legal/autorización de emisión.
6. Crea directo.
7. El backend crea broadcast en YouTube, lo vincula a stream key, añade playlist y guarda Supabase.
8. Se muestra pantalla de éxito.

## 4. Funcionalidades principales

- Login y roles.
- Admin CRUD.
- Creación manual de directos.
- Edición sincronizada.
- Miniaturas dinámicas.
- Scraping asistido FMP/RFEP.
- Reportes PDF.
- Logs y auditoría.

## 5. Funcionalidades secundarias

- Compartir enlace por WhatsApp.
- Copiar enlace YouTube, RTMP URL y stream key.
- Indicador de estado de sincronización YouTube.
- Fallback manual si falla scraping.
- Estado de miniatura: pendiente, subida, fallida, omitida.

## 6. Reglas de negocio

- Todos los directos se crean como `unlisted`.
- Latencia siempre `normal`.
- AutoStart siempre `true`.
- AutoStop siempre `false`.
- Un usuario no puede ver ni usar recursos no asignados.
- El scraping nunca bloquea la creación manual.
- El admin puede consultar todo.
- Las claves de emisión son sensibles.

## 7. Datos mínimos de un partido

- Competición.
- Fecha.
- Hora.
- Pista/lugar.
- Equipo local.
- Equipo visitante.
- Escudo local opcional.
- Escudo visitante opcional.
- Fuente: manual, FMP o RFEP.

## 8. Confirmación legal mínima

Antes de crear una emisión, la UI debe exigir checkbox:

> Confirmo que el club dispone de autorización/base jurídica suficiente para la grabación y emisión del encuentro, especialmente si participan menores.

Guardar:

- `confirmed_legal_basis`
- `confirmed_by`
- `confirmed_at`

## 9. Estados principales

### Broadcast

- `pending`: creado localmente o pendiente de sincronizar.
- `synced`: sincronizado con YouTube.
- `failed`: error YouTube o sincronización.
- `cancelled`: cancelado o eliminado lógicamente.

### Miniatura

- `pending`
- `uploaded`
- `failed`
- `skipped`

## 10. Fuera de alcance inicial

- OAuth individual para cada usuario final.
- Creación automática de nuevos `liveStreams` en YouTube.
- Gestión avanzada de chat, monetización o analytics.
- Emisión embebida dentro de la app.
