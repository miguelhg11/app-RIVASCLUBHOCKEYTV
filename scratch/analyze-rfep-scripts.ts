import fs from "fs";
import * as cheerio from "cheerio";

const html = fs.readFileSync("scratch/rfep_home.html", "utf-8");
const $ = cheerio.load(html);

// Find all script tags and log their contents
$("script").each((i, el) => {
  const src = $(el).attr("src");
  const text = $(el).text();
  
  if (src) {
    console.log(`Script src: ${src}`);
  }
  
  if (text.includes("iframe") || text.includes("portal") || text.includes("sidgad")) {
    console.log(`--- Script ${i} ---`);
    console.log(text.slice(0, 1000));
  }
});
