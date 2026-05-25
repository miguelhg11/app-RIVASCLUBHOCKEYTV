import test from "node:test";
import assert from "node:assert/strict";
import { isRivasTeam, normalizeTeamName } from "../../src/lib/federations/shared/club-identity";

test("normalizeTeamName removes accents and extra spaces", () => {
  const value = normalizeTeamName("  CP Rívas   Las  Lagunas  ");
  assert.equal(value, "CP RIVAS LAS LAGUNAS");
});

test("isRivasTeam matches exact RIVAS token", () => {
  assert.equal(isRivasTeam("ADISS Hockey Rivas"), true);
  assert.equal(isRivasTeam("CP RIVAS A LAS LAGUNAS"), true);
  assert.equal(isRivasTeam("RIVASPORT CLUB"), false);
});

test("isRivasTeam exclusions still apply", () => {
  assert.equal(isRivasTeam("UP RIVAS PATINAJE"), false);
  assert.equal(isRivasTeam("Velocidad Rivas"), false);
});
