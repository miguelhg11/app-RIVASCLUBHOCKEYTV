import fs from "fs";

const html = fs.readFileSync("scratch/rfep_league_3150_decoded.html", "utf-8");
const lines = html.split("\n");

lines.forEach((line, i) => {
  if (line.toUpperCase().includes("BARCELONA") || line.toUpperCase().includes("HOCKEY")) {
    console.log(`Line ${i + 1}: ${line.trim().slice(0, 150)}`);
  }
});
