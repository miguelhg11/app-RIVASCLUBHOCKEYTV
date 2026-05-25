# PACKAGE_JSON_SCRIPTS

Añadir estos scripts al `package.json` del proyecto si no existen:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "setup:env": "node scripts/setup-env-local.mjs",
    "check:env": "node scripts/check-env.mjs",
    "check:youtube-token": "node scripts/check-env.mjs --youtube-token-check"
  }
}
```

Dependencias recomendadas:

```bash
npm install googleapis @supabase/supabase-js zod bcrypt jspdf jspdf-autotable cheerio server-only
npm install -D typescript @types/node
```
