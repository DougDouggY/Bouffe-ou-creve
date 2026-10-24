// Baseline decisions come from the pre-optimization engine with the same explicit
// salad balance. Hashes include every shot, intent and target, in stable seat order.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { zt as Game } from "../simulation-core.js";
import { seededRandom } from "../multiplayer-simulation.js";
const rows = JSON.parse(
  await readFile(new URL("./fixtures/ai-plans-before.json", import.meta.url)),
);
let plans = 0;
const timings = [];
for (const { count, mapId, seed, sha256 } of rows) {
  const g = new Game(2400, 1800, seededRandom(seed), {
    count,
    mode: count === 8 ? "classic" : "gros",
    mapId,
  });
  if (seed === 77)
    for (let i = 0; i < count; i++) g.resize(g.people[i], 60 + (i % 5) * 70);
  const start = performance.now();
  const result = g.people.map((p) => ({
    shot: g.plan(p),
    intent: p.intent,
    target: p.target,
  }));
  timings.push({ count, mapId, seed, ms: performance.now() - start });
  assert.equal(
    createHash("sha256").update(JSON.stringify(result)).digest("hex"),
    sha256,
    `${count}/${mapId}/${seed}`,
  );
  plans += count;
  g.destroy();
}
console.log(
  JSON.stringify({ plans, exactBaselineMatch: true, timings }, null, 2),
);
