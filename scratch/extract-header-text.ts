import fs from "fs";
import path from "path";

const xmlPath = path.join(__dirname, "docx_temp", "word", "header2.xml");
if (fs.existsSync(xmlPath)) {
  const xml = fs.readFileSync(xmlPath, "utf-8");
  const matches = xml.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
  if (matches) {
    console.log("=== HEADER2 TEXT ===");
    console.log(matches.map(tag => tag.replace(/<w:t[^>]*>|<\/w:t>/g, "")).join(" "));
  } else {
    console.log("No text in header2.xml");
  }
} else {
  console.log("header2.xml not found");
}
