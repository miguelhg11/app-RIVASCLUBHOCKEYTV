import fs from "fs";
import * as cheerio from "cheerio";

const html = fs.readFileSync("scratch/rfep_league_3150.html", "utf-8");
const $ = cheerio.load(html);

$("input").each((_, el) => {
  console.log(`Input: id=${$(el).attr("id")}, name=${$(el).attr("name")}, value=${$(el).attr("value")}`);
});

$("div").each((_, el) => {
  const id = $(el).attr("id");
  if (id && (id.includes("competicion") || id.includes("portal") || id.includes("cal"))) {
    console.log(`Div: id=${id}, class=${$(el).attr("class")}`);
  }
});
