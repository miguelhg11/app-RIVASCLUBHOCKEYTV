import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';

const htmlPath = path.join(process.cwd(), 'scratch', 'agenda_response.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const $ = load(html);

console.log('--- Filtering Rivas Matches ---');
const rows = $('.fila_agenda');
let count = 0;

rows.each((i, el) => {
  const param = $(el).attr('param_game') || '';
  const parts = param.split('_');
  if (parts.length < 5) return;
  
  const modalityId = parts[0];
  const dayOffset = parseInt(parts[1], 10);
  const localClubId = parts[2];
  const visitorClubId = parts[3];
  
  // Modality 1: HOCKEY PATINES
  // Club 395: Rivas
  // Next 7 days: dayOffset < 8 (or check date directly)
  if (modalityId === '1' && (localClubId === '395' || visitorClubId === '395') && dayOffset < 8) {
    count++;
    console.log(`\nMatch #${count} (Offset: ${dayOffset} days):`);
    const cells = [];
    $(el).find('td, div').each((j, cell) => {
      const txt = $(cell).text().replace(/\s+/g, ' ').trim();
      if (txt) {
        cells.push(txt);
      }
    });
    console.log('Cells:', cells);
    console.log('Param:', param);
  }
});

console.log(`\nFound ${count} matches for Rivas in next 7 days.`);
