import fs from "fs";
import * as cheerio from "cheerio";

const html = fs.readFileSync("scratch/rfep_cal_real_response.html", "utf-8");
const $ = cheerio.load(html);

console.log("Response H1 or Title (if any):", $("title").text(), $("h1").text());

// Find mentions of RIVAS
const rivasRows = [];
$("*").each((_, el) => {
  const text = $(el).text().trim();
  if (text.toUpperCase().includes("RIVAS")) {
    // Let's see if this element is a row or cell
    if (el.name === "tr" || $(el).hasClass("fila_stats_player") || $(el).hasClass("fila_game")) {
      rivasRows.push({
        tag: el.name,
        class: $(el).attr("class"),
        text: text.replace(/\s+/g, " ").slice(0, 150)
      });
    }
  }
});

console.log(`\nFound ${rivasRows.length} elements mentioning RIVAS:`);
console.log(rivasRows.slice(0, 10));

// Let's print some general structure of table rows
console.log("\nSample rows of class 'fila_stats_player' or similar:");
let count = 0;
$("tr").each((_, el) => {
  const cls = $(el).attr("class") || "";
  const text = $(el).text().replace(/\s+/g, " ").trim();
  if (text.length > 0 && count < 10) {
    console.log(`Row: class="${cls}", text="${text.slice(0, 150)}"`);
    count++;
  }
});
