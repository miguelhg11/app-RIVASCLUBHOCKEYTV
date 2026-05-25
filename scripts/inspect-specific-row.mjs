import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';

const htmlPath = path.join(process.cwd(), 'scratch', 'agenda_response.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const $ = load(html);

const row = $('.fila_agenda[param_game="1_7__395_4750"]');
console.log('Outer HTML:');
console.log($.html(row));

console.log('\nInner cells tag details:');
row.find('td, div').each((i, el) => {
  console.log(`Tag ${i}: name=${el.name}, class=${$(el).attr('class')}, text="${$(el).text().trim()}"`);
});
