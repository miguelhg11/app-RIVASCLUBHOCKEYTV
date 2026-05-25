import { getRivasOfficialMatches } from "../src/lib/federations/unified/get-rivas-official-matches";

async function run() {
  console.log("Calling getRivasOfficialMatches...");
  const matches = await getRivasOfficialMatches("test@example.com", false);
  console.log(`Unified aggregator returned ${matches.length} matches.`);
  matches.forEach(m => {
     console.log(`[${m.source.toUpperCase()}] [${m.categoryLabel}] ${m.date} ${m.time} - ${m.localTeam} vs ${m.visitorTeam} (Key: ${m.rivasTeamKey})`);
  });
}

run().catch(console.error);
