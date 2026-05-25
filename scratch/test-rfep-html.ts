import fs from "fs/promises";
import * as cheerio from "cheerio";

async function run() {
  const url = "https://www.server2.sidgad.es/rfep/rfep_cal_idc_3150_1.php";
  const response = await fetch(url);
  const html = await response.text();
  await fs.writeFile("scratch/rfep_3150.html", html, "utf-8");
  
  const $ = cheerio.load(html);
  const rows = $("tr.team_class").length;
  console.log(`Found ${rows} match rows.`);
}

run().catch(console.error);
