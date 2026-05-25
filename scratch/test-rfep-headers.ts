import fs from "fs";

async function test(method: "GET" | "POST", url: string) {
  console.log(`\nTesting ${method} ${url}...`);
  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Accept": "*/*",
        "Accept-Language": "es-ES,es;q=0.9",
        "Connection": "keep-alive",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.hockeypatines.fep.es/",
        "Origin": "https://www.hockeypatines.fep.es"
      }
    });
    console.log(`Response Status: ${res.status}`);
    console.log(`Response Headers:`, Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    console.log(`Response Length: ${text.length}`);
    if (text.length > 0) {
      console.log(`Response Sample: ${text.slice(0, 300)}`);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

async function main() {
  await test("GET", "https://www.server2.sidgad.es/rfep/rfep_ls_1.php");
  await test("POST", "https://www.server2.sidgad.es/rfep/rfep_ls_1.php");
  await test("GET", "https://www.server2.sidgad.es/rfep/rfep_cal_2_21.php");
  await test("POST", "https://www.server2.sidgad.es/rfep/rfep_cal_2_21.php");
}

main().catch(console.error);
