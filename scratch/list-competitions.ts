import * as cheerio from "cheerio";

async function main() {
  const url = "https://www.server2.sidgad.es/rfep/rfep_ls_1.php";
  console.log("Fetching " + url);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://www.hockeypatines.fep.es/",
      "Origin": "https://www.hockeypatines.fep.es"
    }
  });
  
  if (!res.ok) throw new Error(`Status: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const items = [];
  $(".listado_competiciones_fila").each((_, el) => {
    items.push({
      id: $(el).attr("id"),
      name: $(el).attr("name") || $(el).text().trim(),
      classes: $(el).attr("class")
    });
  });

  console.log("Total competitions found:", items.length);
  
  // Find Rivas
  const rivasComp = items.filter(item => item.name.toUpperCase().includes("RIVAS"));
  console.log("Competitions mentioning RIVAS in their name:", rivasComp);
  
  // Let's print first 30 competitions
  console.log("First 30 competitions:");
  console.log(items.slice(0, 30));
}

main().catch(console.error);
