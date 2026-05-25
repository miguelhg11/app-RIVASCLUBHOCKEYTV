import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';

const htmlPath = path.join(process.cwd(), 'scratch', 'agenda_response.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const $ = load(html);

console.log('--- Analyzing .fila_agenda rows ---');

const rows = $('.fila_agenda');
console.log(`Total rows with class .fila_agenda: ${rows.length}`);

if (rows.length > 0) {
  // Let's print the first 5 rows' HTML and attributes
  rows.slice(0, 5).each((i, el) => {
    console.log(`\nRow ${i}:`);
    console.log('Attributes:', el.attribs);
    // Print clean text of cells inside the row
    const cells = [];
    $(el).find('td, div').each((j, cell) => {
      const txt = $(cell).text().replace(/\s+/g, ' ').trim();
      if (txt) {
        cells.push(txt);
      }
    });
    console.log('Text cells:', cells);
  });
}
