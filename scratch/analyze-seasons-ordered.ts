import fs from "fs";
import * as cheerio from "cheerio";

const html = fs.readFileSync("scratch/rfep_ls.html", "utf-8");
const $ = cheerio.load(html);

const leagues: any[] = [];
$(".idc_master").each((_, el) => {
  const $el = $(el);
  const classes = $el.attr("class") || "";
  const tempClass = classes.split(" ").find(c => c.startsWith("temp_")) || "";
  const id = $el.attr("id");
  const name = $el.attr("name") || $el.text().trim();
  leagues.push({ id, name, tempClass });
});

// Group by tempClass
const groups: { [key: string]: any[] } = {};
leagues.forEach(l => {
  if (!groups[l.tempClass]) groups[l.tempClass] = [];
  groups[l.tempClass].push(l);
});

// Let's print the seasons in order they appear in the HTML
const uniqueTemps: string[] = [];
$(".idc_master").each((_, el) => {
  const classes = $(el).attr("class") || "";
  const temp = classes.split(" ").find(c => c.startsWith("temp_")) || "";
  if (temp && !uniqueTemps.includes(temp)) {
    uniqueTemps.push(temp);
  }
});

console.log("First 3 seasons:");
uniqueTemps.slice(0, 3).forEach(temp => {
  console.log(`\nSeason Temp Class: ${temp} (${groups[temp]?.length || 0} competitions)`);
  groups[temp]?.forEach(l => {
    console.log(`  ID: ${l.id} -> ${l.name}`);
  });
});
