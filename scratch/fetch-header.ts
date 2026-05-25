async function main() {
  const url = "https://www.server2.sidgad.es/competicion_header_creator.php";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://www.hockeypatines.fep.es/",
      "Origin": "https://www.hockeypatines.fep.es"
    },
    body: new URLSearchParams({
      config_params: "ids_teams:3361,3358,3359,3350,3337,3336,3332,3363,3374,3387,3408,3411,3412,3373;ids_period_reg:1,2;tpo_reg:25;ids_period_ot:0;tpo_ot:0;bonus:0;empates:1;all_periods:1,10,2;periods_names:PERIODO 1,DESCANSO,PERIODO 2;ids_periods:1,2;model_acta:3;tipo_idc_contable:1;derechos1:220;derechos2:220;derechos_anot:80;horarios:0;",
      idm: "1",
      teams_array: "fcbarcelona.png,3358,BAR,BARÇA;calafell.png,3359,CAL,CALAFELL LA MENORQUINA;98_1.png,3361,CCH,CERDANYOLA CLUB D'HOQUEI;caldes.png,3337,CHC,CH CALDES RECAM LÀSER;78_2.png,3412,CPV,CP VOLTREGA MOVENTO STERN;44_3.png,3373,HCL,HOCKEY CLUB LICEO;460_4.png,3350,HCSJ,INNOAESTHETICS HC SANT JUST;69_1.png,3408,IHC,IGUALADA RIGAT HC;lleida.png,3411,LLE,PONS LLEIDA;71.png,3387,NOIA,CE NOIA FREIXENET;66_1.png,3363,PAS,AITEX PAS ALCOI;reusdep.png,3332,REUS,REUS DEPORTIU BRASILIA;109.png,3374,RIV,ADISS HOCKEY RIVAS;shum.png,3336,SHUM,SHUM FRIT RAVICH;",
      cliente: "rfep",
      temp: "39",
      idc: "3150",
      logo: "ok_liga.png",
      site_lang: "es"
    })
  });
  
  if (!res.ok) throw new Error(`Status: ${res.status}`);
  const html = await res.text();
  const cheerio = await import("cheerio");
  const $ = cheerio.load(html);
  
  $(".menu_competicion_btn").each((_, el) => {
    console.log(`Button attributes for id=${$(el).attr("id")}:`);
    console.log($(el).attr());
  });
}

main().catch(console.error);
