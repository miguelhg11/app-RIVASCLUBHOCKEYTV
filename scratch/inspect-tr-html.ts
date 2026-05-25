import fs from "fs";
import * as cheerio from "cheerio";

const html = fs.readFileSync("scratch/rfep_cal_real_response.html", "utf-8");
const $ = cheerio.load(html);

const tr = $("tr.team_class").filter((_, el) => {
  return $(el).text().toUpperCase().includes("RIVAS");
}).first();

console.log("HTML of matching row:");
console.log($.html(tr));
