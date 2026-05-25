import { parseRfepCalendarHtml } from "../src/lib/federations/rfep/parser";
import fs from "fs";

const html = fs.readFileSync("scratch/rfep_cal_real_response.html", "utf-8");
const matches = parseRfepCalendarHtml(html, 3150, "OK Liga Masculina");
console.log(`Parsed ${matches.length} matches`);
console.log(matches.slice(0, 3));
