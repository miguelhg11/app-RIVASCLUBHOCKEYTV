import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';

const htmlPath = path.join(process.cwd(), 'scratch', 'agenda_response.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const $ = load(html);

console.log('--- Analyzing agenda_response.html ---');

// Let's find all forms
console.log('\nForms found:');
$('form').each((i, el) => {
  console.log(`Form ${i}: Action=${$(el).attr('action')}, Method=${$(el).attr('method')}, ID=${$(el).attr('id')}`);
  $(el).find('input, select, textarea').each((j, input) => {
    console.log(`  Input: name=${$(input).attr('name')}, type=${$(input).attr('type')}, id=${$(input).attr('id')}, value=${$(input).attr('value')}`);
  });
});

// Let's find all select elements
console.log('\nSelects found:');
$('select').each((i, el) => {
  const name = $(el).attr('name');
  const id = $(el).attr('id');
  console.log(`Select ${i}: Name=${name}, ID=${id}`);
  $(el).find('option').slice(0, 10).each((j, opt) => {
    console.log(`  Option: value="${$(opt).attr('value')}" text="${$(opt).text().trim()}"`);
  });
  if ($(el).find('option').length > 10) {
    console.log(`  ... and ${$(el).find('option').length - 10} more options.`);
  }
});

// Let's print all scripts
console.log('\nAll scripts:');
$('script').each((i, el) => {
  const text = $(el).text().trim();
  if (text) {
    console.log(`Script ${i}:`);
    console.log(text.slice(0, 1500) + (text.length > 1500 ? '\n...[TRUNCATED]' : ''));
  }
});

// Let's print selects attributes
console.log('\nSelects attributes:');
$('select').each((i, el) => {
  console.log(`Select ID: ${$(el).attr('id')}, class: ${$(el).attr('class')}, onChange: ${$(el).attr('onchange')}`);
});

