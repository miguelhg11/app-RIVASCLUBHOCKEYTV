import fs from "fs";

const html = fs.readFileSync("scratch/rfep_league_3150.html", "utf-8");

// We want to find the script block containing: const raw = "..."
// Let's use a regex to capture it.
const match = html.match(/const raw\s*=\s*"([\s\S]+?)";/);
if (match) {
  // Decode the escaped string
  let rawStr = match[1];
  // Convert escaped unicode like \u00fa to actual characters
  rawStr = rawStr.replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => {
    return String.fromCharCode(parseInt(grp, 16));
  });
  // Unescape quotes and slashes
  rawStr = rawStr.replace(/\\"/g, '"').replace(/\\\//g, '/').replace(/\\n/g, '\n');
  
  fs.writeFileSync("scratch/rfep_league_3150_decoded.html", rawStr);
  console.log("Decoded and saved to scratch/rfep_league_3150_decoded.html");
} else {
  console.log("No raw HTML found in script.");
}
