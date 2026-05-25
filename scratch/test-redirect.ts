import fs from "fs";

async function main() {
  const url = "https://www.hockeypatines.fep.es/league/3150";
  const res = await fetch(url, {
    redirect: "manual"
  });
  console.log("Status:", res.status);
  console.log("Headers:", Object.fromEntries(res.headers.entries()));
}

main().catch(console.error);
