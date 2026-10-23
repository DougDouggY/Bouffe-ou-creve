import test from "node:test";
import assert from "node:assert/strict";
import { mergeProfileProgress } from "../profile-storage.js";
const profile = () => ({
  points: 1000,
  earned: 1000,
  wins: 0,
  trophies: {},
  modeWins: { classic: 0, gros: 0 },
  owned: ["none", "plain"],
  equipped: { hat: "none", outfit: "plain" },
  shadow: { trophies: {}, wins: { somalia: 0 } },
});
test("a stale tab preserves trophies, victories and purchases from another tab", () => {
  const baseline = profile(),
    recent = profile(),
    stale = profile();
  recent.trophies["classic-win"] = 123;
  recent.modeWins.classic = 1;
  recent.wins = 1;
  recent.points = 800;
  recent.owned.push("chef");
  recent.equipped.hat = "chef";
  recent.shadow.trophies["shadow-somalia-win"] = 456;
  stale.earned += 50;
  stale.points += 50;
  const result = mergeProfileProgress(stale, baseline, recent);
  assert.equal(result.points, 850);
  assert.equal(result.modeWins.classic, 1);
  assert.equal(result.wins, 1);
  assert.equal(result.trophies["classic-win"], 123);
  assert.equal(result.shadow.trophies["shadow-somalia-win"], 456);
  assert(result.owned.includes("chef"));
  assert.equal(result.equipped.hat, "chef");
  const next = structuredClone(result);
  next.points -= 100;
  next.owned.push("crown");
  next.equipped.hat = "crown";
  assert.equal(mergeProfileProgress(next, result, result).points, 750);
});
test("backup recovery unions normal and hidden trophies without awarding new achievements", () => {
  const current = profile(),
    backup = profile();
  current.trophies.a = 200;
  backup.trophies.a = 100;
  backup.trophies.b = 300;
  backup.modeWins.classic = 1;
  backup.points = 2000;
  const recovered = mergeProfileProgress(current, null, backup);
  assert.deepEqual(recovered.trophies, { a: 100, b: 300 });
  assert.equal(recovered.points, 1000);
  assert.equal(recovered.modeWins.classic, 1);
});
