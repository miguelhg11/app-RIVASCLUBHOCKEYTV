import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

// Mock 'server-only' for Node.js test environment
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
try {
  const resolved = require.resolve("server-only");
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    exports: {},
    parent: null,
    loaded: true,
    children: [],
    paths: []
  } as any;
} catch {}

import { normalizeTeamName, isRivasTeam } from "../src/lib/federations/shared/team-name-normalizer";
import { parseSpanishDateToIsoDate, buildMadridDateTimeIso } from "../src/lib/federations/shared/date-range";
import { parseFmpTable } from "../src/lib/federations/fmp/parser";
import { createFmpSourceMatchId } from "../src/lib/federations/fmp/normalizer";
import { detectFmpCategory, groupFmpMatchesByCategory, compareFmpMatchesByDateTime } from "../src/lib/federations/fmp/category";
import { formatFmpDateTimeForDisplay, formatFmpMatchTitle, formatFmpVenue } from "../src/lib/federations/fmp/formatters";
import type { FmpMatch } from "../src/lib/federations/fmp/types";

describe("FMP Normalizers and Helpers", () => {
  it("should normalize Spanish dates to ISO", () => {
    assert.strictEqual(parseSpanishDateToIsoDate("24/05/2026"), "2026-05-24");
    assert.strictEqual(parseSpanishDateToIsoDate("01/12/2025"), "2025-12-01");
  });

  it("should build Europe/Madrid datetime ISO strings", () => {
    // 24/05/2026 is in daylight savings time (+02:00)
    assert.strictEqual(buildMadridDateTimeIso("24/05/2026", "09:30"), "2026-05-24T09:30:00+02:00");
    // 24/12/2026 is in standard time (+01:00)
    assert.strictEqual(buildMadridDateTimeIso("24/12/2026", "18:00"), "2026-12-24T18:00:00+01:00");
    // Empty time returns null
    assert.strictEqual(buildMadridDateTimeIso("24/05/2026", ""), null);
    assert.strictEqual(buildMadridDateTimeIso("24/05/2026", null), null);
  });

  it("should normalize team names accurately", () => {
    assert.strictEqual(normalizeTeamName("CP Rivas Las Lagunas A"), "CP RIVAS LAS LAGUNAS A");
    assert.strictEqual(normalizeTeamName("C.P. Rivas Las Lagunas B"), "CP RIVAS LAS LAGUNAS B");
    assert.strictEqual(normalizeTeamName("H.C. Rivas"), "HC RIVAS");
    assert.strictEqual(normalizeTeamName("  CP  Rivas  Las   Lagunas  "), "CP RIVAS LAS LAGUNAS");
    assert.strictEqual(normalizeTeamName("Majadahonda H.C."), "MAJADAHONDA HC");
  });

  it("should detect Rivas team variations", () => {
    assert.strictEqual(isRivasTeam("CP RIVAS LAS LAGUNAS"), true);
    assert.strictEqual(isRivasTeam("CP Rivas Las Lagunas A"), true);
    assert.strictEqual(isRivasTeam("CP RIVAS LAS LAGUNAS B"), true);
    assert.strictEqual(isRivasTeam("HOCKEY RIVAS LAS LAGUNAS HC"), true);
    assert.strictEqual(isRivasTeam("C.P. Rivas Las Lagunas"), true);
    assert.strictEqual(isRivasTeam("Rivas Las Lagunas"), true);
    assert.strictEqual(isRivasTeam("UP RIVAS"), false);
    assert.strictEqual(isRivasTeam("VELOCIDAD RIVAS"), false);
    assert.strictEqual(isRivasTeam("CP ALCOBENDAS"), false);
  });

  it("should generate stable sourceMatchId hashes", () => {
    const match1 = {
      modalidad: "HOCKEY PATINES",
      competicion: "1ª AUTONÓMICA MASCULINA",
      fecha: "30/05/2026",
      hora: "17:00",
      local: "CP RIVAS LAS LAGUNAS",
      visitante: "STA Mª DEL PILAR",
      pista: "POL MUNICIPAL CERRO TELEGRAFO PISTA 1",
    };

    const id1 = createFmpSourceMatchId(match1);
    const id2 = createFmpSourceMatchId(match1);
    assert.strictEqual(id1, id2);
    assert.strictEqual(typeof id1, "string");
    assert.strictEqual(id1.length, 64); // SHA-256 is 64 hex characters
  });
});

