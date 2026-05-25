import fs from "fs";

async function testUrl(url: string) {
  console.log(`Testing ${url}...`);
  try {
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
    if (res.ok) {
      const text = await res.text();
      console.log(`Length: ${text.length}`);
      console.log(`Sample: ${text.slice(0, 300)}`);
      return text;
    }
  } catch (err) {
    console.error(`Error for ${url}:`, err);
  }
  return null;
}

async function main() {
  const urls = [
    "https://www.server2.sidgad.es/rfep/rfep_cal_2_39.php",
    "https://www.server2.sidgad.es//rfep/rfep_cal_2_39.php",
    "https://sidgad.cloud/rfep/rfep_cal_2_39.php",
    "https://sidgad.cloud/rfep/rfep_cal_2_21.php", // testing different temp
    "https://www.server2.sidgad.es/rfep/rfep_cal_2_21.php"
  ];
  
  for (const url of urls) {
    const res = await testUrl(url);
    if (res) {
      fs.writeFileSync("scratch/working_rfep_cal.html", res);
      console.log("SUCCESS! Saved working response to scratch/working_rfep_cal.html");
      break;
    }
  }
}

main().catch(console.error);
