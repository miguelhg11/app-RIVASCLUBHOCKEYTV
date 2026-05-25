import fs from "fs";
import * as cheerio from "cheerio";

const html = fs.readFileSync("scratch/rfep_league_3150_decoded.html", "utf-8");
const $ = cheerio.load(html);

console.log("Found", $("script").length, "script tags inside decoded HTML.");
$("script").each((i, el) => {
  const src = $(el).attr("src");
  if (src) {
    console.log(`Script ${i}: src=${src}`);
  } else {
    const text = $(el).text().trim();
    if (text.length > 0) {
      console.log(`Script ${i}: content (first 300 chars):`);
      console.log(text.slice(0, 300));
      console.log("------------------------");
    }
  }
});
