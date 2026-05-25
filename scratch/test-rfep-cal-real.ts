import fs from "fs";

async function test(method: "GET" | "POST", url: string, body?: any) {
  console.log(`\nTesting ${method} ${url}...`);
  try {
    const options: any = {
      method,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.hockeypatines.fep.es/",
        "Origin": "https://www.hockeypatines.fep.es"
      }
    };
    if (body) {
      options.headers["Content-Type"] = "application/x-www-form-urlencoded";
      options.body = new URLSearchParams(body);
    }
    
    const res = await fetch(url, options);
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response length:", text.length);
    if (text.length > 0) {
      fs.writeFileSync("scratch/rfep_cal_real_response.html", text);
      console.log("Saved scratch/rfep_cal_real_response.html");
      console.log("Sample:", text.slice(0, 500));
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

async function main() {
  const url = "https://www.server2.sidgad.es/rfep/rfep_cal_idc_3150_1.php";
  
  await test("GET", url);
  await test("POST", url, {
    idc: "3150",
    tipo_stats: "",
    lang: "es"
  });
}

main().catch(console.error);
