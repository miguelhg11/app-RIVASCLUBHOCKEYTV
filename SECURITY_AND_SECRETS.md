# SECURITY_AND_SECRETS

## 1. Regla principal

Nunca versionar secretos. Nunca pegarlos en prompts, issues, logs ni respuestas del agente.

## 2. Secretos del proyecto

- `SUPABASE_SERVICE_ROLE_KEY`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REFRESH_TOKEN`
- `SESSION_SECRET`
- `stream_keys.stream_key`

## 3. `.env.local`

Se genera localmente con:

```bash
node scripts/setup-env-local.mjs
```

Se valida con:

```bash
node scripts/check-env.mjs
```

El archivo `.env.local` debe estar ignorado por Git.

## 4. Sobre `oauth2.googleapis.com`

`https://oauth2.googleapis.com/token` es el endpoint de token de Google, no el refresh token. El refresh token es una cadena larga devuelta por OAuth. El endpoint puede dejarse como:

```env
YOUTUBE_TOKEN_URI=https://oauth2.googleapis.com/token
```

## 5. Refresh token y Testing

Si el OAuth consent screen está en `Testing`, los refresh tokens pueden caducar a los 7 días según políticas de Google para determinados proyectos/scopes. La app debe gestionar `invalid_grant` y avisar al admin.

## 6. Server Actions

Cada acción debe revalidar autorización. No basta con proteger la página.

Obligatorio:

- `server-only` en módulos con secretos.
- Validación con Zod.
- Chequeo de sesión.
- Chequeo de rol.
- Chequeo de recurso asignado.
- No devolver secretos.
- Logs sanitizados.

## 7. Supabase service role

`SUPABASE_SERVICE_ROLE_KEY` puede saltarse RLS. Solo usarla en servidor y con autorización propia previa en la app.

## 8. Menores e imagen

La app debe incluir confirmación obligatoria de autorización/base jurídica para emitir partidos, especialmente si participan menores.

## 9. `.gitignore` mínimo

```gitignore
.env
.env.*
!.env.example
```

## 10. Checklist de seguridad

- [ ] `.env.local` no está en Git.
- [ ] Las acciones server revalidan autorización.
- [ ] No se imprime ningún token.
- [ ] No se guarda access token temporal en DB.
- [ ] Logs sin secretos.
- [ ] Stream key solo visible a usuarios autorizados.
- [ ] `invalid_grant` tiene mensaje claro.
- [ ] Fallos de cuota YouTube quedan registrados.
