#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const root = process.cwd();
const envPath = path.join(root, '.env.local');
const gitignorePath = path.join(root, '.gitignore');

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function generateSecret() {
  return crypto.randomBytes(32).toString('base64url');
}

function mask(value) {
  if (!value) return '(vacío)';
  if (value.length <= 8) return '*'.repeat(value.length);
  return `${value.slice(0, 4)}${'*'.repeat(Math.min(16, value.length - 8))}${value.slice(-4)}`;
}

async function promptHidden(label, { required = true, defaultValue = '' } = {}) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    let value = '';

    stdout.write(defaultValue ? `${label} [mantener/Enter]: ` : `${label}: `);
    stdin.resume();
    stdin.setRawMode?.(true);
    stdin.setEncoding('utf8');

    function cleanup() {
      stdin.setRawMode?.(false);
      stdin.pause();
      stdin.removeListener('data', onData);
      stdout.write('\n');
    }

    function onData(char) {
      if (char === '\u0003') {
        cleanup();
        process.exit(130);
      }
      if (char === '\r' || char === '\n') {
        cleanup();
        const finalValue = value || defaultValue;
        if (required && !finalValue) {
          console.log('Valor obligatorio. Inténtalo de nuevo.');
          promptHidden(label, { required, defaultValue }).then(resolve);
        } else {
          resolve(finalValue);
        }
        return;
      }
      if (char === '\u007f') {
        value = value.slice(0, -1);
        return;
      }
      value += char;
    }

    stdin.on('data', onData);
  });
}

