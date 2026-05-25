import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";

const RFEP_BASE = "https://www.server2.sidgad.es/rfep";

async function discoverLeagues() {
  console.log("Fetching RFEP leagues from rfep_ls_1.php...");
  
  const res = await fetch(`${RFEP_BASE}/rfep_ls_1.php`);
  if (!res.ok) {
    throw new Error(`Failed to fetch leagues: ${res.statusText}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const leagues = [];
  $("ul.nav li.dropdown ul.dropdown-menu li a").each((i, el) => {
    const $el = $(el);
    const href = $el.attr("href");
    const name = $el.text().trim();
    if (href && href.includes("rfep_ls_1.php?idc=")) {
      const match = href.match(/idc=(\d+)/);
      if (match) {
        leagues.push({ id: parseInt(match[1]), name });
      }
    }
  });

  console.log(`Found ${leagues.length} leagues.`);
  
  const results = [];

  for (const league of leagues) {
    console.log(`Checking league ${league.id}: ${league.name}`);
    try {
      const calRes = await fetch(`${RFEP_BASE}/rfep_cal_idc_${league.id}_1.php`);
      if (!calRes.ok) continue;

      const calHtml = await calRes.text();
      const $cal = cheerio.load(calHtml);
      
      let hasRivas = false;
      const teams = new Set();

      $cal("tr.team_class td.nombre_junto_logo").each((_, td) => {
        const teamName = $cal(td).text().trim().toUpperCase();
        teams.add(teamName);
        if (teamName.includes("RIVAS") && !teamName.includes("UP RIVAS") && !teamName.includes("VELOCIDAD RIVAS")) {
          hasRivas = true;
        }
      });

      if (hasRivas) {
        results.push({ league, teams: Array.from(teams) });
      }
    } catch (err) {
      console.error(`Error checking league ${league.id}:`, err);
    }
    // Small delay
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`Found ${results.length} leagues with Rivas teams.`);

  // Write report
  const reportPath = path.join(process.cwd(), "docs", "rfep-discovery-report.md");
  let report = `# RFEP Discovery Report\n\n`;
  report += `Date: ${new Date().toISOString()}\n\n`;
  
  for (const r of results) {
    report += `## League ${r.league.id}: ${r.league.name}\n`;
    report += `- Found Rivas teams.\n`;
    report += `- Total teams: ${r.teams.length}\n`;
    report += `- Teams list:\n`;
    for (const t of r.teams) {
      if (t.includes("RIVAS")) {
        report += `  - **${t}**\n`;
      } else {
        report += `  - ${t}\n`;
      }
    }
    report += `\n`;
  }

  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, report, "utf-8");
  console.log(`Report written to ${reportPath}`);
}

discoverLeagues().catch(console.error);
