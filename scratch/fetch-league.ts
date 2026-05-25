import fs from "fs";
import path from "path";

async function main() {
  const url = "https://www.hockeypatines.fep.es/league/3150";
  console.log("Fetching " + url);
  const res = await fetch(url);
  const html = await res.text();
  fs.writeFileSync("scratch/rfep_league_3150.html", html);
  console.log("Saved scratch/rfep_league_3150.html");
}

main().catch(console.error);
