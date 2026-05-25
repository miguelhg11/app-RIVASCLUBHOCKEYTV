async function testTemp(temp: number) {
  const url = `https://www.server2.sidgad.es/rfep/rfep_cal_2_${temp}.php`;
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
      })
    });
    if (res.status !== 404) {
      console.log(`Temp ${temp}: POST status ${res.status}, length: ${(await res.text()).length}`);
    }
  } catch (err) {}
}

async function main() {
  console.log("Testing temps 1 to 45...");
  for (let i = 1; i <= 45; i++) {
    await testTemp(i);
  }
}

main().catch(console.error);
