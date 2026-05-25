import { parseRfepCalendarHtml } from "../src/lib/federations/rfep/parser";
import fs from "fs";

const leagues = [
  { id: 3150, name: "OK LIGA MASCULINA" },
  { id: 3151, name: "OK LIGA IBERDROLA" },
  { id: 3153, name: "OK LIGA PLATA NORTE" },
  { id: 3154, name: "OK LIGA PLATA SUR" },
  { id: 3155, name: "OK LIGA PLATA FEMENINA" },
  { id: 3156, name: "OK LIGA BRONCE MASCULINA NORTE" },
  { id: 3158, name: "OK LIGA BRONCE MASCULINA SUR" },
  { id: 3258, name: "COPA DEL REY" },
  { id: 3259, name: "COPA DE LA REINA IBERDROLA" },
  { id: 3177, name: "SUPERCOPA DE ESPAÑA MASCULINA" },
  { id: 3178, name: "SUPERCOPA DE ESPAÑA FEMENINA" },
  { id: 3301, name: "COPA SAR LA PRINCESA MASCULINA" },
  { id: 3302, name: "COPA SAR LA PRINCESA FEMENINA" },
  { id: 3260, name: "MINICOPA DEL REY" },
  { id: 3261, name: "MINI COPA DE LA REINA" },
  { id: 3460, name: "XXX CTO ESPAÑA SELECC MASCULINO" },
  { id: 3461, name: "XVII CTO ESPAÑA SELECC FEMENINO" },
  { id: 3462, name: "CAMPEONATO DE ESPAÑA ALEVIN" },
  { id: 3463, name: "CAMPEONATO DE ESPAÑA INFANTIL" },
  { id: 3464, name: "CAMPEONATO DE ESPAÑA JUVENIL" },
  { id: 3465, name: "CAMPEONATO DE ESPAÑA JUNIOR" },
  { id: 3487, name: "COPA DE ESPAÑA ALEVIN FEMENINA" },
  { id: 3488, name: "COPA DE ESPAÑA INFANTIL FEMENINA" },
  { id: 3489, name: "COPA DE ESPAÑA JUVENIL FEMENINA" }
];

async function run() {
  const allRivasMatches = [];
  
  for (const league of leagues) {
    const url = `https://www.server2.sidgad.es/rfep/rfep_cal_idc_${league.id}_1.php`;
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
          "Referer": "https://www.hockeypatines.fep.es/",
          "Origin": "https://www.hockeypatines.fep.es"
        }
      });
      if (!response.ok) {
        console.log(`Failed for league ${league.id} (${league.name})`);
        continue;
      }
      const html = await response.text();
      if (html.length === 0) {
        console.log(`Empty body for league ${league.id} (${league.name})`);
        continue;
      }
      const matches = parseRfepCalendarHtml(html, league.id, league.name);
      const rivasMatches = matches.filter(m => m.isRivas);
      if (rivasMatches.length > 0) {
        console.log(`Found ${rivasMatches.length} Rivas matches in ${league.name} (ID: ${league.id})`);
        allRivasMatches.push(...rivasMatches);
      }
    } catch (e) {
      console.error(`Error for league ${league.id}:`, e);
    }
  }

  console.log(`\nTOTAL Rivas matches found across all leagues: ${allRivasMatches.length}`);
  
  // Sort all matches by date / time
  allRivasMatches.forEach(m => {
    console.log(`[${m.competitionName}] ${m.date} ${m.time} - ${m.localTeam} vs ${m.visitorTeam}`);
  });
}

run().catch(console.error);
