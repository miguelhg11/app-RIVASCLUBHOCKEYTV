import fs from "fs";
import * as cheerio from "cheerio";

const html = fs.readFileSync("scratch/rfep_league_3150_decoded.html", "utf-8");
const $ = cheerio.load(html);

// Print first 500 characters of text content
console.log("Text content sample:");
console.log($.text().slice(0, 1000).replace(/\s+/g, " "));

// Print any table or div classes
const classes = new Set<string>();
$("*").each((_, el) => {
  const cls = $(el).attr("class");
  if (cls) {
    cls.split(/\s+/).forEach(c => classes.add(c));
  }
});
console.log("Found classes:", Array.from(classes).slice(0, 50));
