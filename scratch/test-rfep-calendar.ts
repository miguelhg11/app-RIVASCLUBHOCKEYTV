import fs from "fs";

async function main() {
  const url = "https://www.server2.sidgad.es/rfep/rfep_cal_2_39.php";
  console.log(`POSTing to ${url} with idc=3150`);
  
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      idc: "3150",
      tipo_stats: "",
      lang: "es",
    }),
  });

  if (!res.ok) {
    throw new Error(`Status: ${res.status}`);
  }

  const html = await res.text();
  fs.writeFileSync("scratch/rfep_cal_3150.html", html);
  console.log("Saved response to scratch/rfep_cal_3150.html");
}

main().catch(console.error);
