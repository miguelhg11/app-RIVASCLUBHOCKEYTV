import fs from "fs";
import path from "path";

const files = fs.readdirSync("scratch");
for (const file of files) {
  if (file.endsWith(".html") || file.endsWith(".ts") || file.endsWith(".js")) {
    const content = fs.readFileSync(path.join("scratch", file), "utf-8");
    if (content.includes("cal_idc") || content.includes("cal_")) {
      console.log(`File scratch/${file} matches`);
    }
  }
}
