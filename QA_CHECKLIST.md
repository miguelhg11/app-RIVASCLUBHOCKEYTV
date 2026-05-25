# QA_CHECKLIST

## 1. Seguridad

- [ ] `.env.local` no está versionado.
- [ ] Los secretos no aparecen en consola.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` solo se usa en servidor.
- [ ] Módulos sensibles importan `server-only`.
- [ ] Server Actions revalidan sesión y permisos.
- [ ] Usuario no admin no entra en `/admin`.
- [ ] Usuario no ve equipos ajenos.
- [ ] Usuario no usa stream keys no asignadas.
- [ ] Usuario no edita broadcasts ajenos.

## 2. Auth

- [ ] Login correcto.
- [ ] Login erróneo no revela si existe email.
- [ ] Logout correcto.
- [ ] Sesión caducada redirige a login.
- [ ] Contraseña no se guarda en claro.

## 3. YouTube

- [ ] Mock mode funciona.
- [ ] Creación real o mock crea broadcast.
- [ ] Se fuerza `unlisted`.
- [ ] Se fuerza latencia normal.
- [ ] AutoStart true.
- [ ] AutoStop false.
- [ ] Bind usa `youtube_live_stream_id`.
- [ ] Playlist usa `youtube.playlistItems.insert`.
- [ ] Thumbnail usa `youtube.thumbnails.set`.
- [ ] `invalid_grant` muestra mensaje admin.
- [ ] Errores de cuota quedan en logs.

## 4. Base de datos

- [ ] Migración aplica limpia.
- [ ] FKs correctas.
- [ ] Unique constraints correctas.
- [ ] `updated_at` funciona.
- [ ] Logs no guardan secretos.

## 5. UI/UX

- [ ] Mobile-first real.
- [ ] Inputs grandes.
- [ ] Estados de carga.
- [ ] Errores claros.
- [ ] Pantalla éxito con copiar.
- [ ] WhatsApp share.

## 6. Scraping

- [ ] Fallo FMP no bloquea formulario.
- [ ] Fallo RFEP no bloquea formulario.
- [ ] Datos extraídos son editables.
- [ ] Cache evita consultas agresivas.
- [ ] Logs registran fuente y errores.

## 7. PDF

- [ ] Solo admin.
- [ ] Rango de fechas filtra bien.
- [ ] Enlaces YouTube clicables.
- [ ] Formato legible.

## 8. Build

- [ ] `npm run lint`.
- [ ] `npm run typecheck`.
- [ ] `npm run build`.
- [ ] `node scripts/check-env.mjs`.
