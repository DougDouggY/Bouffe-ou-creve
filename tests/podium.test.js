import test from "node:test";
import assert from "node:assert/strict";
import { ReplayClock } from "../replay-clock.js";
import { beginResults, recordResults } from "../match-results.js";
import { COSMETIC_CATALOG, normalizeCosmetics } from "../cosmetic-catalog.js";
import { mergeProfileProgress } from "../profile-storage.js";
import {
  createSimulation,
  checkpoint,
  restoreSimulation,
} from "../multiplayer-simulation.js";
function game(teamSize = 1) {
  return {
    teamSize,
    phase: "moving",
    outcome: null,
    round: 4,
    people: Array.from({ length: 8 }, (_, id) => ({
      id,
      name: "G" + id,
      human: id < 4,
      teamId: Math.floor(id / Math.max(1, teamSize)),
      alive: true,
      cosmetics: { hat: "chef", outfit: "cook" },
    })),
  };
}
const death = (person, id) => ({
  kind: "elimination",
  person,
  ...(id === null ? {} : { eliminatedBy: { id } }),
});
test("delayed recordings always start at zero; buffering and long tasks never skip to the end", () => {
  const c = new ReplayClock();
  assert.equal(c.sample(5000, false), null);
  assert.equal(c.sample(9000, true), 0);
  assert.equal(c.sample(9016, true), 16);
  assert.equal(c.sample(14016, true), 116);
  assert.equal(c.stalls, 1);
  assert.equal(c.sample(14032, true), 132);
  const early = new ReplayClock();
  assert.equal(early.sample(10, true, 310), 0);
  assert.equal(early.sample(110, true), 0);
  assert.equal(early.sample(326, true), 16);
});
test("podium uses chronological true eliminations, counts AI meals and permits the same human in multiple distinctions", () => {
  const g = game(),
    t = beginResults(g);
  g.people[7].alive = false;
  g.people[1].alive = false;
  assert.equal(
    recordResults(t, g, [death(7, 0), death(1, 0), death(7, 0)]),
    null,
  );
  g.phase = "ended";
  g.outcome = "win";
  for (const p of g.people) p.alive = p.id === 0;
  const r = recordResults(t, g, [death(2, 0), death(3, 4)]);
  assert.deepEqual(r.champions, [0]);
  assert.deepEqual(r.predators, [0]);
  assert.equal(r.predatorKills, 3);
  assert.equal(r.first, 7);
  assert.equal(recordResults(t, g, [death(5, 0)]), null);
});
test("team champion includes dead allies; ties stay exact, human tie preference never replaces a superior AI score", () => {
  const g = game(2),
    t = beginResults(g);
  recordResults(t, g, [
    death(2, 4),
    death(3, 4),
    death(5, 0),
    death(6, 0),
    death(1, 0),
  ]);
  g.phase = "ended";
  g.outcome = "win";
  for (const p of g.people) p.alive = p.id === 0;
  const r = recordResults(t, g, []);
  assert.deepEqual(r.champions, [0, 1]);
  assert.deepEqual(r.predators, [0, 4]);
  assert.equal(r.predatorKills, 2);
  assert.equal(r.teamId, 0);
  const g2 = game(),
    t2 = beginResults(g2);
  recordResults(t2, g2, [death(1, 4), death(2, 4), death(3, 4), death(5, 0)]);
  g2.phase = "ended";
  g2.outcome = "draw";
  g2.people.forEach((p) => (p.alive = false));
  const r2 = recordResults(t2, g2, []);
  assert.deepEqual(r2.champions, []);
  assert.deepEqual(r2.predators, [4]);
});
test("empty or environmental results never fabricate a winner or predator", () => {
  const g = game(),
    t = beginResults(g);
  g.phase = "ended";
  g.outcome = "draw";
  g.people.forEach((p) => (p.alive = false));
  let r = recordResults(t, g, []);
  assert.equal(r.first, null);
  assert.deepEqual(r.predators, []);
  assert.deepEqual(r.champions, []);
  const t2 = beginResults(g);
  r = recordResults(t2, g, [death(3, null)]);
  assert.equal(r.first, 3);
  assert.equal(r.predatorKills, 0);
});
test("new cosmetic slots validate real catalog IDs and preserve independent purchases and equip changes", () => {
  const extra = {
    aura: "aura_ketchup",
    podium: "podium_jump",
    title: "title_3",
  };
  assert.deepEqual(
    normalizeCosmetics({ ...extra, hat: "chef", outfit: "cook" }),
    { ...extra, hat: "chef", outfit: "cook" },
  );
  assert.deepEqual(
    normalizeCosmetics({ aura: "fake", podium: "chef", title: "<img>" }),
    { hat: "none", outfit: "plain" },
  );
  assert.equal(
    COSMETIC_CATALOG.filter((c) => c.slot === "aura" && c.price > 0).length,
    5,
  );
  assert.equal(
    COSMETIC_CATALOG.filter((c) => c.slot === "podium" && c.price > 0).length,
    5,
  );
  assert.equal(
    COSMETIC_CATALOG.filter((c) => c.slot === "title" && c.price > 0).length,
    8,
  );
  const base = {
      points: 1000,
      owned: ["none", "plain"],
      equipped: { hat: "none", outfit: "plain" },
    },
    current = structuredClone(base),
    latest = structuredClone(base);
  current.points -= 180;
  current.owned.push("aura_ketchup");
  current.equipped.aura = "aura_ketchup";
  latest.equipped.title = "title_0";
  const merged = mergeProfileProgress(current, base, latest);
  assert.equal(merged.points, 820);
  assert.equal(merged.equipped.aura, "aura_ketchup");
  assert.equal(merged.equipped.title, "title_0");
});
test("equipped effects and exact results survive authoritative checkpoint/reconnect; legacy checkpoints remain valid", () => {
  const cosmetics = {
      hat: "chef",
      outfit: "cook",
      aura: "aura_gold",
      podium: "podium_burp",
      title: "title_4",
    },
    humans = [{ id: "doug", seat: 0, name: "Doug", cosmetics }];
  const g = createSimulation(8, 12, humans);
  g.results = { champions: [0], predators: [0], predatorKills: 3, first: 1 };
  let saved = checkpoint(g);
  const restored = restoreSimulation(saved, 12, humans);
  assert.deepEqual(restored.people[0].cosmetics, cosmetics);
  assert.deepEqual(restored.results, g.results);
  delete saved.state.results;
  const old = restoreSimulation(saved, 12, humans);
  assert.equal(old.results, null);
  g.destroy();
  restored.destroy();
  old.destroy();
});
