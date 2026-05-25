import fs from "fs";
import * as cheerio from "cheerio";

const html = fs.readFileSync("scratch/rfep_league_3150_decoded.html", "utf-8");
const $ = cheerio.load(html);

const script4 = $("script").eq(4).text();
console.log("Script 4 full text:");
console.log(script4);
