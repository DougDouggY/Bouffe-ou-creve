import test from "node:test";
import assert from "node:assert/strict";
import { hungerZone, hungerStart, insideHungerZone } from "../hunger-games.js";
test("Hunger Games starts evenly in a circle and shrinks only from round four", () => {
  const w = 3600,
    h = 2700;
  assert.deepEqual(hungerZone(w, h, 1), hungerZone(w, h, 3));
  for (let round = 4; round < 50; round++)
    assert(hungerZone(w, h, round).r < hungerZone(w, h, round - 1).r);
  for (let i = 0; i < 50; i++) {
    const p = hungerStart(w, h, i, 50);
    assert(insideHungerZone(p, 30, hungerZone(w, h, 1)));
    assert(Math.abs(Math.hypot(p.x - w / 2, p.y - h / 2) - h * 0.16) < 1e-8);
    const next = hungerStart(w, h, (i + 1) % 50, 50);
    assert(Math.hypot(p.x - next.x, p.y - next.y) > 50);
  }
  const zone = hungerZone(w, h, 4);
  assert(!insideHungerZone({ x: zone.x + zone.r - 30, y: zone.y }, 30, zone));
  assert(insideHungerZone({ x: zone.x, y: zone.y }, 30, zone));
});
