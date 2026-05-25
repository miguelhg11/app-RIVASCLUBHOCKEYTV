import fs from "fs";

const js = fs.readFileSync("scratch/portales.js", "utf-8");
const lines = js.split("\n");

lines.forEach((line, index) => {
  if (line.includes("_cal_2_") || line.includes("cal_2")) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
