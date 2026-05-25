import fs from "fs";

const html1 = fs.readFileSync("scratch/rfep_league_3150.html", "utf-8");
const html2 = fs.readFileSync("scratch/rfep_league_3150_decoded.html", "utf-8");

function search(html: string, name: string) {
  const lines = html.split("\n");
  lines.forEach((line, i) => {
    if (line.includes("games_btn") || line.includes("cal_")) {
      console.log(`${name} - Line ${i + 1}: ${line.trim().slice(0, 150)}`);
    }
  });
}

search(html1, "outer");
search(html2, "decoded");
