import fs from "fs";

const html = fs.readFileSync("scratch/rfep_league_3150.html", "utf-8");

// Search for the end of the script block that defines 'raw'
const startIdx = html.indexOf('const raw =');
if (startIdx !== -1) {
  const endScriptIdx = html.indexOf('</script>', startIdx);
  const scriptContent = html.slice(startIdx, endScriptIdx);
  console.log("=== SCRIPT CONTENT ===");
  console.log(scriptContent.slice(-1000)); // Print the last 1000 chars of the script block
} else {
  console.log("No const raw found.");
}
