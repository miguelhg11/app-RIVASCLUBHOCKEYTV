# UI_UX_ROUTES

## 1. Diseño visual

- Mobile-first.
- Tema oscuro Slate/Zinc.
- Botones grandes, cómodos para dedos.
- Inputs altos, legibles y con buen contraste.
- Estados de carga claros.
- Mensajes de error humanos.
- Confirmaciones antes de acciones críticas.

## 2. Rutas

```text
/login
/dashboard
/dashboard/new
/dashboard/broadcasts
/dashboard/broadcasts/[id]/edit
/dashboard/broadcasts/[id]/success
/admin
/admin/users
/admin/categories
/admin/teams
/admin/stream-keys
/admin/playlists
/admin/thumbnail-backgrounds
/admin/broadcasts
/admin/reports
/admin/logs
```

## 3. Pantalla login

Elementos:

- Logo/nombre del club.
- Email.
- Contraseña.
- Botón entrar.
- Mensaje de error.

## 4. Dashboard usuario

Elementos:

- Botón principal `Programar directo`.
- Tarjetas de próximos directos.
- Estado de sincronización.
- Acceso a `Mis programaciones`.

## 5. Crear/editar directo

Secciones:

1. Equipo y competición.
2. Partido.
3. Fecha, hora y pista.
4. YouTube: playlist y stream key.
5. Miniatura.
6. Confirmación legal.
7. Botón crear/guardar.

## 6. Pantalla éxito

Mostrar:

- Enlace YouTube con copiar.
- Botón compartir WhatsApp.
- RTMP URL con copiar.
- Stream key con copiar y aviso de confidencialidad.
- Estado de miniatura.
- Botón volver al dashboard.

## 7. Admin

Secciones:

- Usuarios.
- Categorías.
- Equipos.
- Stream keys.
- Playlists.
- Fondos.
- Broadcasts.
- Reportes.
- Logs.

## 8. Estados UX obligatorios

- Loading.
- Empty state.
- Error recuperable.
- Error crítico.
- Éxito.
- Sin permisos.
- Reintentar.

## 9. Accesibilidad mínima

- Labels visibles.
- Focus visible.
- Contraste suficiente.
- Botones con texto claro.
- No depender solo del color.
