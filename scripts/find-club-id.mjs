import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';

const htmlPath = path.join(process.cwd(), 'scratch', 'agenda_response.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const $ = load(html);

console.log('--- Club Options search for Rivas/Lagunas ---');
$('#agenda_club_select option').each((i, el) => {
  const txt = $(el).text();
  if (txt.toLowerCase().includes('rivas') || txt.toLowerCase().includes('lagunas')) {
    console.log(`Club Option: value="${$(el).attr('value')}" text="${txt}"`);
  }
});
