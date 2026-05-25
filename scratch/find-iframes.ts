import fs from "fs";
import * as cheerio from "cheerio";

const html = fs.readFileSync("scratch/rfep_league_3150.html", "utf-8");
const $ = cheerio.load(html);

$("iframe").each((_, el) => {
  console.log(`Iframe src: ${$(el).attr("src")}, id: ${$(el).attr("id")}, class: ${$(el).attr("class")}`);
});
