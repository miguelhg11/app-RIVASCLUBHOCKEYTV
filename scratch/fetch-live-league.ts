import * as cheerio from "cheerio";

async function main() {
  const url = "https://www.hockeypatines.fep.es/league/3150";
  console.log("Fetching live page " + url);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }
  });
  if (!res.ok) throw new Error(`Status: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  
  console.log("Live H1:", $("h1").text().trim().slice(0, 200));
  
  $("input").each((_, el) => {
    console.log(`Live Input: id=${$(el).attr("id")}, name=${$(el).attr("name")}, value=${$(el).attr("value")}`);
  });

  // Let's search for script tags containing portales or sidgad
  $("script").each((_, el) => {
    const src = $(el).attr("src");
    if (src) {
      console.log("Script src:", src);
    } else {
      const text = $(el).text();
      if (text.includes("portales") || text.includes("sidgad") || text.includes("cliente")) {
        console.log("Script with sidgad/portales/cliente:", text.slice(0, 300));
      }
    }
  });
}

main().catch(console.error);
