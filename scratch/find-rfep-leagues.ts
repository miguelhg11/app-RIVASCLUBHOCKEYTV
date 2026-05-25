import fs from "fs";
import * as cheerio from "cheerio";

const html = fs.readFileSync("scratch/rfep_ls.html", "utf-8");
const $ = cheerio.load(html);

// Let's find all links or options or select dropdowns that contain league IDs
const leagues: { id: number; name: string }[] = [];

// Sidgad league list usually has links with rfep_cal_idc_XXX_1.php or similar,
// or a select element. Let's see what links exist.
$("a").each((_, el) => {
  const href = $(el).attr("href") || "";
  const text = $(el).text().trim();
  const match = href.match(/rfep_cal_idc_(\d+)_1\.php/);
  if (match) {
    leagues.push({ id: parseInt(match[1]), name: text });
  }
});

// Also search in select option elements if any
$("option").each((_, el) => {
  const val = $(el).attr("value") || "";
  const text = $(el).text().trim();
  // Sometimes it's just the ID
  if (/^\d+$/.test(val)) {
    leagues.push({ id: parseInt(val), name: text });
  }
});

console.log(`Total leagues found by parsing links/options: ${leagues.length}`);

// Let's filter leagues with interesting keywords
const keywords = ["BRONCE", "ESPAÑA", "JUNIOR", "JUVENIL", "INFANTIL", "ALEVIN", "FEMENINO", "OK", "PLATA", "AUTONOMICO", "SECTOR"];
const matches = leagues.filter(l => keywords.some(k => l.name.toUpperCase().includes(k)));

console.log("\nMatching Leagues:");
matches.forEach(m => {
  console.log(`League ID: ${m.id} -> ${m.name}`);
});

// Write all parsed leagues to a text file for manual review
fs.writeFileSync("scratch/parsed_rfep_leagues.json", JSON.stringify(leagues, null, 2));
