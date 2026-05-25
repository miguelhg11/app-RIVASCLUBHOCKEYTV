import { createHash } from "node:crypto";

export function createFmpSourceMatchId(match: {
  modalidad: string;
  competicion: string;
  fecha: string;
  hora: string | null;
  local: string;
  visitante: string;
  pista: string | null;
}): string {
  const base = [
    "fmp",
    match.modalidad,
    match.competicion,
    match.fecha,
    match.hora ?? "",
    match.local,
    match.visitante,
    match.pista ?? "",
  ].join("|");

  return createHash("sha256").update(base).digest("hex");
}
