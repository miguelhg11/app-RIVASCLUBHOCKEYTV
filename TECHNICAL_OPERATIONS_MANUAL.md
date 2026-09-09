# MANUAL TÉCNICO OPERATIVO — Rivas YouTube Live Manager

Este manual está escrito para que otro agente IA pueda ejecutar tareas **en orden**, con comandos concretos, criterios de éxito y límites claros.

Regla principal: **no improvisar**. Si un paso falla, detenerse, copiar el error exacto y resolver solo ese paso antes de continuar.

---

## 0. Convenciones

- Directorio raíz del proyecto: `rivas_youtube_live_handoff`.
- Sistema esperado: Windows + PowerShell.
- No mostrar secretos en respuestas ni documentación.
- No hacer `git commit`, `git push`, `git reset`, `git rebase` ni despliegues a producción salvo petición explícita del usuario.
- No borrar base de datos ni contenido de YouTube salvo petición explícita.
- Para cambios de código: hacer cambios mínimos y ejecutar verificación inmediata.

---

## 1. Prerequisitos

Comprobar que existen estos archivos:

```powershell
Test-Path package.json
Test-Path .env.local
Test-Path next.config.ts
Test-Path src/lib/youtube/service.ts
Test-Path src/lib/supabase/server.ts
```

Criterio de éxito: todos devuelven `True`.

Si falta `.env.local`, no inventar credenciales. Pedir al usuario que las configure o ejecutar solo:

```powershell
npm run setup:env
```

---

## 1.1. Crear o reparar admin inicial de forma segura

Usar solo si el usuario lo pide explícitamente o si no existe ningún admin operativo.

No usar contraseñas hardcodeadas ni guardarlas en archivos.

Opción recomendada, generando contraseña aleatoria en memoria:

```powershell
$env:ADMIN_BOOTSTRAP_EMAIL="admin@example.com"
node .\scripts\bootstrap-admin.mjs
Remove-Item Env:ADMIN_BOOTSTRAP_EMAIL
```

Opción con contraseña proporcionada por el usuario para esta ejecución concreta:

```powershell
$env:ADMIN_BOOTSTRAP_EMAIL="admin@example.com"
$env:ADMIN_BOOTSTRAP_PASSWORD="PEGAR_AQUI_PASSWORD_TEMPORAL"
node .\scripts\bootstrap-admin.mjs
Remove-Item Env:ADMIN_BOOTSTRAP_EMAIL
Remove-Item Env:ADMIN_BOOTSTRAP_PASSWORD
```

Criterio de éxito:
- el script imprime `CREATED_ADMIN` o `UPDATED_ADMIN`;
- no imprime la contraseña real;
- no queda ningún archivo local con credenciales.

Después de usar una contraseña temporal:
1. entrar como admin;
2. cambiar contraseña desde perfil;
3. rotarla si fue compartida por chat.

---

## 2. Verificación base obligatoria

Ejecutar en este orden:

```powershell
npm run typecheck
npm run lint
npm run test:federations
npx tsx --test tests/fmp-parser.test.ts tests/thumbnails/resolver.test.ts
npm audit
npm run check:env
npm run check:supabase-schema
npm run check:youtube-token
npm run build
```

Criterios de éxito:

- `typecheck`: sin errores.
- `lint`: sin errores.
- tests: todos pasan.
- `audit`: idealmente `found 0 vulnerabilities`.
- `check:env`: `.env.local parece correcto`.
- `check:supabase-schema`: `Schema check passed`.
- `check:youtube-token`: `Intercambio correcto`.
- `build`: termina con lista de rutas.

Si `build` falla por archivos antiguos de `.next/types`, ejecutar:

```powershell
Remove-Item -LiteralPath ".next\types" -Recurse -Force -ErrorAction SilentlyContinue
npm run build
npm run typecheck
```

No borrar `.next\dev` si Windows devuelve acceso denegado. No es necesario para producción.

---

## 3. Comprobar integración YouTube real sin modificar nada

Solo lectura. No crea, edita ni borra recursos.

Ejecutar uno por uno:

