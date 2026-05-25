import fs from "fs";

async function main() {
  const url = "https://www.server2.sidgad.es/rfep/rfep_cal_2_21.php";
  console.log(`POSTing to ${url} with idc=3150`);
  
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://www.hockeypatines.fep.es/",
      "Origin": "https://www.hockeypatines.fep.es"
    },
    body: new URLSearchParams({
      idc: "3150",
      tipo_stats: "",
      lang: "es",
    }),
  });

  console.log(`Status: ${res.status}`);
  const text = await res.text();
  console.log(`Response length: ${text.length}`);
  fs.writeFileSync("scratch/rfep_cal_3150_post.html", text);
  console.log("Saved scratch/rfep_cal_3150_post.html");
}

main().catch(console.error);
