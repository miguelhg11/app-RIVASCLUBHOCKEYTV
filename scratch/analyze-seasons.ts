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
  leagues.push({ id, name, tempClass, classes });
});

console.log(`Found ${leagues.length} competitions in total.`);

// Group by tempClass
const groups: { [key: string]: any[] } = {};
leagues.forEach(l => {
  if (!groups[l.tempClass]) groups[l.tempClass] = [];
  groups[l.tempClass].push(l);
});

Object.keys(groups).forEach(temp => {
  console.log(`\nSeason Temp Class: ${temp} (${groups[temp].length} competitions)`);
  // print first 5
  groups[temp].slice(0, 10).forEach(l => {
    console.log(`  ID: ${l.id} -> ${l.name}`);
  });
});
