import { FmpMatch } from "./types";

export function formatFmpDateTimeForDisplay(match: Partial<FmpMatch>): string {
  try {
    if (!match.scheduledDate) return "Fecha inválida";
    const [year, month, day] = match.scheduledDate.split("-");
    const dateStr = `${parseInt(day, 10)}/${parseInt(month, 10)}/${year}`;
    const timeStr = match.scheduledTime ? `${match.scheduledTime}:00` : "Hora por confirmar";
    return `${dateStr}, ${timeStr}`;
  } catch (error) {
    return "Fecha/Hora inválida";
  }
}

export function formatFmpMatchTitle(match: Partial<FmpMatch>): string {
  const local = match.local || "Equipo por confirmar";
  const visitante = match.visitante || "Equipo por confirmar";
  return `${local} vs ${visitante}`;
}

export function formatFmpVenue(match: Partial<FmpMatch>): string {
  return match.pista || "Ubicación por confirmar";
}
