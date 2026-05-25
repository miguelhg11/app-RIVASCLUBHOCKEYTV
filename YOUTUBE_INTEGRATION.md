# YOUTUBE_INTEGRATION

## 1. Variables necesarias

```env
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REFRESH_TOKEN=
YOUTUBE_TOKEN_URI=https://oauth2.googleapis.com/token
YOUTUBE_SCOPE=https://www.googleapis.com/auth/youtube
YOUTUBE_MOCK_MODE=false
```

## 2. Cliente OAuth2

Usar `google.auth.OAuth2` en servidor:

```ts
const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
});
```

## 3. Flujo de creación

1. `youtube.liveBroadcasts.insert`
2. `youtube.liveBroadcasts.bind`
3. `youtube.playlistItems.insert`
4. `youtube.thumbnails.set`
5. Guardar resultado en Supabase
6. Registrar `operation_logs`

## 4. Parámetros obligatorios

En creación y actualización:

- `status.privacyStatus = 'unlisted'`
- `contentDetails.latencyPreference = 'normal'`
- `contentDetails.enableAutoStart = true`
- `contentDetails.enableAutoStop = false`

## 5. Actualización segura

Antes de `liveBroadcasts.update`:

- reconstruir payload completo para las partes incluidas;
- no enviar `status` incompleto;
- no enviar `contentDetails` incompleto;
- preservar valores obligatorios.

## 6. Miniaturas

Usar:

```ts
youtube.thumbnails.set({
  auth,
  videoId,
  media: { mimeType, body }
});
```

No usar `youtube.liveThumbnails.set`.

Validar:

- PNG/JPEG.
- Menor de 2 MB.
- Fallback si faltan escudos.

## 7. Playlists

Usar:

```ts
youtube.playlistItems.insert(...)
```

No usar `YoutubelistItems.insert`.

## 8. Errores a manejar

- `invalid_grant`: token caducado/revocado o OAuth en Testing.
- `quotaExceeded`.
- `rateLimitExceeded`.
- `userRequestsExceedRateLimit`.
- `forbidden`.
- `notFound`.

## 9. Modo mock

Implementar `YOUTUBE_MOCK_MODE=true` para desarrollo sin gastar cuota.

El mock debe devolver IDs y URLs con formato similar a YouTube, pero claramente marcados como mock.
