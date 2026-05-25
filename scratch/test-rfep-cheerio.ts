import fs from "fs";
import * as cheerio from "cheerio";

const html = fs.readFileSync("scratch/rfep_cal_real_response.html", "utf-8");
const $ = cheerio.load(html);

console.log(`Found ${$("tr.team_class").length} tr.team_class`);

let count = 0;
$("tr.team_class").each((_, row) => {
  const $row = $(row);
  const $teamCells = $row.find(".nombre_junto_logo");
  
  if ($teamCells.length === 0) {
    console.log("NO .nombre_junto_logo found in row. Row HTML:", $row.html());
  } else {
    if (count < 3) {
      console.log(`Row has ${$teamCells.length} team cells.`);
      $teamCells.each((i, el) => {
         console.log(`Team cell ${i} HTML:`, $(el).parent().html()?.trim());
         console.log(`Team cell ${i} TEXT:`, $(el).text().trim());
      });
      count++;
    }
  }
});
