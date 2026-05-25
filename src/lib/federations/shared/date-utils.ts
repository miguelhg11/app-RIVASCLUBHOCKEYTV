export function parseSpanishDateToIsoDate(value: string): string {
  const parts = value.trim().split("/");
  if (parts.length !== 3) {
    throw new Error(`Invalid Spanish date format: ${value}`);
  }
  const day = parts[0].padStart(2, "0");
  const month = parts[1].padStart(2, "0");
  const year = parts[2];
  return `${year}-${month}-${day}`;
}

export function buildMadridDateTimeIso(fecha: string, hora: string | null): string | null {
  if (!hora || !hora.trim()) return null;

  try {
    const isoDate = parseSpanishDateToIsoDate(fecha);
    const timeClean = hora.trim();

    // Madrid timezone is either +01:00 or +02:00.
    // We try both and verify which one corresponds to the actual Europe/Madrid offset for that date.
    const offsetsToTry = ["+02:00", "+01:00"];
    for (const offset of offsetsToTry) {
      const candidateString = `${isoDate}T${timeClean}:00${offset}`;
      const date = new Date(candidateString);
      if (Number.isNaN(date.getTime())) continue;

      const formattedParts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Madrid",
        timeZoneName: "longOffset",
      }).formatToParts(date);

      const tzPart = formattedParts.find((p) => p.type === "timeZoneName");
      if (tzPart) {
        const val = tzPart.value; // e.g. "GMT+02:00" or "GMT+01:00"
        const match = val.match(/GMT([+-]\d{2}):?(\d{2})?/);
        if (match) {
          const sign = match[1];
          const hours = match[2] || "00";
          const madridOffset = `${sign}:${hours}`;
          if (madridOffset === offset) {
            return candidateString;
          }
        }
      }
    }

    // Default fallback if logic above fails to match
    return `${isoDate}T${timeClean}:00+02:00`;
  } catch {
    return null;
  }
}
