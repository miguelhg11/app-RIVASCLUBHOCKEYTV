import fs from "fs";
import * as cheerio from "cheerio";

const html = fs.readFileSync("scratch/rfep_league_3150_decoded.html", "utf-8");
const $ = cheerio.load(html);

console.log("Page title:", $("title").text());
console.log("H1 text:", $("h1").text().trim());

// Search for any mention of Rivas
const mentions = [];
$("*").each((_, el) => {
  const text = $(el).text().trim();
  if (text.toUpperCase().includes("RIVAS")) {
    mentions.push({
      tag: el.name,
      text: text.slice(0, 100),
      className: $(el).attr("class")
    });
  }
});

console.log(`Total mentions of 'Rivas' in tags:`, mentions.length);
console.log("Sample mentions:", mentions.slice(0, 10));
