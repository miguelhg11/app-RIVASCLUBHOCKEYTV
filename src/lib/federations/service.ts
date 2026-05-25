import "server-only";

import { randomUUID } from "node:crypto";
import { load } from "cheerio";
import { getFederationSourcesConfig } from "@/src/lib/federations/settings";
import type { FederationMatch } from "@/src/lib/federations/types";
import { fetchFmpRivasNext7DaysMatches } from "@/src/lib/federations/fmp/adapter";
import { fetchRivasRfepMatchesNext7Days } from "@/src/lib/federations/rfep/adapter";
import { getCategorySortOrder } from "@/src/lib/federations/shared/match-sorting";

function toIsoLocalDayOffset(offsetDays: number, hour: number, minute: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export async function getUpcomingFederationMatches(days = 7): Promise<FederationMatch[]> {
  const out: FederationMatch[] = [];

  // Always fetch FMP matches (Federación Madrileña de Patinaje)
  try {
    const fmpMatches = await fetchFmpRivasNext7DaysMatches();
    const mapped = fmpMatches.map((m) => ({
      id: m.sourceMatchId,
      source: "fmp" as const,
      competitionName: m.competicion,
      scheduledStart: m.scheduledStartIso || new Date(m.scheduledDate).toISOString(),
      venue: m.pista || "Por confirmar",
      homeTeamName: m.local || "Por confirmar",
      awayTeamName: m.visitante || "Por confirmar",
      confidence: 0.9,
      rawUrl: m.sourceUrl,
      modalidad: m.modalidad,
      competicion: m.competicion,
      categoriaKey: m.categoriaKey,
      categoriaLabel: m.categoriaLabel,
      categoriaSortOrder: m.categoriaSortOrder,
      fecha: m.fecha,
      hora: m.hora,
      resultado: m.resultado,
      pista: m.pista,
      scheduledDate: m.scheduledDate,
      scheduledTime: m.scheduledTime,
      scheduledStartIso: m.scheduledStartIso,
      isRivasLocal: m.isRivasLocal,
      isRivasVisitante: m.isRivasVisitante,
      rival: m.rival,
      display: m.display,
      sourceMatchId: m.sourceMatchId,
      raw: m.raw,
    }));
    out.push(...mapped);
  } catch (err) {
    console.error("Error fetching FMP matches in service:", err);
  }

  // Always fetch RFEP matches (Real Federación Española de Patinaje)
  try {
    const rfepMatches = await fetchRivasRfepMatchesNext7Days();
    const mapped = rfepMatches.map((m) => ({
      id: m.id,
      source: "rfep" as const,
      competitionName: m.competitionName,
      scheduledStart: m.datetimeIso || new Date(m.date.split("/").reverse().join("-")).toISOString(),
      venue: m.location || "Por confirmar",
      homeTeamName: m.localTeam || "Por confirmar",
      awayTeamName: m.visitorTeam || "Por confirmar",
      confidence: 0.9,
      rawUrl: m.rawUrl || null,
      categoriaKey: m.categoryKey,
      categoriaLabel: m.categoryLabel,
      categoriaSortOrder: getCategorySortOrder(m.categoryKey),
      fecha: m.date,
      hora: m.time,
      resultado: m.score,
      pista: m.location,
      isRivasLocal: m.isRivasLocal,
      isRivasVisitante: m.isRivasVisitor,
      rival: m.rival,
      sourceMatchId: m.id,
      raw: m.raw,
    }));
    out.push(...mapped);
  } catch (err) {
    console.error("Error fetching RFEP matches in service:", err);
  }

  if (out.length > 0) {
    return out
      .filter((item) => {
        const when = new Date(item.scheduledStart).getTime();
        if (Number.isNaN(when)) return false;
        const now = Date.now();
        const max = now + days * 24 * 60 * 60 * 1000;
        const min = now - 12 * 60 * 60 * 1000;
        return when >= min && when <= max;
      })
      .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));
  }

  return [];
}

async function fetchRemoteFederationFeed(): Promise<FederationMatch[]> {
  const sources = await getFederationSourcesConfig();
  const out: FederationMatch[] = [];

  for (const source of sources.filter((item) => item.active && item.url)) {
    try {
      const response = await fetch(source.url, { cache: "no-store" });
      if (!response.ok) continue;

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const json = (await response.json()) as unknown;
        if (Array.isArray(json)) {
          const normalized = json
            .map((item) => normalizeRemoteItem(item))
            .filter((item): item is FederationMatch => item !== null);
          out.push(
            ...normalized.filter((item) => item.source === source.source),
          );
        }
        continue;
      }

      const html = await response.text();
       out.push(...parseHtmlMatches(source.source, html, source.clubPrimaryToken || "RIVAS"));
    } catch {
      continue;
    }
  }

  return dedupeByIdentity(out);
}