```powershell
node --env-file=.env.local .\node_modules\tsx\dist\cli.mjs -e "import { listYouTubeChannelBroadcasts } from './src/lib/youtube/service.ts'; listYouTubeChannelBroadcasts().then((rows)=>console.log(JSON.stringify({ broadcasts: rows.length, statuses: rows.slice(0,5).map(r=>r.lifeCycleStatus) }))).catch((err)=>{ console.error(err?.message || err); process.exit(1); });"
```

```powershell
node --env-file=.env.local .\node_modules\tsx\dist\cli.mjs -e "import { listYouTubeChannelStreams } from './src/lib/youtube/service.ts'; listYouTubeChannelStreams().then((rows)=>console.log(JSON.stringify({ streams: rows.length, statuses: rows.slice(0,5).map(r=>r.streamStatus) }))).catch((err)=>{ console.error(err?.message || err); process.exit(1); });"
```

```powershell
node --env-file=.env.local .\node_modules\tsx\dist\cli.mjs -e "import { listYouTubeChannelPlaylists } from './src/lib/youtube/service.ts'; listYouTubeChannelPlaylists().then((rows)=>console.log(JSON.stringify({ playlists: rows.length }))).catch((err)=>{ console.error(err?.message || err); process.exit(1); });"
```

```powershell
node --env-file=.env.local .\node_modules\tsx\dist\cli.mjs -e "import { listYouTubeChannelVideos } from './src/lib/youtube/service.ts'; listYouTubeChannelVideos().then((rows)=>console.log(JSON.stringify({ videos: rows.length, types: rows.slice(0,5).map(r=>r.videoType) }))).catch((err)=>{ console.error(err?.message || err); process.exit(1); });"
```

Criterio de éxito: cada comando devuelve un JSON con contadores (`broadcasts`, `streams`, `playlists`, `videos`).

Si aparece `Internal error encountered`, repetir una vez. Si persiste en una sola operación, documentar esa operación y no asumir fallo global de OAuth.

---

## 4. Regla obligatoria de stream keys

No permitir reutilizar una stream key asociada a una emisión activa o programada.

Estados que bloquean una key:

```text
created
ready
testing
live
unknown
```

Estados que la liberan:

```text
complete
deleted localmente con deleted_at no nulo
```

Antes de tocar disponibilidad de keys, comprobar estos archivos:

```text
src/lib/user/queries.ts
src/lib/broadcast/queries.ts
src/actions/broadcast.actions.ts
```

Cambio prohibido: reducir el bloqueo solo a `testing/live`.

---

## 5. Flujo seguro para modificar código

1. Leer archivos afectados.
2. Buscar referencias antes de editar.
3. Editar mínimo.
4. Ejecutar:

```powershell
npm run typecheck
npm run lint
```

5. Si pasa, ejecutar:

```powershell
npm run build
```

6. Si el cambio toca federaciones o escudos, ejecutar además:

```powershell
npm run test:federations
npx tsx --test tests/fmp-parser.test.ts tests/thumbnails/resolver.test.ts
```

No hacer más cambios mientras haya errores sin resolver.

---

## 6. Tarea: eliminar una funcionalidad sin romper dependencias

Orden obligatorio:

1. Buscar símbolo/ruta:

```powershell
# Sustituir NOMBRE por el símbolo exacto
Get-ChildItem app,src,scripts,tests -Recurse -File | Select-String -Pattern "NOMBRE"
```

2. Clasificar referencias:
   - UI visible
   - API route
   - Server Action
   - helper/lib
   - tests
   - documentación
   - scripts scratch

3. Borrar primero rutas/UI no usadas.
4. Actualizar imports y llamadas.
5. Borrar helpers solo cuando no queden referencias.
6. Ejecutar verificación completa de la sección 2.

No dejar imports rotos ni botones que llamen a rutas eliminadas.

---

## 7. Tarea: añadir una funcionalidad

1. Confirmar requisito exacto con el usuario.
2. Localizar página/action/servicio existente.
3. Añadir validación Zod si entra input de usuario.
4. Añadir guardia de sesión/rol si es operación sensible.
5. Registrar operación en `operation_logs` sin secretos.
6. Añadir test si el proyecto ya tiene patrón cercano.
7. Ejecutar verificación completa.

