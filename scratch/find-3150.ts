import fs from "fs";

const html = fs.readFileSync("scratch/rfep_league_3150.html", "utf-8");
const lines = html.split("\n");

lines.forEach((line, i) => {
  if (line.includes("3150")) {
    console.log(`Line ${i + 1}: ${line.trim().slice(0, 150)}`);
  }
});
