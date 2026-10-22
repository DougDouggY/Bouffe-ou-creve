import test from "node:test";
import assert from "node:assert/strict";
import {
  rollGlobalSpecial,
  pointSegmentDistance,
  segmentsDistance,
} from "../arena-mechanics.js";
import { lightRadius } from "../visibility.js";
test("one global roll per round, equal conditional choice, exact 1% boundary", () => {
  let calls = 0;
  assert.equal(
    rollGlobalSpecial(() => {
      calls++;
      return 0.01;
    }),
    null,
  );
  assert.equal(calls, 1);
  for (const [choice, expected] of [
    [0, "armored"],
    [0.4999, "armored"],
    [0.5, "inferno"],
    [0.9999, "inferno"],
  ]) {
    const values = [0.009999, choice];
    calls = 0;
    assert.equal(
      rollGlobalSpecial(() => {
        calls++;
        return values.shift();
      }),
      expected,
    );
    assert.equal(calls, 2);
  }
  let count = 0,
    armored = 0,
    inferno = 0;
  for (let i = 0; i < 10000; i++) {
    const values = [i / 10000, i % 2 ? 0.75 : 0.25];
    const item = rollGlobalSpecial(() => values.shift());
    if (item) {
      count++;
      if (item === "armored") armored++;
      else inferno++;
    }
  }
  assert.deepEqual(
    { count, armored, inferno },
    { count: 100, armored: 50, inferno: 50 },
  );
});
test("swept fire detection catches crossing segments and finite endpoints", () => {
  assert.equal(
    segmentsDistance(
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 10, y: -10 },
      { x: 10, y: 10 },
    ),
    0,
  );
  assert.equal(
    segmentsDistance(
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
    ),
    5,
  );
  assert.equal(
    pointSegmentDistance({ x: 0, y: 3 }, { x: 0, y: 0 }, { x: 0, y: 0 }),
    3,
  );
});
test("lamp expands the same radial visibility used by rendering and AI", () => {
  const normal = lightRadius("nightmarket", { r: 25 }),
    boost = lightRadius("nightmarket", { r: 25, lightBoost: 1.8 });
  assert.equal(boost, normal * 1.8);
  assert.equal(lightRadius("market", { r: 25, lightBoost: 1.8 }), 300);
});
