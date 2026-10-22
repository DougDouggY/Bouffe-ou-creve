import test from "node:test";
import assert from "node:assert/strict";
import {
  arenaSize,
  arenaOutline,
  arenaBorderBodies,
  containsArenaPoint,
} from "../arena-bounds.js";
import { REMOVED_MAPS } from "../map-catalog.js";
test("one fixed world size per mode, shared by volcano and every normal map", () => {
  assert.deepEqual(arenaSize("classic"), { w: 3600, h: 2700 });
  assert.deepEqual(arenaSize("gros"), { w: 3600, h: 2700 });
  assert.deepEqual(arenaSize("usa"), { w: 3600, h: 2700 });
  for (const id of ["cuisine", "foodcourt"]) assert(REMOVED_MAPS.has(id));
  assert.deepEqual(
    arenaBorderBodies("market", 2400, 1800),
    arenaBorderBodies("nightmarket", 2400, 1800),
  );
});
test("ship outline excludes sea and table bounds preserve a route into the royal mouth", () => {
  const w = 2400,
    h = 1800;
  assert(containsArenaPoint("pirate", { x: w * 0.5, y: h * 0.5 }, w, h));
  for (const p of [
    { x: w * 0.05, y: h * 0.5 },
    { x: w * 0.95, y: h * 0.5 },
    { x: w * 0.15, y: h * 0.1 },
  ])
    assert.equal(containsArenaPoint("pirate", p, w, h), false);
  assert(containsArenaPoint("royal", { x: w * 0.5, y: h * 0.14 }, w, h));
  assert.equal(
    containsArenaPoint("royal", { x: w * 0.2, y: h * 0.14 }, w, h),
    false,
  );
  assert.equal(
    containsArenaPoint("royal", { x: w * 0.5, y: h * 0.9 }, w, h),
    false,
  );
  for (const id of ["royal", "pirate", "cold"])
    assert(arenaOutline(id, w, h).length >= 4);
});