No añadir nuevas dependencias salvo necesidad clara.

---

## 8. Tarea: actualizar dependencias de forma segura

Primero:

```powershell
npm audit
```

Si hay fixes compatibles:

```powershell
npm audit fix
```

Después:

```powershell
npm run typecheck
npm run lint
npm run build
```

No usar `npm audit fix --force` salvo autorización expresa. Puede introducir cambios major incompatibles.

Si una vulnerabilidad requiere major, documentar:
- paquete;
- versión actual;
- versión requerida;
- uso dentro del proyecto;
- riesgo de actualizar.

---

## 9. Tarea: comprobar Supabase

Ejecutar:

```powershell
npm run check:supabase-schema
```

Si se necesita una comprobación de tablas concreta, usar solo lectura:

```powershell
node --env-file=.env.local -e "const { createClient } = require('@supabase/supabase-js'); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession:false, autoRefreshToken:false } }); const tables = ['users','teams','stream_keys','playlists','broadcasts','operation_logs']; (async()=>{ for (const table of tables) { const { error } = await supabase.from(table).select('*').limit(1); console.log(table + ': ' + (error ? 'ERROR ' + error.message : 'OK')); } })();"
```

No insertar, actualizar ni borrar datos durante una auditoría.

---

## 10. Tarea: comprobar Vercel localmente

1. Validar JSON:

```powershell
node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8')); console.log('vercel.json OK')"
```

2. Comprobar CLI:

```powershell
npx vercel --version
```

3. Build equivalente:

```powershell
npm run build
```

4. Build Vercel solo si el proyecto está enlazado:

```powershell
npx vercel build
```

Si devuelve `No Project Settings found locally`, no improvisar. Indicar que falta:

```powershell
npx vercel link
```

y confirmación del usuario antes de enlazar.

---

## 11. Tarea: probar email sin enviar correo real

Solo verificar configuración y rutas de código:

```powershell
Get-ChildItem src,scripts,.env.example -Recurse -File -ErrorAction SilentlyContinue | Select-String -Pattern "EMAIL_PROVIDER|RESEND_API_KEY|GMAIL_USER|GMAIL_APP_PASSWORD"
npm run check:env
```

Para prueba real de envío, pedir confirmación explícita del usuario y destinatario concreto.

---

## 12. Tarea: limpiar métricas/analítica

Estado esperado actual:

- No existe `app/(protected)/admin/stats/page.tsx`.
- No existe `app/api/admin/youtube/analytics/[id]/route.ts`.
- No existe `app/api/admin/reports/event-analytics/[id]/route.ts`.
- No existe `app/r/[id]/route.ts`.
- No existen imports de `broadcast_analytics` en `app` ni `src`.

Comprobar:

```powershell
Get-ChildItem app,src -Recurse -File | Select-String -Pattern "admin/stats|broadcast_analytics|getTrackingUrl|CopyTracking|youtubeAnalytics|getYouTubeVideoAnalytics|event-analytics"
```

Criterio de éxito: sin resultados.

La tabla Supabase `broadcast_analytics` puede existir como residual histórico. No borrarla sin autorización explícita.

---

## 13. Tarea: revisar seguridad básica

Comprobar:

```powershell
Get-ChildItem app,src,public -Recurse -File | Select-String -Pattern "SUPABASE_SERVICE_ROLE_KEY|YOUTUBE_CLIENT_SECRET|YOUTUBE_REFRESH_TOKEN|SESSION_SECRET|stream_key"
```

Revisar que secretos no se imprimen en logs ni respuestas cliente.

Reglas:

- `SUPABASE_SERVICE_ROLE_KEY` solo en servidor.
- `stream_key` solo en pantalla autorizada.
- No devolver secretos en APIs.
- No guardar access tokens temporales en DB.
- No exponer contraseñas en documentación.

Si existe un archivo con credenciales reales:
1. No copiar su contenido.
2. Avisar al usuario.
3. Recomendar eliminación y rotación.
4. Añadirlo a `.gitignore` solo como medida temporal.