function normalizeRemoteItem(item: unknown): FederationMatch | null {
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;

  const source = row.source;
  const competitionName = row.competitionName;
  const scheduledStart = row.scheduledStart;
  const venue = row.venue;
  const homeTeamName = row.homeTeamName;
  const awayTeamName = row.awayTeamName;

  if ((source !== "fmp" && source !== "rfep") || typeof competitionName !== "string" || typeof scheduledStart !== "string") {
    return null;
  }
  if (typeof venue !== "string" || typeof homeTeamName !== "string" || typeof awayTeamName !== "string") {
    return null;
  }

  return {
    id: typeof row.id === "string" ? row.id : randomUUID(),
    source,
    competitionName,
    scheduledStart,
    venue,
    homeTeamName,
    awayTeamName,
    confidence: typeof row.confidence === "number" ? row.confidence : 0.8,
    rawUrl: typeof row.rawUrl === "string" ? row.rawUrl : null,
  };
}

function parseHtmlMatches(source: "fmp" | "rfep", html: string, clubFilter: string): FederationMatch[] {
  const $ = load(html);
  const rows = $("tr, article, .match, .partido, .event, .fixture");
  const out: FederationMatch[] = [];

  rows.each((_, row) => {
    const text = $(row).text().replace(/\s+/g, " ").trim();
    if (!text) return;
    if (clubFilter && !text.toLowerCase().includes(clubFilter.toLowerCase())) return;

    const dateMatch = text.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}).*?(\d{1,2}:\d{2})?/);
    const teams = text.match(/([A-Za-zÁÉÍÓÚÜÑ0-9 .'-]{3,})\s+(?:vs|v|-)\s+([A-Za-zÁÉÍÓÚÜÑ0-9 .'-]{3,})/i);
    if (!dateMatch || !teams) return;

    const scheduledStart = toIsoFromLooseDate(dateMatch[1], dateMatch[2] ?? "12:00");
    const link = $(row).find("a").first().attr("href") ?? null;

    out.push({
      id: randomUUID(),
      source,
      competitionName: extractCompetition(text),
      scheduledStart,
      venue: extractVenue(text),
      homeTeamName: teams[1].trim(),
      awayTeamName: teams[2].trim(),
      confidence: 0.65,
      rawUrl: link,
    });
  });

  return out;
}

function toIsoFromLooseDate(datePart: string, timePart: string) {
  const normalizedDate = datePart.replace(/-/g, "/");
  const [dRaw, mRaw, yRaw] = normalizedDate.split("/");
  const day = Number(dRaw);
  const month = Number(mRaw) - 1;
  const year = yRaw.length === 2 ? 2000 + Number(yRaw) : Number(yRaw);
  const [hour, minute] = timePart.split(":").map((x) => Number(x));
  const date = new Date(year, month, day, hour, minute, 0, 0);
  return date.toISOString();
}

function extractCompetition(text: string) {
  const match = text.match(/(liga|copa|jornada|ok liga|categoria)\s*[:\-]?\s*([^|,]+)/i);
  if (!match) return "Competicion";
  return `${match[1]} ${match[2]}`.trim();
}

function extractVenue(text: string) {
  const match = text.match(/(pabellon|polideportivo|pista|venue|lugar)\s*[:\-]?\s*([^|,]+)/i);
  if (!match) return "Por confirmar";
  return `${match[1]} ${match[2]}`.trim();
}

function dedupeByIdentity(items: FederationMatch[]) {
  const map = new Map<string, FederationMatch>();
  for (const item of items) {
    const key = `${item.source}|${item.scheduledStart}|${item.homeTeamName}|${item.awayTeamName}`;
    if (!map.has(key)) map.set(key, item);
  }
  return [...map.values()];
}

function buildFallbackMatches(days: number): FederationMatch[] {
  const templates = [
    {
      source: "fmp" as const,
      competitionName: "OK Liga Plata · Grupo Norte",
      venue: "Polideportivo Cerro del Telegrafo",
      homeTeamName: "Rivas Hockey",
      awayTeamName: "CP Alcobendas",
      hour: 18,
      minute: 0,
    },
    {
      source: "rfep" as const,
      competitionName: "Liga Nacional · Jornada",
      venue: "Pabellon Municipal Rivas",
      homeTeamName: "ADISS Hockey Rivas",
      awayTeamName: "CP Voltrega",
      hour: 12,
      minute: 30,
    },
  ];

  const out: FederationMatch[] = [];
  for (let day = 0; day < days; day += 1) {
    for (const template of templates) {
      out.push({
        id: randomUUID(),
        source: template.source,
        competitionName: template.competitionName,
        scheduledStart: toIsoLocalDayOffset(day + 1, template.hour, template.minute),
        venue: template.venue,
        homeTeamName: template.homeTeamName,
        awayTeamName: template.awayTeamName,
        confidence: 0.5,
        rawUrl: null,
      });
    }
  }
  return out.sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));
}
