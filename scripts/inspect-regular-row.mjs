import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';

const htmlPath = path.join(process.cwd(), 'scratch', 'agenda_response.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const $ = load(html);

// Row 2 is '1_7_434_395_4302'
const row = $('.fila_agenda[param_game="1_7_434_395_4302"]');
console.log('Outer HTML:');
console.log($.html(row));

console.log('\nInner cells tag details:');
row.children('td').each((i, el) => {
  console.log(`TD ${i}: class="${$(el).attr('class') || ''}", text="${$(el).text().trim()}", html="${$(el).html().trim().replace(/\s+/g, ' ')}"`);
});
