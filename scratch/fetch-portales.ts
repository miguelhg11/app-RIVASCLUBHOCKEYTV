import fs from "fs";

async function main() {
  const url = "https://www.server2.sidgad.es/portales.js?v=12345";
  console.log("Fetching " + url);
  const res = await fetch(url);
  const js = await res.text();
  fs.writeFileSync("scratch/portales.js", js);
  console.log("Saved scratch/portales.js");
}

main().catch(console.error);
