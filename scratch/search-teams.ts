import fs from "fs";

const html1 = fs.readFileSync("scratch/rfep_league_3150.html", "utf-8");
const html2 = fs.readFileSync("scratch/rfep_league_3150_decoded.html", "utf-8");

const teams = ["REUS", "LICEO", "BARCELONA", "NOIA", "VOLTREGA", "CALAFELL", "ALCOI", "RIVAS", "HOCKEY"];

console.log("Searching in rfep_league_3150.html (outer):");
teams.forEach(team => {
  if (html1.toUpperCase().includes(team)) {
    console.log(`Found ${team}`);
  }
});

console.log("\nSearching in rfep_league_3150_decoded.html (inner):");
teams.forEach(team => {
  if (html2.toUpperCase().includes(team)) {
    console.log(`Found ${team}`);
  }
});
