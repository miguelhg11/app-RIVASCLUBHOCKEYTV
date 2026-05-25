import fs from "fs";

async function main() {
  const url = "https://www.server2.sidgad.es/rfep/rfep_ls_1.php";
  console.log("Fetching " + url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Status: ${res.status}`);
  const html = await res.text();
  fs.writeFileSync("scratch/rfep_ls_1.html", html);
  console.log("Saved scratch/rfep_ls_1.html");
}

main().catch(console.error);
