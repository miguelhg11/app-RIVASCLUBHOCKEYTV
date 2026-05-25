import fs from "fs";
import * as cheerio from "cheerio";

const html = fs.readFileSync("scratch/rfep_cal_real_response.html", "utf-8");
const $ = cheerio.load(html);

const matches = [];

$("tr.team_class").each((_, el) => {
  const row = $(el);
  
  // Date
  // Find td matching date pattern DD/MM/YYYY
  let dateText = "";
  row.find("td").each((_, cell) => {
    const text = $(cell).text().trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
      dateText = text;
    }
  });
  
  // Time
  let timeText = "";
  row.find("td").each((_, cell) => {
    const text = $(cell).text().trim();
    if (/^\d{2}:\d{2}$/.test(text)) {
      timeText = text;
    }
  });
  
  // Teams
  // Find all .nombre_junto_logo elements inside the row
  const teamElements = row.find(".nombre_junto_logo");
  const local = teamElements.eq(0).text().trim();
  const visitor = teamElements.eq(1).text().trim();
  
  // If teamElements are not found, let's see how we can extract it
  // Wait, let's log if teamElements are missing
  if (!local || !visitor) {
    console.log("Missing teams for row:", row.text().trim());
  }
  
  // Result / Score
  const scoreCell = row.find("td.web_link_td").first();
  const score = scoreCell.text().trim() || null;
  
  // Jornada / Round
  // It's inside td.jor_in_games or we can find previous JORNADA header
  const jorCell = row.find(".jor_in_games");
  const round = jorCell.text().trim() || null;

  // Match ID
  // It's in the game_report search icon attribute idp
  const reportIcon = row.find(".game_report");
  const matchId = reportIcon.attr("idp") || null;
  
  matches.push({
    dateText,
    timeText,
    local,
    visitor,
    score,
    round,
    matchId
  });
});

console.log("Total parsed matches:", matches.length);
console.log("First 5 matches:", matches.slice(0, 5));
console.log("Last 5 matches:", matches.slice(-5));

// Find matches involving Rivas
const rivasMatches = matches.filter(m => m.local.toUpperCase().includes("RIVAS") || m.visitor.toUpperCase().includes("RIVAS"));
console.log("\nTotal Rivas matches:", rivasMatches.length);
console.log("Rivas matches sample:", rivasMatches.slice(0, 5));
