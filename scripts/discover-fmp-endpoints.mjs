import fetch from 'node-fetch'; // wait, node-fetch might not be installed or we can use native global fetch since Node 18+ is used
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  console.log('--- FMP DISCOVERY ---');
  console.log('Fetching agenda_portales.php...');

  // Use global fetch (Node 18+)
  try {
    const res = await fetch('https://sidgad.cloud/shared/portales_files/agenda_portales.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        cliente: 'fmp',
        idm: '1',
        id_temp: '21', // typical season ID or active temp
      }),
    });

    if (!res.ok) {
      console.error(`HTTP error: ${res.status}`);
      return;
    }

    const html = await res.text();
    console.log(`Fetched ${html.length} bytes.`);
    
    // Save it to a file so we can view it
    const outputDir = path.join(process.cwd(), 'scratch');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = path.join(outputDir, 'agenda_response.html');
    fs.writeFileSync(outputPath, html, 'utf8');
    console.log(`Saved response to ${outputPath}`);

  } catch (error) {
    console.error('Fetch error:', error);
  }
}

main();
