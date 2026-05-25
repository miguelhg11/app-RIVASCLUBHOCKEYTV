import fs from "fs";

const js = fs.readFileSync("scratch/portales.js", "utf-8");
const lines = js.split("\n");

lines.forEach((line, i) => {
  if (line.includes("listado_competiciones_fila") || line.includes("competicion_selected")) {
    console.log(`Line ${i + 1}: ${line.trim().slice(0, 150)}`);
  }
});
