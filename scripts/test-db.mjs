import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.join(process.cwd(), '.env.local');

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

if (!fs.existsSync(envPath)) {
  console.error('No .env.local found');
  process.exit(1);
}

const env = parseEnv(fs.readFileSync(envPath, 'utf8'));

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing supabase configuration in .env.local');
  process.exit(1);
}

console.log('Connecting to Supabase:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName) {
  const { data, error, count } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });
  if (error) {
    console.error(`Error querying table ${tableName}:`, error.message);
  } else {
    console.log(`Table ${tableName}: OK (count: ${count})`);
  }
}

async function listUsers() {
  const { data, error } = await supabase.from('users').select('id, email, name, role, active');
  if (error) {
    console.error('Error listing users:', error.message);
  } else {
    console.log('Users in DB:');
    console.table(data);
  }
}

async function main() {
  await checkTable('users');
  await checkTable('categories');
  await checkTable('teams');
  await checkTable('stream_keys');
  await checkTable('playlists');
  await checkTable('thumbnail_backgrounds');
  await checkTable('app_settings');
  await listUsers();

  const { data: settings } = await supabase.from('app_settings').select('*');
  console.log('App settings contents:');
  console.dir(settings, { depth: null });
}

main().catch(console.error);
