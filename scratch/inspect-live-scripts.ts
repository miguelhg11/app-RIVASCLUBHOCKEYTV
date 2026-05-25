import * as cheerio from "cheerio";

async function main() {
  const url = "https://www.hockeypatines.fep.es/league/3150";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  console.log("Found", $("script").length, "script tags.");
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
}

main().catch(console.error);