describe("FMP Category and Formatters", () => {
  it("should detect categories correctly", () => {
    assert.strictEqual(detectFmpCategory("LIGA REGULAR BENJAMIN").key, "benjamin");
    assert.strictEqual(detectFmpCategory("COPA INFANTIL FASE FINAL").key, "infantil");
    assert.strictEqual(detectFmpCategory("LIGA ALEVIN").key, "alevin");
    assert.strictEqual(detectFmpCategory("CTO AUT JUVENIL").key, "juvenil");
    assert.strictEqual(detectFmpCategory("LIGA JUNIOR").key, "junior");
    assert.strictEqual(detectFmpCategory("1ª AUTONOMICA MASC").key, "autonomica_masc_1");
    assert.strictEqual(detectFmpCategory("OK PLATA").key, "ok_plata");
    assert.strictEqual(detectFmpCategory("LIGA DESCONOCIDA").key, "otros");
  });

  it("should format match display fields", () => {
    assert.strictEqual(
      formatFmpDateTimeForDisplay({ scheduledDate: "2026-05-24", scheduledTime: "12:00" }),
      "24/5/2026, 12:00:00"
    );
    assert.strictEqual(
      formatFmpDateTimeForDisplay({ scheduledDate: "2026-05-24", scheduledTime: null }),
      "24/5/2026, Hora por confirmar"
    );

    assert.strictEqual(
      formatFmpMatchTitle({ local: "Local", visitante: "Visitante" }),
      "Local vs Visitante"
    );
    assert.strictEqual(
      formatFmpMatchTitle({ local: null, visitante: null }),
      "Equipo por confirmar vs Equipo por confirmar"
    );

    assert.strictEqual(formatFmpVenue({ pista: "Pista 1" }), "Pista 1");
    assert.strictEqual(formatFmpVenue({ pista: null }), "Ubicación por confirmar");
  });

  it("should compare matches by date and time, placing no-time at the end of the day", () => {
    const m1 = { scheduledDate: "2026-05-24", scheduledTime: "10:00" } as FmpMatch;
    const m2 = { scheduledDate: "2026-05-24", scheduledTime: "12:00" } as FmpMatch;
    const m3 = { scheduledDate: "2026-05-24", scheduledTime: null } as FmpMatch;
    const m4 = { scheduledDate: "2026-05-25", scheduledTime: "09:00" } as FmpMatch;

    const matches = [m3, m4, m2, m1];
    matches.sort(compareFmpMatchesByDateTime);

    assert.strictEqual(matches[0], m1);
    assert.strictEqual(matches[1], m2);
    assert.strictEqual(matches[2], m3); // End of day 24
    assert.strictEqual(matches[3], m4); // Next day
  });

  it("should group and sort matches by category", () => {
    const m1 = { categoriaKey: "alevin", categoriaLabel: "Alevín", categoriaSortOrder: 110, scheduledDate: "2026-05-24", scheduledTime: "10:00" } as FmpMatch;
    const m2 = { categoriaKey: "autonomica_masc_1", categoriaLabel: "1ª Autonómica Masculina", categoriaSortOrder: 40, scheduledDate: "2026-05-24", scheduledTime: "12:00" } as FmpMatch;
    
    const groups = groupFmpMatchesByCategory([m1, m2]);
    assert.strictEqual(groups.length, 2);
    // Autonómica should come first (sortOrder 40 < 110)
    assert.strictEqual(groups[0].categoriaKey, "autonomica_masc_1");
    assert.strictEqual(groups[1].categoriaKey, "alevin");
  });
});

describe("FMP Table HTML Parser", () => {
  it("should parse FMP table rows from fixture", () => {
    const fixturePath = path.join(__dirname, "fixtures", "fmp-table-sample.html");
    const html = fs.readFileSync(fixturePath, "utf8");

    // Stub/override Date to ensure the test date range covers 2026-05-24 and 2026-05-30
    const originalDate = global.Date;
    const mockToday = new Date("2026-05-24T00:00:00+02:00");
    
    // Temporarily stub Date to freeze "today"
    // @ts-ignore
    global.Date = class extends originalDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(mockToday.getTime());
        } else {
          // @ts-ignore
          super(...args);
        }
      }
    };

    try {
      const matches = parseFmpTable(html);
      
      // We expect 4 matches to be parsed from the fixture
      assert.strictEqual(matches.length, 4);

      // Match 1: Rivas Visitor
      const matchVisitor = matches.find((m) => m.local === "CDE EL CASAR C");
      assert.ok(matchVisitor);
      assert.strictEqual(matchVisitor.isRivasLocal, false);
      assert.strictEqual(matchVisitor.isRivasVisitante, true);
      assert.strictEqual(matchVisitor.rival, "CDE EL CASAR C");
      assert.strictEqual(matchVisitor.scheduledDate, "2026-05-24");
      assert.strictEqual(matchVisitor.scheduledTime, "09:30");
      assert.strictEqual(matchVisitor.scheduledStartIso, "2026-05-24T09:30:00+02:00");
      assert.strictEqual(matchVisitor.pista, "INSTALACION DEPORTIVA MUNIC. EL CASAR");
      assert.strictEqual(matchVisitor.resultado, null);

      // Match 2: Rivas Local
      const matchLocal = matches.find((m) => m.visitante === "CHP MAJADAHONDA");
      assert.ok(matchLocal);
      assert.strictEqual(matchLocal.isRivasLocal, true);
      assert.strictEqual(matchLocal.isRivasVisitante, false);
      assert.strictEqual(matchLocal.rival, "CHP MAJADAHONDA");
      assert.strictEqual(matchLocal.scheduledDate, "2026-05-24");
      assert.strictEqual(matchLocal.scheduledTime, "17:15");
      assert.strictEqual(matchLocal.scheduledStartIso, "2026-05-24T17:15:00+02:00");
      assert.strictEqual(matchLocal.pista, "POL MUNICIPAL CERRO TELEGRAFO PISTA 1");

      // Match 3: Empty Time
      const matchNoTime = matches.find((m) => m.competicion === "COPA JMG ALEVÍN 1ª DIV - FASE FINAL");
      assert.ok(matchNoTime);
      assert.strictEqual(matchNoTime.hora, null);
      assert.strictEqual(matchNoTime.scheduledTime, null);
      assert.strictEqual(matchNoTime.scheduledStartIso, null);
      assert.strictEqual(matchNoTime.pista, null);

      // Match 4: With Score
      const matchWithScore = matches.find((m) => m.resultado === "2 - 3");
      assert.ok(matchWithScore);
      assert.strictEqual(matchWithScore.resultado, "2 - 3");
    } finally {
      // Restore Date
      global.Date = originalDate;
    }
  });
});
