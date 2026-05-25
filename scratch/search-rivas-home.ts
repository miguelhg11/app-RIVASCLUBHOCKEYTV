import fs from "fs";

const html = fs.readFileSync("scratch/rfep_home.html", "utf-8");
const search = "RIVAS";
const regex = new RegExp(search, "i");

const lines = html.split("\n");
let count = 0;
lines.forEach((line, i) => {
  if (regex.test(line)) {
    count++;
    console.log(`Line ${i + 1}: ${line.trim().slice(0, 150)}`);
  }
});

console.log(`Total occurrences of '${search}' on homepage: ${count}`);
