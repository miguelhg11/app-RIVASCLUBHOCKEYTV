import fs from "fs";

async function main() {
  const url = "https://www.server2.sidgad.es/rfep/cal_idc_3150_1.php";
  console.log(`Fetching ${url}`);
  
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://www.hockeypatines.fep.es/",
      "Origin": "https://www.hockeypatines.fep.es"
    }
  });

  console.log(`Status: ${res.status}`);
  const text = await res.text();
  console.log(`Response length: ${text.length}`);
  fs.writeFileSync("scratch/rfep_cal_3150_direct.html", text);
  console.log("Saved scratch/rfep_cal_3150_direct.html");
  
  // Find Rivas
  const cheerio = await import("cheerio");
  const $ = cheerio.load(text);
  const mentions = [];
  $("*").each((_, el) => {
    const txt = $(el).text().trim();
    if (txt.toUpperCase().includes("RIVAS")) {
      mentions.push($(el).text().slice(0, 100));
    }
  });
  console.log("Rivas occurrences in calendar:", mentions.length);
  console.log("Samples:", mentions.slice(0, 10));
}

main().catch(console.error);
