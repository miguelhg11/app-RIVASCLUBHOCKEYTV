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

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Activating FMP in Supabase app_settings...');
  
  const sources = [
    {
      url: 'https://competiciones.fmp.es/',
      active: true,
      source: 'fmp',
      clubFilter: 'CP RIVAS LAS LAGUNAS'
    },
    {
      url: 'https://www.hockeypatines.fep.es/',
      active: true,
      source: 'rfep',
      clubFilter: 'ADISS HOCKEY RIVAS'
    }
  ];

  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: 'federationsSources', value: sources, updated_at: new Date().toISOString() }, { onConflict: 'key' });

  if (error) {
    console.error('Error updating settings:', error.message);
  } else {
    console.log('FMP activated successfully in DB settings.');
  }
}

main().catch(console.error);
