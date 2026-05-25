import fs from "fs";
import path from "path";

function getPngDimensions(filePath: string) {
  const buf = fs.readFileSync(filePath);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

const p = path.join(process.cwd(), "scratch", "docx_temp", "word", "media", "image1.png");
if (fs.existsSync(p)) {
  const dims = getPngDimensions(p);
  console.log(`image1.png: ${dims.width}x${dims.height} (Aspect Ratio: ${(dims.width / dims.height).toFixed(3)})`);
} else {
  console.log(`image1.png not found`);
}
