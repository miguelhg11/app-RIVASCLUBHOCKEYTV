import * as cheerio from "cheerio";

async function main() {
  const url = "https://www.server2.sidgad.es/rfep/rfep_ls_1.php";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://www.hockeypatines.fep.es/",
      "Origin": "https://www.hockeypatines.fep.es"
    }
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const el = $("#3150");
  if (el.length > 0) {
    console.log("Attributes of 3150:");
    console.log(el.attr());
    console.log("Outer HTML:", $.html(el));
  } else {
    console.log("Competition 3150 not found in rfep_ls_1.php");
  }
}

main().catch(console.error);
