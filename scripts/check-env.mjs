#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const envPath = path.join(process.cwd(), '.env.local');
const args = new Set(process.argv.slice(2));

const required = [
  'APP_BASE_URL',
  'SESSION_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'YOUTUBE_CLIENT_ID',
  'YOUTUBE_CLIENT_SECRET',
  'YOUTUBE_REFRESH_TOKEN',
  'YOUTUBE_TOKEN_URI',
  'YOUTUBE_SCOPE',
];

function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function isPlaceholder(value) {
  if (!value) return true;
  return /replace-with|your-|changeme|placeholder/i.test(value);
}

function mask(value) {
  if (!value) return '(vacío)';
  if (value.length <= 8) return '*'.repeat(value.length);
  return `${value.slice(0, 4)}${'*'.repeat(Math.min(12, value.length - 8))}${value.slice(-4)}`;
}

async function main() {
  if (!fs.existsSync(envPath)) {
    console.error('No existe .env.local. Ejecuta: node scripts/setup-env-local.mjs');
    process.exit(1);
  }

  const env = parseEnv(fs.readFileSync(envPath, 'utf8'));
  const errors = [];
  const warnings = [];

  for (const key of required) {
    if (isPlaceholder(env[key])) errors.push(`${key} está vacío o parece placeholder.`);
  }

  if (env.YOUTUBE_REFRESH_TOKEN?.includes('oauth2.googleapis.com/token')) {
    errors.push('YOUTUBE_REFRESH_TOKEN contiene la URL del endpoint. Debe contener el refresh token real. La URL va en YOUTUBE_TOKEN_URI.');
  }

  if (env.YOUTUBE_TOKEN_URI !== 'https://oauth2.googleapis.com/token') {
    warnings.push('YOUTUBE_TOKEN_URI no es el valor esperado https://oauth2.googleapis.com/token.');
  }

  if (env.YOUTUBE_MOCK_MODE === 'false' && errors.length === 0) {
    warnings.push('YOUTUBE_MOCK_MODE=false: las acciones pueden llamar a Google y consumir cuota si la app está implementada.');
  }

  console.log('Validación local de .env.local');
  for (const key of required) {
    console.log(`- ${key}: ${key.includes('SECRET') || key.includes('TOKEN') || key.includes('KEY') ? mask(env[key]) : env[key]}`);
  }

  if (warnings.length) {
    console.log('\nAvisos:');
    warnings.forEach((w) => console.log(`- ${w}`));
  }

  if (errors.length) {
    console.error('\nErrores:');
    errors.forEach((e) => console.error(`- ${e}`));
    process.exit(1);
  }

  if (args.has('--youtube-token-check')) {
    await checkYoutubeToken(env);
  }

  console.log('\n.env.local parece correcto.');
}

async function checkYoutubeToken(env) {
  console.log('\nComprobando intercambio de refresh token con Google...');
  const body = new URLSearchParams({
    client_id: env.YOUTUBE_CLIENT_ID,
    client_secret: env.YOUTUBE_CLIENT_SECRET,
    refresh_token: env.YOUTUBE_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });

  const res = await fetch(env.YOUTUBE_TOKEN_URI, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = json.error || res.status;
    const description = json.error_description || 'Sin descripción';
    console.error(`Error OAuth: ${code} — ${description}`);
    if (code === 'invalid_grant') {
      console.error('Posible token caducado/revocado o OAuth consent screen en Testing. Regenera el token o pasa a Production si procede.');
    }
    process.exit(1);
  }

  if (!json.access_token) {
    console.error('Google respondió OK pero no devolvió access_token. Revisa credenciales.');
    process.exit(1);
  }

  console.log('Intercambio correcto. No se imprime el access token.');
}

main().catch((err) => {
  console.error('Error validando entorno:', err?.message || err);
  process.exit(1);
});
