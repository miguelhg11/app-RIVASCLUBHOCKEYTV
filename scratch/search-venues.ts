import fs from "fs";

const html = fs.readFileSync("scratch/rfep_cal_real_response.html", "utf-8");
const words = ["PISTA", "POLIDEPORTIVO", "PABELLON", "CERRO", "TELEGRAFO", "TELEGR.", "LAGUNAS", "PAVILLON", "MUNICIPAL"];

words.forEach(word => {
  if (html.toUpperCase().includes(word)) {
    console.log(`Found word ${word}`);
  }
});
