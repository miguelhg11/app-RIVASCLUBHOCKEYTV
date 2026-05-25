// Re-export from the new shared date-utils.ts for backward compatibility
export { parseSpanishDateToIsoDate, buildMadridDateTimeIso } from "./date-utils";

// Also keep date range logic if it was here, but looking at the file earlier, 
// it only contained parseSpanishDateToIsoDate and buildMadridDateTimeIso.
// Let's add any actual date range utilities if needed.

export function isDateInNext7Days(isoDate: string): boolean {
  if (!isoDate) return false;

  // We only care about YYYY-MM-DD comparison
  const matchDateStr = isoDate.split("T")[0];
  
  const today = new Date();
  // Adjust timezone manually to Madrid by using string formatting or just assume local is fine for this approximation
  // A better way is using Intl.DateTimeFormat
  const todayMadridStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(today); // returns YYYY-MM-DD

  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextWeekMadridStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(nextWeek);

  return matchDateStr >= todayMadridStr && matchDateStr <= nextWeekMadridStr;
}