---

## 14. Tarea: crear o actualizar documentación

Solo crear/editar documentación si el usuario lo pide o si el proyecto exige mantener un documento ya existente.

No crear documentación extra innecesaria.

Si se modifica una regla estructural, actualizar el documento correspondiente:

- arquitectura: `ARCHITECTURE.md`
- estado: `PROJECT_STATE.md`
- QA: `QA_STATUS.md`
- seguridad: `SECURITY_AND_SECRETS.md`
- YouTube: `YOUTUBE_INTEGRATION.md` o `YOUTUBE_INTEGRATION_GOVERNANCE.md`

---

## 15. QA manual E2E obligatorio antes de dar por cerrado un cambio funcional

Ejecutar con datos reales solo si el usuario lo autoriza.

### Admin

1. Login admin.
2. Crear/editar categoría.
3. Crear/editar equipo.
4. Asignar stream key al equipo.
5. Asignar playlist al equipo.
6. Crear usuario no admin.
7. Asignar usuario al equipo.
8. Programar emisión manual.
9. Editar emisión.
10. Ver detalle.
11. Copiar enlace directo YouTube.
12. Finalizar emisión si está en directo.
13. Generar PDF semanal.

### Usuario limitado

1. Login usuario no admin.
2. Confirmar que solo ve recursos asignados.
3. Intentar programar con equipo asignado.
4. Confirmar que no puede usar stream key ocupada.
5. Confirmar que no puede publicar en público sin permiso.
6. Confirmar que no accede a `/admin`.

Registrar resultado de cada paso: OK/FALLO + captura o mensaje.

---

## 16. Criterios para decir “todo correcto”

Solo decirlo si se cumplen todos:

- Build OK.
- Typecheck OK.
- Lint OK.
- Tests relevantes OK.
- Supabase schema OK.
- YouTube OAuth OK.
- Lectura YouTube real OK.
- Sin vulnerabilidades críticas/altas en `npm audit`.
- Sin imports/rutas rotas.
- Sin secretos expuestos.
- QA manual relevante superado.

Si falta QA manual o Vercel real, decir:

> La verificación técnica local está completa; falta validación E2E/producción.

No decir “todo funciona” sin esa precisión.

---

## 17. Qué hacer si algo falla

1. Copiar el comando exacto.
2. Copiar el error completo.
3. Identificar si falla por:
   - dependencia;
   - tipo TypeScript;
   - ruta eliminada;
   - variable de entorno;
   - permiso;
   - servicio externo.
4. Corregir solo esa causa.
5. Repetir verificación.

No cambiar varias áreas a la vez para intentar “tapar” un error.

---

## 18. Operaciones prohibidas sin autorización explícita

- Borrar datos de Supabase.
- Borrar vídeos o broadcasts de YouTube.
- Cambiar visibilidad pública de contenidos.
- Enviar emails reales.
- Desplegar a producción.
- Hacer commits o push.
- Actualizar dependencias major con breaking changes.
- Eliminar tablas o migraciones históricas.
- Mostrar secretos o credenciales.

---

## 19. Comandos rápidos de referencia

```powershell
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test:federations
npx tsx --test tests/fmp-parser.test.ts tests/thumbnails/resolver.test.ts
npm run check:env
npm run check:youtube-token
npm run check:supabase-schema
npm audit
npx vercel --version
```

---

## 20. Estado actual conocido

A fecha de esta auditoría:

- Build: OK.
- Typecheck: OK.
- Lint: OK.
- Tests: OK.
- Supabase: OK.
- YouTube OAuth/API lectura: OK.
- Dependencias: 0 vulnerabilidades reportadas.
- Métricas de emisiones: retiradas de la app.
- Caducidad automática 24h: retirada.
- Stream keys: regla conservadora correcta.

Pendientes importantes:

- Confirmar que la contraseña admin actual fue rotada si alguna vez estuvo en texto plano.
- Implementar permisos federados reales por equipo.
- Mejorar sesiones/revocación.
- Hacer QA E2E manual.
- Verificar Vercel y email en entorno real.
