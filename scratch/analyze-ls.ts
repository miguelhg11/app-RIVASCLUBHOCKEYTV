import fs from "fs";
import * as cheerio from "cheerio";

const html = fs.readFileSync("scratch/rfep_ls.html", "utf-8");
const $ = cheerio.load(html);

// Log page title
console.log("Title:", $("title").text());

// Log some div classes or structure
const bodyText = $("body").text().trim();
console.log("Body text sample:", bodyText.slice(0, 1000));

// Find all elements with href
const hrefs: string[] = [];
$("a").each((_, el) => {
  const href = $(el).attr("href");
  if (href) hrefs.push(href);
});

console.log("Total links:", hrefs.length);
console.log("Sample links:", hrefs.slice(0, 30));
