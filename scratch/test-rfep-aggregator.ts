import { fetchRfepMatches } from "../src/lib/federations/rfep/adapter";

async function run() {
  console.log("Fetching RFEP matches...");
  const matches = await fetchRfepMatches();
  console.log(`Found ${matches.length} matches.`);
  matches.forEach(m => console.log(`${m.localTeam} vs ${m.visitorTeam}`));
  const rivasMatches = matches.filter(m => m.isRivas);
  console.log(`Found ${rivasMatches.length} Rivas matches:`);
  rivasMatches.forEach(m => console.log(`${m.date} ${m.time} - ${m.localTeam} vs ${m.visitorTeam}`));
}

run().catch(console.error);
