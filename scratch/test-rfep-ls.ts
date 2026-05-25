import fs from "fs/promises";

async function run() {
  const url = "https://www.server2.sidgad.es/rfep/rfep_ls_1.php";
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
      "Referer": "https://www.hockeypatines.fep.es/",
      "Origin": "https://www.hockeypatines.fep.es"
    }
  });
  const text = await response.text();
  console.log("Status:", response.status);
  console.log("Length:", text.length);
  await fs.writeFile("scratch/rfep_ls.html", text, "utf-8");
}

run().catch(console.error);
