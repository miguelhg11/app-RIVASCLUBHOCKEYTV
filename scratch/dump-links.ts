import fs from "fs";
import * as cheerio from "cheerio";

const html = fs.readFileSync("scratch/rfep_ls.html", "utf-8");
const $ = cheerio.load(html);

$("a").each((i, el) => {
  const $a = $(el);
  const text = $a.text().trim();
  if (text.length > 0 && i < 100) {
    console.log(`Text: "${text}" | Href: "${$a.attr("href")}" | Attributes:`, el.attribs);
  }
});
