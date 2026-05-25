import fs from "fs";

const html = fs.readFileSync("scratch/rfep_league_3150_decoded.html", "utf-8");
const lines = html.split("\n");

lines.forEach((line, index) => {
  if (line.includes("portal_") || line.includes("12ee975d") || line.includes("iframe")) {
    console.log(`Line ${index + 1}: ${line.trim().slice(0, 200)}`);
  }
});