async function main() {
  console.log('Asistente local para crear .env.local');
  console.log('No se enviará ningún dato fuera de tu ordenador. No pegues estos secretos en chats ni commits.\n');

  let existing = {};
  if (fs.existsSync(envPath)) {
    const backup = `${envPath}.backup.${nowStamp()}`;
    fs.copyFileSync(envPath, backup);
    console.log(`Ya existía .env.local. Copia de seguridad creada: ${path.basename(backup)}\n`);
    existing = parseEnv(fs.readFileSync(envPath, 'utf8'));
  }

  const rl = readline.createInterface({ input, output });
  const ask = async (key, question, fallback = '') => {
    const current = existing[key] ?? fallback;
    const suffix = current ? ` [${current}]` : '';
    const answer = (await rl.question(`${question}${suffix}: `)).trim();
    return answer || current;
  };

  const appEnv = await ask('APP_ENV', 'APP_ENV', 'development');
  const appBaseUrl = await ask('APP_BASE_URL', 'APP_BASE_URL', 'http://localhost:3000');
  const sessionSecret = existing.SESSION_SECRET || generateSecret();
  console.log(`SESSION_SECRET generado/mantenido: ${mask(sessionSecret)}`);

  const youtubeMockMode = await ask('YOUTUBE_MOCK_MODE', 'YOUTUBE_MOCK_MODE true/false', 'true');
  const supabaseUrl = await ask('NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL');
  rl.pause();
  const supabaseServiceRoleKey = await promptHidden('SUPABASE_SERVICE_ROLE_KEY', { defaultValue: existing.SUPABASE_SERVICE_ROLE_KEY || '' });
  const youtubeClientId = await promptHidden('YOUTUBE_CLIENT_ID', { defaultValue: existing.YOUTUBE_CLIENT_ID || '' });
  const youtubeClientSecret = await promptHidden('YOUTUBE_CLIENT_SECRET', { defaultValue: existing.YOUTUBE_CLIENT_SECRET || '' });
  const youtubeRefreshToken = await promptHidden('YOUTUBE_REFRESH_TOKEN', { defaultValue: existing.YOUTUBE_REFRESH_TOKEN || '' });
  rl.resume();

  const clubName = await ask('CLUB_NAME', 'CLUB_NAME', 'Rivas Club Hockey');
  const fmpClubName = await ask('FMP_CLUB_NAME', 'FMP_CLUB_NAME', 'CP RIVAS LAS LAGUNAS');
  const rfepClubName = await ask('RFEP_CLUB_NAME', 'RFEP_CLUB_NAME', 'ADISS HOCKEY RIVAS');
  const federationLookaheadDays = await ask('FEDERATION_LOOKAHEAD_DAYS', 'FEDERATION_LOOKAHEAD_DAYS', '14');
  const federationCacheMinutes = await ask('FEDERATION_CACHE_MINUTES', 'FEDERATION_CACHE_MINUTES', '60');
  rl.close();

  if (youtubeRefreshToken === 'https://oauth2.googleapis.com/token' || youtubeRefreshToken.includes('oauth2.googleapis.com/token')) {
    console.warn('\nAVISO: Has escrito la URL del endpoint como YOUTUBE_REFRESH_TOKEN.');
    console.warn('Eso no es el refresh token. El endpoint se guardará aparte como YOUTUBE_TOKEN_URI.');
    console.warn('Debes sustituir YOUTUBE_REFRESH_TOKEN por la cadena larga devuelta por OAuth.\n');
  }

  const content = `# Generado localmente por scripts/setup-env-local.mjs\n# NO VERSIONAR. NO PEGAR EN CHATS.\n\nAPP_ENV=${escapeEnv(appEnv)}\nAPP_BASE_URL=${escapeEnv(appBaseUrl)}\nSESSION_SECRET=${escapeEnv(sessionSecret)}\nYOUTUBE_MOCK_MODE=${escapeEnv(youtubeMockMode)}\n\nNEXT_PUBLIC_SUPABASE_URL=${escapeEnv(supabaseUrl)}\nSUPABASE_SERVICE_ROLE_KEY=${escapeEnv(supabaseServiceRoleKey)}\n\nYOUTUBE_CLIENT_ID=${escapeEnv(youtubeClientId)}\nYOUTUBE_CLIENT_SECRET=${escapeEnv(youtubeClientSecret)}\nYOUTUBE_REFRESH_TOKEN=${escapeEnv(youtubeRefreshToken)}\nYOUTUBE_TOKEN_URI=https://oauth2.googleapis.com/token\nYOUTUBE_SCOPE=https://www.googleapis.com/auth/youtube\n\nCLUB_NAME=${escapeEnv(clubName)}\nFMP_CLUB_NAME=${escapeEnv(fmpClubName)}\nRFEP_CLUB_NAME=${escapeEnv(rfepClubName)}\nFEDERATION_LOOKAHEAD_DAYS=${escapeEnv(federationLookaheadDays)}\nFEDERATION_CACHE_MINUTES=${escapeEnv(federationCacheMinutes)}\n\nDEFAULT_PRIVACY_STATUS=unlisted\nDEFAULT_LATENCY_PREFERENCE=normal\nDEFAULT_ENABLE_AUTO_START=true\nDEFAULT_ENABLE_AUTO_STOP=false\n`;

  fs.writeFileSync(envPath, content, { mode: 0o600 });
  ensureGitignore();

  console.log('\n.env.local creado correctamente. Resumen:');
  console.log(`NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`);
  console.log(`SUPABASE_SERVICE_ROLE_KEY=${mask(supabaseServiceRoleKey)}`);
  console.log(`YOUTUBE_CLIENT_ID=${mask(youtubeClientId)}`);
  console.log(`YOUTUBE_CLIENT_SECRET=${mask(youtubeClientSecret)}`);
  console.log(`YOUTUBE_REFRESH_TOKEN=${mask(youtubeRefreshToken)}`);
  console.log('\nEjecuta ahora: node scripts/check-env.mjs');
}

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

function escapeEnv(value) {
  const v = String(value ?? '');
  if (/\s|#|"|'/.test(v)) return JSON.stringify(v);
  return v;
}

function ensureGitignore() {
  let current = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
  const needed = ['.env', '.env.*', '!.env.example'];
  let changed = false;
  for (const item of needed) {
    if (!current.split(/\r?\n/).includes(item)) {
      current += `${current.endsWith('\n') || current.length === 0 ? '' : '\n'}${item}\n`;
      changed = true;
    }
  }
  if (changed) fs.writeFileSync(gitignorePath, current);
}

main().catch((err) => {
  console.error('Error creando .env.local:', err?.message || err);
  process.exit(1);
});
