import fs from "fs";
import path from "path";

const xmlPath = path.join(__dirname, "docx_temp", "word", "document.xml");
if (!fs.existsSync(xmlPath)) {
  console.error("document.xml not found at", xmlPath);
  process.exit(1);
}

const xml = fs.readFileSync(xmlPath, "utf-8");

// Simple regex to extract text inside <w:t> tags
const matches = xml.match(/<w:t[^>]*>(.*?)<\/w:t>/g);

if (!matches) {
  console.log("No text nodes found.");
} else {
  console.log("=== EXTRACTED TEXT ===");
  const textList: string[] = [];
  matches.forEach((tag) => {
    const text = tag.replace(/<w:t[^>]*>|<\/w:t>/g, "");
    textList.push(text);
  });
  
  // Print paragraph-like segments by grouping runs or just printing lines
  // Let's print raw text join
  console.log(textList.join(" "));
  
  // Write to a txt file in scratch
  fs.writeFileSync(path.join(__dirname, "extracted_text.txt"), textList.join("\n"), "utf-8");
  console.log("\nSaved raw lines to scratch/extracted_text.txt");
}
