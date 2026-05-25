import fs from "fs";
import * as cheerio from "cheerio";

const html = fs.readFileSync("scratch/rfep_ls_1.html", "utf-8");
const $ = cheerio.load(html);

// Find element with id="3150"
const el = $("#3150");
if (el.length) {
  console.log("Found element with id 3150!");
  console.log("Outer HTML:", $.html(el).slice(0, 1000));
} else {
  console.log("No element with id 3150 found in list of competitions.");
}
